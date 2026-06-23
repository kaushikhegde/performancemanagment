// Minimal static server for the built Vite SPA on Azure App Service (Linux/Node).
// Serves dist/ and falls back to index.html for client-side routes.
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, 'dist');

const app = express();

// Serve built static assets (JS/CSS/SVG/etc.)
app.use(express.static(distDir));

// SPA fallback — any other route returns index.html
app.use((_req, res) => {
  res.sendFile(path.join(distDir, 'index.html'));
});

// Azure injects PORT; default to 8080 locally.
const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`Server listening on port ${port}`));
