import { Router } from 'express';
import { Request, Response } from 'express';
import pool from './db';

const router = Router();

// POST a new marker
router.post('/', async (req: Request, res: Response) => {
  const { position, name } = req.body;
  console.log("/markers POST: req.body ");
  console.dir(req.body);
  try {
    const query = `
       INSERT INTO markers (position, name)
       VALUES (ST_SetSRID(ST_MakePoint($1, $2), 4326), $3)
       RETURNING uuid, ST_X(position::geometry) as lng, ST_Y(position::geometry) as lat, name`

    console.log("Peter /POST markers: db query ", query);
    console.log("Peter /POST markers: position", position);
    console.log("Peter /POST markers: lng", position.lng);

    const result = await pool.query(
      query,
      [position.lng, position.lat, name]
    );
    const row = result.rows[0];
    console.log("post markers row result:")
    console.dir(row)
    res.status(201).json({ uuid: row.uuid, position: { lat: row.lat, lng: row.lng }, name: row.name });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// PUT to update marker position by uuid
router.put('/:uuid/position', async (req: Request, res: Response) => {
  const { uuid } = req.params;
  const { position } = req.body;
  console.log("/markers PUT: uuid, req.body ", uuid, JSON.stringify(req.body));
  try {
    const result = await pool.query(
      `UPDATE markers SET position = ST_SetSRID(ST_MakePoint($1, $2), 4326) WHERE uuid = $3 RETURNING *`,
      [position.lng, position.lat, uuid]
    );

    if (result.rowCount === 0) {
      return res.status(404).send('Marker not found');
    }

    console.log("Marker PUT result: ")
    console.dir(result.rows[0])
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

router.get('/', async (req: Request, res: Response) => {
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
        ST_X(position::geometry) as lng, 
        ST_Y(position::geometry) as lat
      FROM markers
      WHERE harbor_id = $1;
    `, [harborID]);

    const list = result.rows.map((row: any) => ({
      uuid: row.uuid,
      name: row.name,
      position: { lat: row.lat, lng: row.lng }
    }));

    console.log("get markers list ");
    console.dir(list)
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

router.get('/visible-markers', async (req: Request, res: Response) => {
  const { northEastLat, northEastLng, southWestLat, southWestLng } = req.query;

  console.log("/visible-markers GET: req.query ");
  console.dir(req.query);
  try {
    const query = `
      SELECT 
        uuid,
        name,
        ST_X(ST_Transform(position::geometry, 4326)) as lng,
        ST_Y(ST_Transform(position::geometry, 4326)) as lat
      FROM markers
      WHERE 
        ST_X(ST_Transform(position::geometry, 4326)) BETWEEN $1 AND $2
        AND ST_Y(ST_Transform(position::geometry, 4326)) BETWEEN $3 AND $4
    `;
    console.log("/visible-markers GET: query ", query);
    const result = await pool.query(query, [southWestLng, northEastLng, southWestLat, northEastLat]);

    const list = result.rows.map((row: any) => ({
      uuid: row.uuid,
      name: row.name,
      position: { lat: row.lat, lng: row.lng }
    }));

    console.log("visible-markers result:")
    console.table(list)
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while fetching visible markers' });
  }
});

// DELETE a single marker by ID
router.delete('/:uuid', async (req: Request, res: Response) => {
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

export default router;
