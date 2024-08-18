import { Router } from 'express';
import { Request, Response } from 'express';
import pool from './db';

const router = Router();


// GET all harbors
// router.get('/harbors', async (req: Request, res: Response) => {
//   try {
//     const result = await pool.query('SELECT * FROM harbors');
//     console.log("/harbors GET: result.rows ", result.rows)
//     res.json(result.rows);
//   } catch (err) {
//     console.error(err);
//     res.status(500).send('Server error');
//   }
// });

// GET a single harbor by ID
router.get('/harbor', async (req: Request, res: Response) => {
  const name = req.query.name;
  console.log("/harbor GET: name ", name);

  if (!name) {
    return res.status(400).send('Harbor name is required');
  }

  try {
    const result = await pool.query(`
      SELECT id,
      name,
      ST_X(position::geometry) as lng,
      ST_Y(position::geometry) as lat,
      facilities,
      capacity,
      available_spots FROM harbors WHERE name = $1`, [name]
    );

    if (result.rows.length === 0) {
      console.log("Harbor not found")
      return res.status(404).send('Harbor not found');
    }

    const harbor = {
      id: result.rows[0].id,
      name: result.rows[0].name,
      position: {
        lng: result.rows[0].lng,
        lat: result.rows[0].lat,
      },
      facilities: result.rows[0].facilities,
      capacity: result.rows[0].capacity,
      available_spots: result.rows[0].available_spots,
    };
    console.log("result ", result.rows[0])
    res.status(201).json(harbor);
    // res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// POST a new harbor
router.post('/harbors', async (req: Request, res: Response) => {
  const { name, position } = req.body;
  console.log("/harbors POST: req.body ", JSON.stringify(req.body));
  try {
    const result = await pool.query(
      `INSERT INTO harbors (name, position, facilities, capacity, available_spots)
       VALUES ($1, ST_SetSRID(ST_MakePoint($2, $3), 4326), $4, $5, $6)
       RETURNING ID, name, ST_X(position::geometry) as lng, ST_Y(position::geometry) as lat, facilities, capacity, available_spots`,
      [name, position.lng, position.lat, '{}', 0, 0]
    );
    const row = result.rows[0];
    const harbor = {
      id: row.id,
      name: row.name,
      position: { lat: row.lat, lng: row.lng },
      facilities: row.facilities,
      capacity: row.capacity,
      available_spots: row.available_spots,
    };
    res.status(201).json(harbor);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// PUT to update harbor position by name
router.put('/harbors/:name/position', async (req: Request, res: Response) => {
  const { name } = req.params;
  const { position } = req.body;
  console.log("/harbors PUT: req.body ", JSON.stringify(req.body));
  
  try {
    const result = await pool.query(
      `UPDATE harbors SET position = ST_SetSRID(ST_MakePoint($1, $2), 4326) WHERE name = $3 RETURNING *`,
      [position.lng, position.lat, name]
    );

    if (result.rowCount === 0) {
      return res.status(404).send('Harbor not found');
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Den her er vist overflødig
// GET all markers for a harbor
router.get('/markers', async (req: Request, res: Response) => {
  const { harborID } = req.query;
  console.log("/markers GET: req.query ", JSON.stringify(req.query));
  if (!harborID) {
    return res.status(400).send('Harbor id is required');
  }

  try {
    const result = await pool.query(`
      SELECT 
        uuid, 
        name, 
        type, 
        ST_X(position::geometry) as lng, 
        ST_Y(position::geometry) as lat
      FROM markers
      WHERE harbor_id = $1;
    `, [harborID]);

    const list = result.rows.map((row: any) => ({
      uuid: row.uuid,
      position: { lat: row.lat, lng: row.lng },
      type: row.type,
      name: row.name
    }));

    console.log("list ", JSON.stringify(list))
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// POST a new marker
router.post('/markers', async (req: Request, res: Response) => {
  const { position, type, name, harborID } = req.body;
  console.log("/markers POST: req.body ", JSON.stringify(req.body));
  try {
    const query = `
       INSERT INTO markers (harbor_id, position, type, name)
       VALUES ($1, ST_SetSRID(ST_MakePoint($2, $3), 4326), $4, $5)
       RETURNING uuid`
    console.log("/POST markers: db query ", query)
    console.log("/POST markers: db query params ", [harborID, position.lng, position.lat, type, name])

    const result = await pool.query(
      query,
      [harborID, position.lng, position.lat, type, name]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// DELETE a single marker by ID
router.delete('/markers/:uuid', async (req: Request, res: Response) => {
  const { uuid } = req.params;
  console.log("/markers DELETE: req.params ", JSON.stringify(req.params));
  try {
    const result = await pool.query('DELETE FROM markers WHERE UUID = $1 RETURNING *', [uuid]);
    if (result.rowCount === 0) {
      return res.status(404).send('Marker not found');
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

router.get('/nearest-markers', async (req: Request, res: Response) => {
  const { latitude, longitude, radius = 5000 } = req.query;

  console.log("/nearest-markers GET: req.query ", JSON.stringify(req.query));
  try {
    const sql =`
      SELECT 
        uuid,
        harbor_id,
        ST_X(ST_Transform(position::geometry, 4326)) as lng,
        ST_Y(ST_Transform(position::geometry, 4326)) as lat,
        name, 
        type,
        ST_Distance(position, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) as distance
      FROM markers
      WHERE ST_DWithin(position, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3)
      ORDER BY distance
    `;
    console.log("/nearest-markers GET: sql ", sql);
    const result = await pool.query(sql, [longitude, latitude, radius]);

    const list = result.rows.map((row: any) => ({
      uuiid: row.id,
      harbor_id: row.harbor_id,
      position: { lat: row.lat, lng: row.lng },
      type: row.type,
      name: row.name,
    }));

    console.log("result ", list)
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while fetching nearby markers' });
  }
});

router.get('/nearest-harbors', async (req: Request, res: Response) => {
  const { latitude, longitude, radius = 20000 } = req.query;

  console.log("/nearest-harbors GET: req.query ", JSON.stringify(req.query));
  try {
    const result = await pool.query(`
      SELECT 
        id,
        name, 
        ST_X(ST_Transform(position::geometry, 4326)) as lng,
        ST_Y(ST_Transform(position::geometry, 4326)) as lat,
        facilities,
        capacity,
        available_spots,
        ST_Distance(position, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) as distance
      FROM harbors
      WHERE ST_DWithin(position, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3)
      ORDER BY distance
      LIMIT 10
    `, [longitude, latitude, radius]);

    const list = result.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      position: { lat: row.lat, lng: row.lng },
      facilities: row.facilities,
      capacity: row.capacity,
      available_spots: row.available_spots,
    }));

    console.log("result ", list)
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while fetching nearby harbors' });
  }
});

// PUT to update harbor position by name
router.put('/harbors/:name/position', async (req: Request, res: Response) => {
  const { name } = req.params;
  const { position } = req.body;
  console.log("/harbors PUT: req.body ", JSON.stringify(req.body));
  try {
    const result = await pool.query(
      `UPDATE harbors SET position = ST_SetSRID(ST_MakePoint($1, $2), 4326) WHERE name = $3 RETURNING *`,
      [position.lng, position.lat, name]
    );

    if (result.rowCount === 0) {
      return res.status(404).send('Harbor not found');
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

export default router;
