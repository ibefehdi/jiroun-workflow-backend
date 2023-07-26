const express = require('express');
const router = express.Router();
const { getAllProjects, getUserProjects, createProject, updateProject,getProjectRequests } = require("../controllers/projectController")


router.get('/projects', getAllProjects);
router.post('/projects', createProject);
router.get('/userProjects/:userId', getUserProjects);
router.get('/projectRequests/:projectId', getProjectRequests);

router.patch('/projects/:projectId', updateProject);

module.exports = router;


