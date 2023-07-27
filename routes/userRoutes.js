const express = require('express');
const router = express.Router();

const { getAllUsers, addUser, loginUser, getContractersUsers, getProjectManagerUsers, getProjectDirectorUsers, } = require('../controllers/userController')


router.post('/users/signup', addUser);

// Login a user
router.post('/users/login', loginUser);

// Get all users
router.get('/users', getAllUsers);

router.get('/contracters', getContractersUsers);

router.get('/projectmanagers', getProjectManagerUsers);

router.get('/projectdirectors', getProjectDirectorUsers);

module.exports = router;