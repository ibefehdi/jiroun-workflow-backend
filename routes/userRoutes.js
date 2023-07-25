const express = require('express');
const router = express.Router();

const { getAllUsers, addUser, loginUser } = require('../controllers/userController')


router.post('/users/signup', addUser);

// Login a user
router.post('/users/login', loginUser);

// Get all users
router.get('/users', getAllUsers);

module.exports = router;