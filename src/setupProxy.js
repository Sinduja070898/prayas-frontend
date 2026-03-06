const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
  const apiTarget = process.env.REACT_APP_API_URL || 'http://localhost:5001';
  app.use(
    '/api',
    createProxyMiddleware({
      target: apiTarget,
      changeOrigin: true,
      secure: false,
    })
  );
};
