const express = require('express');
const router = express.Router();

const { getAllUsers, addUser, loginUser, getContractorsUsers, getProjectManagerUsers, getProjectDirectorUsers, } = require('../controllers/userController')


router.post('/users/signup', addUser);

// Login a user
router.post('/users/login', loginUser);

// Get all users
router.get('/users', getAllUsers);

router.get('/users/contractors', getContractorsUsers);

router.get('/users/projectmanagers', getProjectManagerUsers);

router.get('/users/projectdirectors', getProjectDirectorUsers);

module.exports = router;