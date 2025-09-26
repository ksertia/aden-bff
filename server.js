const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const debiteurRoutes = require('./routes/debiteurRoutes');

dotenv.config();
const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Health check
app.get('/health', (req, res) => res.json({ status: 'OK', message: 'BFF is running smoothly' }));

// Auth routes
app.use('/auth', authRoutes);

// Debiteur routes
app.use('/api', debiteurRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Erreur interne du serveur', error: err.message });
});

// Start server
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
