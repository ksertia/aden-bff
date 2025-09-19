module.exports = (allowedRoles) => {
  return (req, res, next) => {
    const user = req.user;
    if (!user || !user.roles) {
      return res.status(403).json({ message: "Accès refusé : aucun rôle trouvé" });
    }

    const hasRole = user.roles.some(role => allowedRoles.includes(role.name));
    if (!hasRole) {
      return res.status(403).json({ message: "Accès refusé : rôle non autorisé" });
    }

    next();
  };
};
