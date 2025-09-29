const express = require('express');
const router = express.Router();
const app = express();
const adminController = require('../controllers/admin');

router.get('/get_all_users/:sitename',adminController.getAllUsers);


module.exports = router;