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

// ======================= CHANGE PASSWORD =======================
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, password, passwordConfirmation } = req.body;

    // Validation des champs
    if (!currentPassword || !password || !passwordConfirmation) {
      return res.status(400).json({ 
        message: 'Tous les champs sont requis (currentPassword, password, passwordConfirmation)' 
      });
    }

    // Vérification que les mots de passe correspondent
    if (password !== passwordConfirmation) {
      return res.status(400).json({ 
        message: 'La confirmation du mot de passe ne correspond pas' 
      });
    }

    // Validation de la complexité du mot de passe (optionnel mais recommandé)
    if (password.length < 8) {
      return res.status(400).json({ 
        message: 'Le mot de passe doit contenir au moins 8 caractères' 
      });
    }

    // Récupération du token JWT (fourni par authMiddleware dans req.user ou req.headers)
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Token non fourni' });
    }

    console.log('🔄 Changement de mot de passe pour l\'utilisateur:', req.user?.email || 'inconnu');
    
    // Appel à l'API Strapi pour changer le mot de passe
    const response = await axios.post(
      `${process.env.STRAPI_URL}/api/auth/change-password`,
      {
        currentPassword,
        password,
        passwordConfirmation,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log(' Mot de passe changé avec succès');

    res.status(200).json({
      message: 'Mot de passe changé avec succès',
      user: response.data.user, // Strapi retourne les infos utilisateur
    });

  } catch (error) {
    console.error(' Erreur changement mot de passe:', error.response?.data || error.message);
    
    // Gestion des erreurs spécifiques de Strapi
    if (error.response?.status === 400) {
      return res.status(400).json({
        message: 'Mot de passe actuel incorrect',
        error: error.response.data.error?.message || 'Validation échouée',
      });
    }

    res.status(error.response?.status || 500).json({
      message: 'Erreur lors du changement de mot de passe',
      error: error.response?.data?.error?.message || error.message,
    });
  }
};



// ======================= UPDATE USER INFO =======================
exports.updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const updateData = req.body;

    if (!userId) {
      return res.status(400).json({ message: "L'ID de l'utilisateur est requis" });
    }

    // Récupération du JWT et de l'utilisateur connecté
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Token non fourni' });
    }

    //  SÉCURITÉ : Vérifier que l'utilisateur modifie son propre profil
    // ou qu'il a les droits admin
    const currentUserId = req.user?.id; // fourni par authMiddleware
    const userRole = req.user?.role?.name;

    if (!currentUserId) {
      return res.status(401).json({ message: 'Utilisateur non authentifié' });
    }

    // Autoriser uniquement si :
    // 1. L'utilisateur modifie son propre profil (userId == currentUserId)
    // 2. OU l'utilisateur a le rôle Admin/Super Admin
    const isOwnProfile = String(userId) === String(currentUserId);
    const isAdmin = ['Admin', 'Super Admin', 'Administrateur'].includes(userRole);

    if (!isOwnProfile && !isAdmin) {
      return res.status(403).json({ 
        message: 'Accès refusé : vous ne pouvez modifier que votre propre profil' 
      });
    }

    //  Empêcher la modification de certains champs sensibles (sauf admin)
    const forbiddenFields = ['password', 'role', 'confirmed', 'blocked'];
    if (!isAdmin) {
      forbiddenFields.forEach(field => {
        if (updateData[field]) {
          delete updateData[field];
          console.warn(` Tentative de modification du champ protégé : ${field}`);
        }
      });
    }

    console.log('Mise à jour utilisateur ID:', userId);
    console.log('Données à mettre à jour:', updateData);

    // Appel Strapi : PUT /api/users/:id
    const response = await axios.put(
      `${process.env.STRAPI_URL}/api/users/${userId}`,
      updateData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('Utilisateur mis à jour avec succès');

    res.status(200).json({
      message: 'Informations utilisateur mises à jour avec succès',
      user: response.data,
    });

  } catch (error) {
    console.error(' Erreur mise à jour utilisateur:', error.response?.data || error.message);
    
    // Gestion des erreurs spécifiques
    if (error.response?.status === 404) {
      return res.status(404).json({
        message: 'Utilisateur introuvable',
      });
    }

    res.status(error.response?.status || 500).json({
      message: "Erreur lors de la mise à jour de l'utilisateur",
      error: error.response?.data?.error?.message || error.message,
    });
  }
};

