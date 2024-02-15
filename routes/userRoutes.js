const express = require('express');
const router = express.Router();

const { getAllUsers,
    addUser,
    loginUser,
    getContractorsUsers,
    getProjectManagerUsers,
    getProjectDirectorUsers,
    changePassword,
    getUsersCount,
    getForemenUsers,
    getManagingPartnerUsers,
    getFinanceUsers,
    getQosUsers,
    getProcurementUsers,
    getAllContractorUsers,
    resetPassword,
    editUser,
    getAllUsersnontable,
    getUserDetails,
    getAlloftheUsersNontable } = require('../controllers/userController');
const { getRequestInitiator } = require('../controllers/requestController');


router.post('/users/signup', addUser);
router.post('/users/:id/changePassword', changePassword);
router.post('/users/:id/resetPassword', resetPassword)
// Login a user
router.post('/users/login', loginUser);

router.put('/users/:id', editUser)
router.get('/userDetail/:id', getUserDetails)
// Get all users
router.get('/users', getAllUsers);

router.get('/userscount', getUsersCount);

router.get('/users/contractors', getContractorsUsers);

router.get('/users/projectmanagers', getProjectManagerUsers);
router.get('/users/all', getAllUsersnontable)
router.get('/users/allusersfilteration', getAlloftheUsersNontable)
router.get('/users/projectdirectors', getProjectDirectorUsers);

router.get('/users/finance', getFinanceUsers)

router.get('/users/procurement', getProcurementUsers);

router.get('/users/managingpartner', getManagingPartnerUsers);

router.get('/users/qos', getQosUsers);

router.get('/users/foremen', getForemenUsers);

router.get('/users/allcontractors', getAllContractorUsers)
router.get('/users/initiator/:id', getRequestInitiator)

module.exports = router;