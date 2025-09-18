const axios = require('axios');

// Fonction d'inscription
exports.register = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const strapiResponse = await axios.post(`${process.env.STRAPI_URL}/api/auth/local/register`, {
      username: username, 
      email: email, 
      password: password
    });

    if (strapiResponse.data && strapiResponse.data.jwt && strapiResponse.data.user) {
      const jwt = strapiResponse.data.jwt;
      const user = strapiResponse.data.user;

      res.json({
        jwt: jwt,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          roles: user.roles,
        }
      });
    } else {
      res.status(500).json({ message: "Réponse invalide de Strapi" });
    }

  } catch (error) {
    console.error('Erreur d\'inscription Strapi:', error.response ? error.response.data : error.message);
    res.status(500).json({ message: "Erreur lors de l'inscription", error: error.response ? error.response.data : error.message });
  }
};

// Fonction de connexion
exports.login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const strapiResponse = await axios.post(`${process.env.STRAPI_URL}/api/auth/local`, {
      identifier: username,
      password: password
    });

    if (strapiResponse.data && strapiResponse.data.jwt && strapiResponse.data.user) {
      const jwt = strapiResponse.data.jwt;
      const user = strapiResponse.data.user;

      res.json({
        jwt: jwt,
        user: {
          id: user.id,
          email: user.email,
          roles: user.roles,
        }
      });
    } else {
      res.status(500).json({ message: "Réponse invalide de Strapi" });
    }

  } catch (error) {
    console.error('Erreur de connexion Strapi:', error.response ? error.response.data : error.message);
    res.status(500).json({ message: "Erreur lors de la connexion", error: error.response ? error.response.data : error.message });
  }
};
