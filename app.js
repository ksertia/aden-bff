const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const debiteurRoutes = require('./routes/debiteurRoutes');
const { validateRegister, validateLogin } = require('./middlewares/validateRequest');
const errorHandler = require('./middlewares/errorHandler');

// Charger les variables d'environnement
dotenv.config();

const app = express();
app.use(express.json());
app.use(cors()); // Pour gérer les CORS (si nécessaire)

// Définir les routes d'authentification
app.use('/api/auth', authRoutes);
app.use('/api/debiteur', debiteurRoutes);


// Middleware de gestion des erreurs
app.use(errorHandler);

module.exports = app;
