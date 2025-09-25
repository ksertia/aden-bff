const axios = require('axios');

// Informations d'authentification pour WS Métier
const username = 'admin';
const password = 'admin';
const basicAuth = Buffer.from(`${username}:${password}`).toString('base64');

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
    const userResponse = await axios.get(`${process.env.STRAPI_URL}/api/users/me?populate=role`, {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    });

    const userWithRole = userResponse.data;

    // --- Étape 3: Vérification du `nodeId` dans Strapi et appel à WS Métier ---
    // Si l'utilisateur n'a pas de `nodeId` ou que ce `nodeId` n'existe pas dans WS Métier, ne fais pas l'appel
    if (!userWithRole.nodeId) {
      // Si le nodeId n'existe pas dans Strapi, renvoyer une réponse sans données métier
      return res.status(200).json({
        jwt,
        user: userWithRole, // L'utilisateur Strapi avec ses informations
        businessUser: null // Aucun businessUser récupéré car pas de `nodeId`
      });
    }

    // --- Étape 4: Appel à WS Métier pour récupérer les données métier de l'utilisateur ---
    console.log('En-tête Authorization :', `Basic ${basicAuth}`); // Log pour vérifier l'en-tête Authorization
    console.log('nodeId dans Strapi:', userWithRole.nodeId); // Log pour vérifier le nodeId

    const businessUserResponse = await axios.get(`${process.env.WS_METIER_URL}/alfresco/s/ged/objet-by-id/${userWithRole.nodeId}`, {
      headers: {
        Authorization: `Basic ${basicAuth}`, // Authentification WS Métier
      },
    });

    const businessUser = businessUserResponse.data;

    // --- Étape 5: Vérification et mise à jour de l'utilisateur dans Strapi ---
    if (businessUser && businessUser.code === 200) {
      // Si WS Métier renvoie des données valides
      const updateUserResponse = await axios.put(`${process.env.STRAPI_URL}/api/users/${userWithRole.id}`, {
        data: {
          nodeId: businessUser.nodeId, // Met à jour le champ nodeId dans Strapi
          businessRole: businessUser.role, // Exemple d'ajout du rôle métier dans Strapi
          // Ajouter d'autres champs métier ici si nécessaire
        }
      }, {
        headers: {
          Authorization: `Bearer ${jwt}`, // Utilisation du JWT pour l'authentification
        },
      });

      // Réponse complète avec les données mises à jour
      return res.status(200).json({
        jwt,
        user: updateUserResponse.data,
        businessUser, // Les données métier de WS Métier
      });
    } else {
      // Si WS Métier n'a pas retourné de données valides
      return res.status(200).json({
        jwt,
        user: userWithRole,
        businessUser: null, // Pas de données métier valides
      });
    }

  } catch (error) {
    // Gérer les erreurs (ex: mauvaises credentials, permissions insuffisantes, erreurs WS Métier)
    console.error('Erreur lors de la connexion ou de la récupération des données métier:', error.message);
    
    // Logge la réponse détaillée en cas d'erreur pour mieux comprendre le problème
    if (error.response) {
      console.error('Erreur de réponse WS Métier:', error.response.status, error.response.data);
    }

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
