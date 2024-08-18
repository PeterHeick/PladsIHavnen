import express, { Request, Response } from 'express';
import https from 'https';
import fs from 'fs';
import cors from 'cors';
import path from 'path';

import * as mimeTypes from 'mime';
import apiRoutes from './routes/marker';
import 'dotenv/config';

const app = express();
const PORT = 3003;

const docRoot = path.join(__dirname, '..', 'frontend', 'dist');
console.log('docRoot:', docRoot);

// const docRoot = "/home/peter/projects/er-der-plads-i-havnen/frontend/dist";

console.log(__dirname);
// SSL Certifikat og Nøgle
const sslOptions = {
  key: fs.readFileSync('/usr/src/app/ssl/server.key'),
  cert: fs.readFileSync('/usr/src/app/ssl/server.cert')
};

const corsOptions: cors.CorsOptions = {
  origin: [
    // 'https://localhost:3003',
    'https://unisoft.dk:3003',
    'https://unisoft.dk:80'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(
  express.static(docRoot, {
    setHeaders: (res, path) => {
      const contentType = mimeTypes.getType(path);
      if (contentType) {
        res.setHeader("Content-Type", contentType);
      }

      // Tilføj Content-Security-Policy header
      res.setHeader(
        "Content-Security-Policy",
        // "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;"
        // "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://maps.googleapis.com; img-src 'self' data: https://*.googleapis.com https://*.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com;"
        "default-src 'self' https://maps.googleapis.com; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://maps.googleapis.com; img-src 'self' data: https://*.googleapis.com https://*.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://maps.googleapis.com"  
      );

      // Tilføj X-Content-Type-Options header
      res.setHeader("X-Content-Type-Options", "nosniff");
    },
  })
);

app.use((req: Request, res: Response, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-eval' https://maps.googleapis.com; img-src 'self' data: https://*.googleapis.com https://*.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com;"
  );
  next();
});

app.use('/api', apiRoutes);

app.get('/', (req, res) => {
  res.sendFile(path.join(docRoot, 'index.html'));
});

// Brug HTTPS i stedet for HTTP
https.createServer(sslOptions, app).listen(PORT, () => {
  console.log(`Server running on https://unisoft.dk:${PORT}`);
});

