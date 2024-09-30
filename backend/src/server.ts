import express  from 'express';
import cors from 'cors';
import path from 'path';

import * as mimeTypes from 'mime';
import apiHarborRoutes from './routes/harbor';
import apiMarkerRoutes from './routes/marker';
import 'dotenv/config';
import packageInfo from '../package.json'

const app = express();
const PORT = process.env.PORT || 3003;
const docRoot = process.env.DOC_ROOT || 'NO_DOC_ROOT';
const DOMAIN = process.env.DOMAIN || 'NO_DOMAIN';

const URL = `${DOMAIN}:${PORT}`;
console.log('dirname:', __dirname);
console.log('docRoot:', docRoot);
console.log('CSP_DOMAIN:', URL);

const corsOptions: cors.CorsOptions = {
  origin: [ URL, ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
};

// app.use(cors(corsOptions));
app.use(cors());
app.use(express.json());
app.use(
  express.static(docRoot, {
    setHeaders: (res, path) => {
      const contentType = mimeTypes.getType(path);
      if (contentType) {
        res.setHeader("Content-Type", contentType);
      }

      // Tilføj Content-Security-Policy header

      let csp = "default-src 'self' https://maps.googleapis.com; "
       csp += "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://maps.googleapis.com; "
       csp += "script-src-elem 'self'  'unsafe-inline' https://maps.googleapis.com; "
       csp += "img-src 'self' data: https://*.googleapis.com https://*.gstatic.com; "
       csp += "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
       csp += "font-src 'self' https://fonts.gstatic.com; "
       csp += `worker-src 'self' https://${URL} blob:; `
       csp += `connect-src 'self' https://${URL} http://${URL} https://maps.googleapis.com https://www.gstatic.com/ data:`;

      csp = csp.trim();
      res.setHeader(
        "Content-Security-Policy",
        csp
      );

      // Tilføj X-Content-Type-Options header
      res.setHeader("X-Content-Type-Options", "nosniff");
    },
  })
);

app.use('/api/harbor', apiHarborRoutes);
app.use('/api/marker', apiMarkerRoutes);

app.get('/api/version', (req, res) => {
  res.json({ version: packageInfo.version });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(docRoot, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://${URL}`);
});
