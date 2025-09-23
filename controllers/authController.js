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
/*
It's a known behavior in Strapi v4 that the /api/auth/local endpoint does not automatically return the user's role in its response. 
This is because the role field is not populated by default for security and performance reasons.
To get the user's role, you need to make a separate, authenticated request to the /api/users/me endpoint.
*/
exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Identifier and password are required.' });
  }

  try {
    // --- Étape 1: Appel à Strapi pour l'authentification (/auth/local) ---
    const strapiResponse = await axios.post(`${process.env.STRAPI_URL}/api/auth/local`, {
      identifier: email,
      password
    });

    const { jwt, user } = strapiResponse.data;

     // --- Étape 2: Appel à Strapi pour récupérer l'utilisateur avec le rôle (/users/me) ---
     const userResponse = await axios.get(`${process.env.STRAPI_URL}/users/me?populate=role`, {
          headers: {
              Authorization: `Bearer ${jwt}`,
          },
      });

     const userWithRole = userResponse.data;

      // --- Étape 3: Combiner et renvoyer la réponse au frontend ---
        // Le frontend reçoit une réponse complète en une seule fois.
   res.status(200).json({
          jwt,
          user: userWithRole,
      });  

  } catch (error) {
    // Gérer les erreurs (ex: mauvaises credentials, permissions insuffisantes)
    const strapiError = error.response?.data?.error || { status: 500, name: 'InternalServerError', message: 'An unknown error occurred' };
    res.status(strapiError.status).json({
        error: {
            status: strapiError.status,
            name: strapiError.name,
            message: strapiError.message,
        },
    });
  }
};
