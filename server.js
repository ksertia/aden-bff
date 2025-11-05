const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const debiteurRoutes = require('./routes/debiteurRoutes');
const partenaireRoutes = require('./routes/partenaireRoutes');
const huissierRoutes = require('./routes/huissierRoutes');
const creancierRoutes = require('./routes/creancierRoutes');
const avocatRoutes = require('./routes/avocatRoutes');
const cedantRoutes = require('./routes/cedantRoutes');
const adminRoutes = require('./routes/adminRoutes');
const dossierRoutes = require('./routes/dossierRoutes');
const documentRoutes = require('./routes/documentRoutes');




dotenv.config();
const app = express();

// Middleware
app.use(express.json());
//app.use(cors());
app.use(cors({
  origin: ['http://localhost:4200', 'https://ton-domaine-front.vercel.app'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

/* app.use(cors({
  origin: (origin, callback) => {
    if (!origin || ['http://localhost:4200', 'https://ton-domaine-front.vercel.app'].includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed'));
    }
  },
  credentials: true
})); */

// Health check
app.get('/health', (req, res) => res.json({ status: 'OK', message: 'BFF is running smoothly' }));

// Auth routes
app.use('/api/auth', authRoutes);

// Debiteur routes
app.use('/api', debiteurRoutes);

// Partenaire routes
app.use('/api', partenaireRoutes);

// Huissier routes
app.use('/api', huissierRoutes);

// Créancier routes
app.use('/api', creancierRoutes);

// Avocats routes
app.use('/api', avocatRoutes);

// Cedants routes
app.use('/api', cedantRoutes);
// admin routes
app.use('/api', adminRoutes);

// dossier routes
app.use('/api', dossierRoutes);

app.use('/api', documentRoutes);
app.use('/api', documentRoutes);


// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Erreur interne du serveur', error: err.message });
});

// Start server
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
