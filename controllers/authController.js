const axios = require('axios');
const nodemailer = require('nodemailer');

// Informations d'authentification pour WS Métier
const username = 'admin';
const password = 'admin';
const basicAuth = Buffer.from(`${username}:${password}`).toString('base64');

//const basicAuthHeader = `Basic ${basicAuth}`;
const config = {
  headers: {
    'Authorization': `Basic ${basicAuth}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

// Inscription
exports.register = async (req, res) => {
  const { username, email,nodeId } = req.body;

  // 1️⃣ Génère un mot de passe temporaire aléatoire et fort
  const password = Math.random().toString(36).slice(-10) + 'A@1'; // un peu plus complexe

  try {
    const strapiResponse = await axios.post(`${process.env.STRAPI_URL}/api/auth/local/register`, {
      username,
      email,
      password,
      nodeId
    });

    const { jwt, user } = strapiResponse.data;

    res.json({
      jwt,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        nodeId:user.nodeId,
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

    let businessUser = null;
    // --- Étape 3: Vérification du `nodeId` dans Strapi et appel à WS Métier ---
    if (userWithRole.nodeId) {
      // Appel à l'API externe avec la configuration d'authentification
      const businessUserResponse = await axios.get(`${process.env.WS_METIER_URL}/alfresco/s/ged/objet-by-id/${userWithRole.nodeId}`, config);
      businessUser = businessUserResponse.data?.data?.map;
    }

    // Réponse complète avec les données mises à jour
    return res.status(200).json({
      jwt,
      user: userWithRole,
      businessUser, // Les données métier de WS Métier
    });

  } catch (error) {
    // Gérer les erreurs (ex: mauvaises credentials, permissions insuffisantes, erreurs WS Métier)
    console.error('Erreur lors de la connexion ou de la récupération des données métier:', error.message);

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

// ======================= FORGOT PASSWORD =======================
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const response = await axios.post(`${process.env.STRAPI_URL}/api/auth/forgot-password`, { email });
    console.log(`:coche_blanche: Email de réinitialisation envoyé à ${email}`);
    res.status(200).json({ message: 'Email de réinitialisation envoyé si l’utilisateur existe' });
  } catch (error) {
    console.error(':x: Erreur forgot-password:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      message: 'Erreur lors de la demande de réinitialisation du mot de passe',
      error: error.response?.data || error.message,
    });
  }
};
// ======================= RESET PASSWORD =======================
exports.resetPassword = async (req, res) => {
  try {
    const { code, password, passwordConfirmation } = req.body;
    const response = await axios.post(`${process.env.STRAPI_URL}/api/auth/reset-password`, {
      code,
      password,
      passwordConfirmation,
    });
    res.status(200).json({ message: 'Mot de passe réinitialisé avec succès', data: response.data });
  } catch (error) {
    console.error(':x: Erreur reset-password:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      message: 'Erreur lors de la réinitialisation du mot de passe',
      error: error.response?.data || error.message,
    });
  }
};