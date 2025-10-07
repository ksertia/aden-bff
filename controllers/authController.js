const axios = require('axios');

// =======================================================
//  Informations d'authentification pour WS Métier (si besoin plus tard)
// =======================================================
const username = 'admin';
const password = 'admin';
const basicAuth = Buffer.from(`${username}:${password}`).toString('base64');

// =======================================================
// ======================= INSCRIPTION ====================
// =======================================================
exports.register = async (req, res) => {
  const { username, email, firstname, lastname, role } = req.body;

  //  nodeId NE DOIT PAS venir du formulaire.
  // Il est soit généré automatiquement, soit récupéré plus tard via le WS Métier.
  const nodeId = req.body.nodeId || null;

  //  Génération d’un mot de passe temporaire aléatoire et sécurisé
  const password = Math.random().toString(36).slice(-10); // 10 caractères aléatoires

  try {
    //  Vérifier d'abord si l'utilisateur existe déjà sur Strapi (via son email)
    const existingUser = await axios.get(
      `${process.env.STRAPI_URL}/api/users?filters[email][$eq]=${email}`,
      {
        headers: { Authorization: `Bearer ${process.env.STRAPI_ADMIN_TOKEN}` },
      }
    );

    if (existingUser.data && existingUser.data.length > 0) {
      return res.status(400).json({
        message: '❌ Cet utilisateur existe déjà sur Strapi.',
      });
    }

    //  Préparer les données à envoyer à Strapi
    const userData = {
      username,
      email,
      password,
      firstname,
      lastname,
      role,
    };

    //  Inclure nodeId UNIQUEMENT s’il est fourni (par WS Métier)
    if (nodeId) {
      userData.nodeId = nodeId;
    }

    // =======================================================
    //  Création de l'utilisateur sur Strapi via le point public
    // =======================================================
    // /api/auth/local/register permet de créer un utilisateur public
    // et déclenche automatiquement l'envoi de l'email si configuré dans Strapi
    const strapiResponse = await axios.post(
      `${process.env.STRAPI_URL}/api/auth/local/register`,
      userData
    );

    //  Récupérer les informations retournées par Strapi
    const user = strapiResponse.data.user;

    console.log(` Utilisateur ${email} créé sur Strapi avec succès (mail automatique envoyé).`);

    //  Retour au frontend avec message clair
    return res.status(201).json({
      message: 'Utilisateur créé avec succès (mot de passe envoyé par email).',
      user,
    });
  } catch (error) {
    console.error('❌ Erreur création Strapi:', error.response?.data || error.message);
    return res.status(500).json({
      message: "Erreur lors de la création de l'utilisateur",
      error: error.response?.data || error.message,
    });
  }
};

// =======================================================
// ======================== CONNEXION =====================
// =======================================================
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    //  Authentification via Strapi
    const strapiResponse = await axios.post(`${process.env.STRAPI_URL}/api/auth/local`, {
      identifier: email,
      password,
    });

    const { jwt } = strapiResponse.data;

    //  Récupération du profil utilisateur (avec rôle)
    const userResponse = await axios.get(`${process.env.STRAPI_URL}/api/users/me?populate=role`, {
      headers: { Authorization: `Bearer ${jwt}` },
    });

    const user = userResponse.data;

    res.status(200).json({
      message: 'Connexion réussie',
      jwt,
      user,
    });
  } catch (error) {
    console.error('❌ Erreur login:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      message: 'Erreur lors de la connexion',
      error: error.response?.data || error.message,
    });
  }
};

// =======================================================
// ================== MOT DE PASSE OUBLIÉ =================
// =======================================================
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    //  Demande à Strapi d’envoyer le mail de réinitialisation
    await axios.post(`${process.env.STRAPI_URL}/api/auth/forgot-password`, { email });

    console.log(`✅ Email de réinitialisation envoyé à ${email}`);
    res.status(200).json({
      message: 'Email de réinitialisation envoyé si l’utilisateur existe.',
    });
  } catch (error) {
    console.error('❌ Erreur forgot-password:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      message: 'Erreur lors de la demande de réinitialisation du mot de passe',
      error: error.response?.data || error.message,
    });
  }
};

// =======================================================
// ================== RÉINITIALISATION MDP =================
// =======================================================
exports.resetPassword = async (req, res) => {
  try {
    const { code, password, passwordConfirmation } = req.body;

    //  Envoie la nouvelle paire de mots de passe à Strapi
    const response = await axios.post(`${process.env.STRAPI_URL}/api/auth/reset-password`, {
      code,
      password,
      passwordConfirmation,
    });

    res.status(200).json({
      message: 'Mot de passe réinitialisé avec succès',
      data: response.data,
    });
  } catch (error) {
    console.error('❌ Erreur reset-password:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      message: 'Erreur lors de la réinitialisation du mot de passe',
      error: error.response?.data || error.message,
    });
  }
};
