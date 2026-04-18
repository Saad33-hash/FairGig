const express = require('express');
const http = require('http');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/authMiddleware');

router.use(authMiddleware);
router.use(requireRole('advocate'));

const ANALYTICS_URL = process.env.ANALYTICS_SERVICE_URL || 'http://localhost:8001';

function proxyGet(path, res) {
  const req = http.request(`${ANALYTICS_URL}${path}`, (upstream) => {
    let body = '';
    upstream.on('data', (chunk) => { body += chunk; });
    upstream.on('end', () => {
      try { res.status(upstream.statusCode).json(JSON.parse(body)); }
      catch { res.status(502).json({ message: 'Analytics service returned invalid response' }); }
    });
  });
  req.on('error', () => res.status(503).json({ message: 'Analytics service unavailable' }));
  req.setTimeout(5000, () => { req.destroy(); res.status(504).json({ message: 'Analytics service timed out' }); });
  req.end();
}

router.get('/commission-trends',    (_req, res) => proxyGet('/advocate/commission-trends', res));
router.get('/income-distribution',  (_req, res) => proxyGet('/advocate/income-distribution', res));
router.get('/top-complaints',       (_req, res) => proxyGet('/advocate/top-complaints', res));
router.get('/vulnerability-flags',  (_req, res) => proxyGet('/advocate/vulnerability-flags', res));

module.exports = router;
