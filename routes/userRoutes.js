const express = require('express');
const router = express.Router();

const { getAllUsers, addUser, loginUser, getSpecificOccupationUsers } = require('../controllers/userController')


router.post('/users/signup', addUser);

// Login a user
router.post('/users/login', loginUser);

// Get all users
router.get('/users', getAllUsers);

router.get('/specificusers', getSpecificOccupationUsers);

module.exports = router;