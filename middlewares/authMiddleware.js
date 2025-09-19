const axios = require('axios');

module.exports = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'Token manquant' });

  const token = authHeader.split(' ')[1];

  try {
    const strapiResponse = await axios.get(`${process.env.STRAPI_URL}/api/users/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    req.user = strapiResponse.data;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token invalide', error: error.response?.data || error.message });
  }
};