// ======================= UPLOAD AVATAR =======================
exports.uploadAvatar = async (req, res) => {
  try {
    const userId = req.params.id;
    if (!userId) {
      return res.status(400).json({ message: "L'ID de l'utilisateur est requis" });
    }

    // Vérification du fichier
    if (!req.file) {
      return res.status(400).json({ message: 'Aucun fichier fourni' });
    }

    // Récupération du JWT et de l'utilisateur connecté
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Token non fourni' });
    }

    const currentUserId = req.user?.id;
    const userRole = req.user?.role?.name;

    if (!currentUserId) {
      return res.status(401).json({ message: 'Utilisateur non authentifié' });
    }

    // Autoriser uniquement si l'utilisateur modifie son propre profil ou est admin
    const isOwnProfile = String(userId) === String(currentUserId);
    const isAdmin = ['Admin', 'Super Admin', 'Administrateur'].includes(userRole);

    if (!isOwnProfile && !isAdmin) {
      return res.status(403).json({ 
        message: 'Accès refusé : vous ne pouvez modifier que votre propre profil' 
      });
    }

    console.log('Upload photo de profil pour utilisateur ID:', userId);
    console.log('Fichier reçu:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });

    // Création du FormData pour Strapi
    const FormData = require('form-data');
    const formData = new FormData();
    
    // Ajout du fichier
    formData.append('files', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype
    });

    // Étape 1: Upload du fichier vers Strapi
    const uploadResponse = await axios.post(
      `${process.env.STRAPI_URL}/api/upload`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const uploadedFile = uploadResponse.data[0];
    console.log('Fichier uploadé sur Strapi:', uploadedFile.id);

    // Étape 2: Associer l'image au champ 'profil' de l'utilisateur
    const updateResponse = await axios.put(
      `${process.env.STRAPI_URL}/api/users/${userId}`,
      {
        profil: uploadedFile.id
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // Étape 3: Récupérer l'utilisateur avec le champ profil populé
    const userResponse = await axios.get(
      `${process.env.STRAPI_URL}/api/users/${userId}?populate=profil`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const user = userResponse.data;

    // Construire l'URL complète de la photo de profil
    if (user.profil) {
      user.profil = `${process.env.STRAPI_URL}${user.profil.url}`;
    }

    console.log(' Photo de profil mise à jour avec succès');

    res.status(200).json({
      message: 'Photo de profil mise à jour avec succès',
      user: user,
    });

  } catch (error) {
    console.error('❌ Erreur upload photo de profil:', error.response?.data || error.message);
    
    if (error.response?.status === 404) {
      return res.status(404).json({
        message: 'Utilisateur introuvable',
      });
    }

    res.status(error.response?.status || 500).json({
      message: "Erreur lors de l'upload de la photo de profil",
      error: error.response?.data?.error?.message || error.message,
    });
  }
};


// ======================= GET ME (Récupérer infos utilisateur connecté) =======================
exports.getMe = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Token non fourni' });
    }

    // Appel à Strapi pour récupérer l'utilisateur avec toutes ses relations
    const response = await axios.get(
      `${process.env.STRAPI_URL}/api/users/me?populate=role`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    res.status(200).json({
      user: response.data,
    });

  } catch (error) {
    console.error('❌ Erreur récupération profil:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      message: 'Erreur lors de la récupération du profil',
      error: error.response?.data || error.message,
    });
  }

};

