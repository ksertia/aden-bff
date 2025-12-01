const axios = require('axios');

/**
 * Middleware d'authentification
 * Vérifie le token JWT et récupère les informations de l'utilisateur depuis Strapi
 * Ajoute l'utilisateur dans req.user pour les prochains middlewares/controllers
 */
module.exports = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ 
      message: 'Token manquant - Vous devez être authentifié' 
    });
  }

  const token = authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ 
      message: 'Format du token invalide - Utilisez: Bearer <token>' 
    });
  }

  try {
    // ✅ CORRECTION : Utiliser des parenthèses () au lieu de backticks ``
    // ✅ AJOUT : ?populate=role pour récupérer le rôle de l'utilisateur
    const strapiResponse = await axios.get(
      `${process.env.STRAPI_URL}/api/users/me?populate=role`,
      {
        headers: { 
          Authorization: `Bearer ${token}` 
        }
      }
    );

    // Stocke l'utilisateur complet dans req.user
    req.user = strapiResponse.data;
    
    console.log('✅ Utilisateur authentifié:', {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role?.name || 'Aucun rôle'
    });

    next();

  } catch (error) {
    console.error('❌ Erreur authentification:', error.response?.data || error.message);
    
    // Gestion des différents types d'erreurs
    if (error.response?.status === 401) {
      return res.status(401).json({ 
        message: 'Token invalide ou expiré - Veuillez vous reconnecter' 
      });
    }

    return res.status(401).json({ 
      message: 'Erreur d\'authentification', 
      error: error.response?.data || error.message 
    });
  }
};





