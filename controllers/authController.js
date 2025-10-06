const axios = require('axios');

// Informations d'authentification pour WS Métier
const username = 'admin';
const password = 'admin';
const basicAuth = Buffer.from(`${username}:${password}`).toString('base64');

const config = {
  headers: {
    'Authorization': `Basic ${basicAuth}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

// ======================= INSCRIPTION =======================
exports.register = async (req, res) => {
  const { username, email, nodeId } = req.body; // ajout nodeId pour cohérence avec WS Métier
  const password = Math.random().toString(36).slice(-8); // mot de passe temporaire aléatoire

  try {
    // --- Appel à Strapi pour enregistrer l'utilisateur ---
    const strapiResponse = await axios.post(`${process.env.STRAPI_URL}/api/auth/local/register`, {
      username,
      email,
      password,
      nodeId
    });

    const { jwt, user } = strapiResponse.data;

    // // --- Envoyer un email à l'utilisateur avec le mot de passe temporaire ---
    // try {
    //   await CreationEmailService.sendWelcomeEmail(email, username, password);
    //   console.log(`Email de bienvenue envoyé à ${email}`);
    // } catch (mailError) {
    //   console.error('Erreur envoi email:', mailError);
    // }

    res.json({
      jwt,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        nodeId: user.nodeId,
        roles: user.roles
      }
    });

  } catch (error) {
    console.error('Erreur d\'inscription Strapi:', error.response?.data || error.message);
    res.status(500).json({ message: "Erreur lors de l'inscription", error: error.response?.data || error.message });
  }
};

// ======================= CONNEXION =======================

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
    // --- Étape 1: Authentification via Strapi (/auth/local) ---
    const strapiResponse = await axios.post(`${process.env.STRAPI_URL}/api/auth/local`, {
      identifier: email,
      password
    });

    const { jwt } = strapiResponse.data;

    // --- Étape 2: Récupération des infos utilisateur et rôle (/users/me) ---
    const userResponse = await axios.get(`${process.env.STRAPI_URL}/api/users/me?populate=role`, {
      headers: { Authorization: `Bearer ${jwt}` },
    });

    const userWithRole = userResponse.data;

    let businessUser = null;
    // --- Étape 3: Récupération des données métier via WS Métier si nodeId présent ---
    if (userWithRole.nodeId) {
      const businessUserResponse = await axios.get(`${process.env.WS_METIER_URL}/alfresco/s/ged/objet-by-id/${userWithRole.nodeId}`, config);
      businessUser = businessUserResponse.data?.data?.map;
    }

    // --- Réponse complète ---
    return res.status(200).json({
      jwt,
      user: userWithRole,
      businessUser,
    });

  } catch (error) {
    console.error('Erreur login:', error.message);
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
/**
 * Flux Strapi officiel :
 * 1. L'utilisateur/admin clique sur "Mot de passe oublié" (frontend)
 * 2. Frontend envoie l'email au BFF
 * 3. BFF appelle Strapi /auth/forgot-password
 * 4. Strapi envoie email avec lien sécurisé de réinitialisation
 */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "L'email est requis" });
    }

    const response = await axios.post(`${process.env.STRAPI_URL}/api/auth/forgot-password`, { email }, {
      headers: { 'Content-Type': 'application/json' }
    });

    console.log(`Email de réinitialisation envoyé à ${email}`);
    return res.status(200).json({ message: "Email de réinitialisation envoyé si l'utilisateur existe" });

  } catch (error) {
    console.error("Erreur forgot-password :", error.response?.data || error.message);
    return res.status(error.response?.status || 500).json({
      message: "Erreur lors de la demande de réinitialisation du mot de passe",
      error: error.response?.data || error.message
    });
  }
};

// ======================= RESET PASSWORD =======================
/**
 * Flux Strapi officiel :
 * 1. L'utilisateur clique sur le lien reçu par email
 * 2. Frontend récupère le `code` depuis le lien
 * 3. Frontend envoie `code`, `password`, `passwordConfirmation` au BFF
 * 4. BFF appelle Strapi /auth/reset-password
 */
exports.resetPassword = async (req, res) => {
  try {
    const { code, password, passwordConfirmation } = req.body;

    if (!code || !password || !passwordConfirmation) {
      return res.status(400).json({ message: "Tous les champs sont requis : code, password, passwordConfirmation" });
    }

    const response = await axios.post(`${process.env.STRAPI_URL}/api/auth/reset-password`, {
      code,
      password,
      passwordConfirmation
    }, {
      headers: { 'Content-Type': 'application/json' }
    });

    return res.status(200).json({ message: "Mot de passe réinitialisé avec succès", data: response.data });

  } catch (error) {
    console.error("Erreur reset-password :", error.response?.data || error.message);
    return res.status(error.response?.status || 500).json({
      message: "Erreur lors de la réinitialisation du mot de passe",
      error: error.response?.data || error.message
    });
  }
};
