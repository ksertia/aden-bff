const express = require('express');
const debiteurController = require('../controllers/debiteurController'); 
const app = express();
// const routes = require('./routes');

// Middleware pour gérer les données JSON
// app.use(express.json());
const router = express.Router();

// Utiliser les routes définies dans le fichier routes.js
app.use('/api', routes);
// Route pour récupérer la liste des débiteurs
router.get('/debiteurs', debiteurController.getDebiteurs);

module.exports = router;

// // Lancer le serveur
// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });
