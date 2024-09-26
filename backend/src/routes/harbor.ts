import { Router } from 'express';
import { Request, Response } from 'express';
import pool from './db';

const router = Router();

// POST a new harbor
router.post('/', async (req: Request, res: Response) => {
  const { name, position } = req.body;
  console.log("\n/harbors POST: req.body ", JSON.stringify(req.body));
  try {
    const result = await pool.query(
      `INSERT INTO harbors (name, position, facilities)
       VALUES ($1, ST_SetSRID(ST_MakePoint($2, $3), 4326), $4)
       RETURNING UUID, name, ST_X(position::geometry) as lng, ST_Y(position::geometry) as lat, facilities`,
      [name, position.lng, position.lat, '{}']
    );
    const row = result.rows[0];
    const harbor = {
      uuid: row.uuid,
      name: row.name,
      position: { lat: row.lat, lng: row.lng },
      facilities: row.facilities
    };
    console.log("harbor POST result: ")
    console.dir(harbor)
    res.status(201).json(harbor);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// DELETE a harbor
router.delete('/:uuid', async (req: Request, res: Response) => {
  const { uuid } = req.params;
  console.log(`\n/harbors DELETE: uuid ${uuid}`);
  try {
    const result = await pool.query(
      'DELETE FROM harbors WHERE uuid = $1 RETURNING *',
      [uuid]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).send('Harbor not found');
    }
    
    console.log(`Harbor deleted: ${uuid}`);
    res.status(200).send('Harbor deleted successfully');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// PUT to update harbor position by name
router.put('/:uuid/position', async (req: Request, res: Response) => {
  const { uuid } = req.params;
  const { position } = req.body;
  console.log("\n/harbor PUT: req.body ", JSON.stringify(req.body));
  try {
    const result = await pool.query(
      `UPDATE harbors SET position = ST_SetSRID(ST_MakePoint($1, $2), 4326) WHERE uuid = $3 RETURNING *`,
      [position.lng, position.lat, uuid]
    );

    if (result.rowCount === 0) {
      return res.status(404).send('Harbor not found');
    }

    console.log("harbor PUT result: ")
    console.dir(result.rows[0])
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

router.get('/', async (req: Request, res: Response) => {
  const name = req.query.name;
  console.log("\n/harbor GET: name ", name);

  if (!name) {
    return res.status(400).send('Harbor name is required');
  }

  const search_term = '%' + name + '%';
  try {
    console.log(`
      SELECT uuid,
      name,
      ST_X(position::geometry) as lng,
      ST_Y(position::geometry) as lat,
      facilities
      FROM harbors WHERE LOWER(name) ILIKE LOWER(${search_term})`);

    const result = await pool.query(`
      SELECT uuid,
      name,
      ST_X(position::geometry) as lng,
      ST_Y(position::geometry) as lat,
      facilities
      FROM harbors WHERE LOWER(name) ILIKE LOWER($1)`, [search_term]
    );

    if (result.rows.length === 0) {
      console.log("Harbor not found")
      return res.status(404).send('Harbor not found');
    }

    const row = result.rows[0];
    const harbor = {
      uuid: row.uuid,
      name: row.name,
      position: {
        lng: row.lng,
        lat: row.lat
      },
      facilities: row.facilities
    };
    console.log("harbor GET name result: ")
    console.dir(harbor)
    res.status(201).json(harbor);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

router.get('/visible-harbors', async (req: Request, res: Response) => {
  const { northEastLat, northEastLng, southWestLat, southWestLng } = req.query;
  console.log( northEastLat, northEastLng, southWestLat, southWestLng );

  console.log("\n/visible-harbors GET: req.query ");
  console.log('dir ');
  console.dir(req.query);
  try {
    const query = `
      SELECT 
        uuid,
        name, 
        ST_X(ST_Transform(position::geometry, 4326)) as lng,
        ST_Y(ST_Transform(position::geometry, 4326)) as lat,
        facilities
      FROM harbors
      WHERE 
        ST_X(ST_Transform(position::geometry, 4326)) BETWEEN $1 AND $2
        AND ST_Y(ST_Transform(position::geometry, 4326)) BETWEEN $3 AND $4
    `;
    console.log("/visible-harbors GET: query ", query);
    const result = await pool.query(query , [southWestLng, northEastLng, southWestLat, northEastLat]);

    const list = result.rows.map((row: any) => ({
      uuid: row.uuid,
      name: row.name,
      position: { lat: row.lat, lng: row.lng },
      facilities: row.facilities
    }));

    console.log("visible-harbors result ")
    console.table(list)
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while fetching visible harbors' });
  }
});

router.get('/nearest-harbor', async (req: Request, res: Response) => {
  const { latitude, longitude, radius = 20000 } = req.query;

  console.log("\n/nearest-harbor GET: req.query ", JSON.stringify(req.query));
  try {
    const result = await pool.query(`
      SELECT 
        uuid,
        name, 
        ST_X(ST_Transform(position::geometry, 4326)) as lng,
        ST_Y(ST_Transform(position::geometry, 4326)) as lat,
        facilities,
        ST_Distance(position, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) as distance
      FROM harbors
      WHERE ST_DWithin(position, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3)
      ORDER BY distance
      LIMIT 10
    `, [longitude, latitude, radius]);

    const row = result.rows[0];
    const harbor = {
      uuid: row.uuid,
      name: row.name,
      position: { lat: row.lat, lng: row.lng },
      facilities: row.facilities
    };

    console.log("get nearest-harbor result: ", harbor)
    res.json(harbor);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while fetching nearby harbor' });
  }
});


// PUT to update harbor facilities by uuid
router.put('/:uuid/facilities', async (req: Request, res: Response) => {
  const { uuid } = req.params;
  const { facilities } = req.body;
  console.log("\n/harbor/:uuid/facilities PUT: req.body ", JSON.stringify(req.body));

  try {
    // Først, hent de eksisterende faciliteter
    const existingResult = await pool.query(
      'SELECT facilities FROM harbors WHERE uuid = $1',
      [uuid]
    );

    if (existingResult.rowCount === 0) {
      return res.status(404).send('Harbor not found');
    }

    // Merge de eksisterende faciliteter med de nye
    const existingFacilities = existingResult.rows[0].facilities || {};
    const updatedFacilities = { ...existingFacilities, ...facilities };

    // Opdater faciliteter i databasen
    const result = await pool.query(
      `UPDATE harbors 
       SET facilities = $1::jsonb 
       WHERE uuid = $2 
       RETURNING *`,
      [JSON.stringify(updatedFacilities), uuid]
    );

    console.log("harbor facilities PUT result: ");
    console.dir(result.rows[0]);
    
    // Send det opdaterede harbor-objekt tilbage
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});


export default router;
