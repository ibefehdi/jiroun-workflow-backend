const express = require('express');
const router = express.Router();
const { getAllProjects, getUserProjects, createProject, updateProject, getProjectRequests, getProjectDirectors, getProjectManagers } = require("../controllers/projectController")


router.get('/projects', getAllProjects);
router.post('/projects', createProject);
router.get('/projects/:userId', getUserProjects);
router.get('/projectRequests/:projectId', getProjectRequests);
router.get('/projects/:projectId/directors', getProjectDirectors);
router.get('/projects/:projectId/managers', getProjectManagers);
router.patch('/projects/:projectId', updateProject);

module.exports = router;


