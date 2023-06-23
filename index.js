const express = require('express')
const mariadb = require('mariadb');

const PORT = 3000

const pool = mariadb.createPool({
     host: 'precios-1.c0f6dm2ucnlg.us-east-2.rds.amazonaws.com', 
     user:'candidatoPrueba', 
     password: 'gaspre21.M',
     port: 3306,
     database: 'prueba',
     connectionLimit: 5
});

const app = express()

//Midleware para conectarse a la DB antes de recibir la ruta
app.use(async (req, res, next) => {
    try {
      req.db = await pool.getConnection();
      next();
    } catch (err) {
      console.error('Error al conectar a la base de datos MariaDB', err);
      res.status(500).json({ error: 'Error al conectar a la base de datos' });
    }
});


//Ruta de consumo del servicio, que recibe el Id de la Marca
app.get('/api/station/:id',async (req, res)=>{
    const id = Number(req.params.id)
    const map = {}

    const query_brand = `SELECT m.name 
                   FROM stations_brands u
                   JOIN brands m ON u.id = m.id
                   WHERE u.id = ?`
                   
    const query_distances = `SELECT v.distance 
                   FROM stations_brands u
                   JOIN stations m ON u.cre_id = m.cre_id
                   JOIN stations_competitors v ON m.cre_id = v.cre_id
                   WHERE u.id = ?`

    const query_prices = `SELECT p.value
                   FROM stations_brands u
                   JOIN stations m ON u.cre_id = m.cre_id
                   JOIN prices p ON m.cre_id = p.cre_id
                   WHERE u.id = ?`

    const query_stations_names = `SELECT s.name
                   FROM stations_brands u
                   JOIN stations s ON u.cre_id = s.cre_id
                   WHERE u.id = ?`
    try {
        const brand = await req.db.query(query_brand, [id]);
        const distance = await req.db.query(query_distances, [id]);
        const prices = await req.db.query(query_prices, [id]);
        const stations_names = await req.db.query(query_stations_names, [id]);

        let result = {
            "marca": brand,
            "distancias": distance,
            "precios_productos": prices,
            "nombres_estaciones": stations_names,
        }
        
        res.json(result);

      } catch (err) {
        console.error('Error al obtener los datos', err);
        res.status(500).json({ error: 'Error al obtener los datos' });
      }
})

// En caso de que la ruta no se encuentre
app.use((req, res) => {
    res.status(404).send('Ruta no encontrada');
});

// Midleware para cerrar la conexión 
app.use((req, res, next) => {
    if (req.db) {
      req.db.release();
    }
    next();
});

app.listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}`)
})