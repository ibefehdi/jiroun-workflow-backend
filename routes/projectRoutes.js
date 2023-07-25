const express = require('express');
const router = express.Router();
const { getAllProjects, getProjectsByContractors, getProjectsByProjectDirector, getProjectsByProjectManager, createProject, updateProject } = require("../controllers/projectController")


router.get('/projects', getAllProjects);
router.post('/projects', createProject);
router.get('/projects/:managerId', getProjectsByProjectManager);
router.get('/projects/:contractorId', getProjectsByContractors);
router.get('/projects/:directorId', getProjectsByProjectDirector);
router.patch('/projects/:projectId', updateProject);

module.exports = router;


