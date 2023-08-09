const express = require('express');
const router = express.Router();
const { getAllProjects, getUserProjects, createProject, updateProject, getProjectDirectors, getProjectManagers, getProjectsCount } = require("../controllers/projectController")


router.get('/projects', getAllProjects);
router.get('/projectscount', getProjectsCount)
router.post('/projects', createProject);
router.get('/projects/:userId', getUserProjects);

router.get('/projects/:projectId/directors', getProjectDirectors);
router.get('/projects/:projectId/managers', getProjectManagers);
router.patch('/projects/:projectId', updateProject);

module.exports = router;


