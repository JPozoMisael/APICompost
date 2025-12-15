require('dotenv').config();

module.exports = function checkApiKey(req, res, next) {
  const key = req.header('x-api-key');
  if (!key || key !== process.env.ADMIN_API_KEY) {
    return res.status(401).json({ ok: false, msg: 'API key inválida' });
  }
  next();
};
