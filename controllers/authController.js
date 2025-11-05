const axios = require('axios');
const nodemailer = require('nodemailer');
const CreationEmailService = require('../services/emailCreationCompteStrapi');
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
// Mise à jour de la fonction register dans auth.controller.js

exports.register = async (req, res) => {
  const { username, email, nodeId, firstName, lastName, role } = req.body;

  // Validation des champs requis
  if (!username || !email) {
    return res.status(400).json({ message: 'Username et email sont requis' });
  }

  if (!role) {
    return res.status(400).json({ message: 'Le rôle est requis' });
  }

  //  Génération d’un mot de passe temporaire fort
  const password = Math.random().toString(36).slice(-10) + 'A@1';

  try {
    const roleId = typeof role === 'string' ? parseInt(role, 10) : role;
    const adminToken = process.env.STRAPI_ADMIN_TOKEN;

    if (!adminToken) {
      return res.status(500).json({
        message: "Le token admin Strapi n'est pas configuré. Vérifie STRAPI_ADMIN_TOKEN dans ton fichier .env"
      });
    }

    console.log(' Données envoyées à Strapi (via /api/users):', {
      username,
      email,
      nodeId,
      firstname: firstName,
      lastname: lastName,
      role: roleId
    });

    //  Création de l'utilisateur avec le token admin
    const strapiResponse = await axios.post(
      `${process.env.STRAPI_URL}/api/users`,
      {
        username,
        email,
        password,
        nodeId: nodeId || null,
        firstname: firstName ?? null,
        lastname: lastName ?? null,
        role: roleId, //  le rôle est passé ici correctement
        confirmed: true, //  tu peux aussi confirmer directement l’utilisateur si tu veux
      },
      {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const user = strapiResponse.data;

    console.log('Utilisateur créé avec succès:', {
      id: user.id,
      email: user.email,
      role: user.role?.name,
    });

    //  Réponse finale
    res.status(201).json({
      message: 'Utilisateur créé avec succès dans Strapi',
      user: {
        id: user.id,
        documentId: user.documentId,
        email: user.email,
        username: user.username,
        nodeId: user.nodeId,
        firstname: user.firstname,
        lastname: user.lastname,
        role: user.role,
      },
    });

  } catch (error) {
    console.error(' Erreur inscription Strapi:', error.response?.data || error.message);

    return res.status(error.response?.status || 500).json({
      message: "Erreur lors de l'inscription dans Strapi",
      error: error.response?.data || error.message,
    });
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

// ======================= SEARCH USER BY EMAIL =======================
exports.getUserByEmail = async (req, res) => {
  const { email } = req.params;

  if (!email) {
    return res.status(400).json({ 
      message: 'Email est requis' 
    });
  }

  try {
    //  Utilise le token admin Strapi ou récupère-le depuis la requête
    const adminToken = process.env.STRAPI_ADMIN_TOKEN; // Token admin Strapi à ajouter dans .env
    
    // Appel à Strapi pour rechercher l'utilisateur
    const response = await axios.get(
      `${process.env.STRAPI_URL}/api/users?filters[email][$eq]=${email}`,
      {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Strapi retourne un tableau, on prend le premier résultat
    const users = response.data;
    
    if (users && users.length > 0) {
      const user = users[0];
      
      // Retourne l'utilisateur trouvé
      return res.status(200).json({
        id: user.id,
        documentId: user.documentId,
        username: user.username,
        email: user.email,
        blocked: user.blocked,
        confirmed: user.confirmed,
        nodeId: user.nodeId,
        firstname: user.firstname,
        lastname: user.lastname,
        role: user.role?.name || 'Authenticated'
      });
    } else {
      // Aucun utilisateur trouvé
      return res.status(404).json({ 
        message: 'Aucun utilisateur trouvé avec cet email' 
      });
    }

  } catch (error) {
    console.error(' Erreur recherche utilisateur:', error.response?.data || error.message);
    
    return res.status(error.response?.status || 500).json({
      message: 'Erreur lors de la recherche de l\'utilisateur',
      error: error.response?.data || error.message
    });
  }
};
