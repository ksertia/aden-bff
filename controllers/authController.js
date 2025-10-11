const axios = require('axios');

// Informations d'authentification pour WS Métier
const username = 'admin';
const password = 'admin';
const basicAuth = Buffer.from(`${username}:${password}`).toString('base64');
// ======================= INSCRIPTION =======================
exports.register = async (req, res) => {
  const { username, email, firstname, lastname, nodeId, role } = req.body;

  // 🔍 Log de ce que le BFF reçoit d’Angular
  console.log('📥 [BFF] Données reçues depuis Angular:', {
    username,
    email,
    firstname,
    lastname,
    nodeId,
    role,
  });

  // Génère un mot de passe temporaire sécurisé
  const password = Math.random().toString(36).slice(-8);

  try {
    // 🔍 Log avant d’envoyer à Strapi
    console.log('🚀 [BFF] Envoi des données vers Strapi:', {
      username,
      email,
      firstname,
      lastname,
      nodeId,
      role,
      passwordMasqué: password.replace(/./g, '*'),
    });

    // ✅ Création de l'utilisateur dans Strapi
    const strapiResponse = await axios.post(
      `${process.env.STRAPI_URL}/api/users`,
      {
        username,
        email,
        password,
        confirmed: true,
        blocked: false,
        firstname,
        lastname,
        nodeId,
        role,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.STRAPI_ADMIN_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // 🔍 Log du retour Strapi
    console.log('✅ [BFF] Réponse de Strapi:', strapiResponse.data);

    const user = strapiResponse.data;

    return res.status(201).json({
      message: 'Utilisateur créé avec succès',
      user,
    });
  } catch (error) {
    console.error('❌ [BFF] Erreur création Strapi:', error.response?.data || error.message);
    return res.status(500).json({
      message: "Erreur lors de la création de l'utilisateur",
      error: error.response?.data || error.message,
    });
  }
};

// ======================= CONNEXION =======================
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const strapiResponse = await axios.post(`${process.env.STRAPI_URL}/api/auth/local`, {
      identifier: email,
      password,
    });

    const { jwt } = strapiResponse.data;

    const userResponse = await axios.get(`${process.env.STRAPI_URL}/api/users/me?populate=role`, {
      headers: { Authorization: `Bearer ${jwt}` },
    });

    const user = userResponse.data;

    res.status(200).json({
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

// ======================= FORGOT PASSWORD =======================
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const response = await axios.post(`${process.env.STRAPI_URL}/api/auth/forgot-password`, { email });

    console.log(`✅ Email de réinitialisation envoyé à ${email}`);
    res.status(200).json({ message: 'Email de réinitialisation envoyé si l’utilisateur existe' });
  } catch (error) {
    console.error('❌ Erreur forgot-password:', error.response?.data || error.message);
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
    console.error('❌ Erreur reset-password:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      message: 'Erreur lors de la réinitialisation du mot de passe',
      error: error.response?.data || error.message,
    });
  }
};