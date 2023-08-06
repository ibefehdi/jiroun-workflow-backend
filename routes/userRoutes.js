const express = require('express');
const router = express.Router();

const { getAllUsers, addUser, loginUser, getContractorsUsers, getProjectManagerUsers, getProjectDirectorUsers, getUsersCount, getManagingPartnerUsers, getFinanceUsers, getQosUsers, getProcurementUsers } = require('../controllers/userController')


router.post('/users/signup', addUser);

// Login a user
router.post('/users/login', loginUser);

// Get all users
router.get('/users', getAllUsers);
router.get('/userscount', getUsersCount);

router.get('/users/contractors', getContractorsUsers);

router.get('/users/projectmanagers', getProjectManagerUsers);

router.get('/users/projectdirectors', getProjectDirectorUsers);

router.get('/users/finance', getFinanceUsers)

router.get('/users/procurement', getProcurementUsers);

router.get('/users/managingpartner', getManagingPartnerUsers);

router.get('/users/qos', getQosUsers);

module.exports = router;