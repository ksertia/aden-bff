const axios = require('axios');

// Inscription
exports.register = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const strapiResponse = await axios.post(`${process.env.STRAPI_URL}/api/auth/local/register`, {
      username, 
      email, 
      password
    });

    const { jwt, user } = strapiResponse.data;

    res.json({
      jwt,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        roles: user.roles
      }
    });

  } catch (error) {
    console.error('Erreur d\'inscription Strapi:', error.response?.data || error.message);
    res.status(500).json({ message: "Erreur lors de l'inscription", error: error.response?.data || error.message });
  }
};

// Connexion
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const strapiResponse = await axios.post(`${process.env.STRAPI_URL}/api/auth/local`, {
      identifier: email,
      password
    });

    const { jwt, user } = strapiResponse.data;

    res.json({
      jwt,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        roles: user.roles
      }
    });

  } catch (error) {
    console.error('Erreur de connexion Strapi:', error.response?.data || error.message);
    res.status(500).json({ message: "Erreur lors de la connexion", error: error.response?.data || error.message });
  }
};
