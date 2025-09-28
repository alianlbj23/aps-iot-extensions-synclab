// server.js
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { getPublicToken } = require('./services/aps.js');
const { getSensors, getChannels, getSamples } = require('./services/iot.mocked.js');

// 讀取設定：Port 30000 ; RTSP_HOST預設用docker service name 'rtsp'
const { PORT } = require('./config.js');

const RTSP_HOST = process.env.RTSP_HOST || 'rtsp';
const RTSP_PORT = Number(process.env.RTSP_PORT || 8888);

let app = express();
app.use(express.static('public'));

// Auth token for APS
app.get('/auth/token', async function (req, res, next) {
    try {
        res.json(await getPublicToken());
    } catch (err) {
        next(err);
    }
});

app.get('/iot/sensors', async function (req, res, next) {
    try {
        res.json(await getSensors());
    } catch (err) {
        next(err);
    }
});

app.get('/iot/channels', async function (req, res, next) {
    try {
        res.json(await getChannels());
    } catch (err) {
        next(err);
    }
});

app.get('/iot/samples', async function (req, res, next) {
    try {
        res.json(await getSamples({ start: new Date(req.query.start), end: new Date(req.query.end) }, req.query.resolution));
    } catch (err) {
        next(err);
    }
});

// 只適用 HTTP 端點（HLS / http-flv / websocket-flv 等）
app.use('/stream', createProxyMiddleware({
  target: `http://${RTSP_HOST}:${RTSP_PORT}`,
  changeOrigin: true,
  pathRewrite: { '^/stream': '' },
  onError(err, req, res) {
    console.error('Proxy error:', err);
    if (!res.headersSent) res.status(502).send('Upstream unavailable');
  },
}));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).send(err.message);
});

app.use('/stream', createProxyMiddleware({
  target: `http://${RTSP_HOST}:${RTSP_PORT}`,
  changeOrigin: true,
  pathRewrite: { '^/stream': '' }
}));

// app.listen(PORT, function () { console.log(`Server listening on port ${PORT}...`); });
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on http://localhost:${PORT} (bound on 0.0.0.0)`);
});
