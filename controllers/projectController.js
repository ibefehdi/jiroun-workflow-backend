const Project = require('../models/projectSchema');

// get all projects
exports.getAllProjects = async (req, res) => {
    try {
        const projects = await Project.find();
        res.status(200).json(projects);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// create a new project
exports.createProject = async (req, res) => {
    const project = new Project({
        projectName: req.body.projectName,
        year: req.body.year,
        location: req.body.location,
        contractors: req.body.contractors,
        projectManager: req.body.projectManager,
        projectDirector: req.body.projectDirector,
    });

    try {
        const newProject = await project.save();
        res.status(201).json(newProject);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

// update project
exports.updateProject = async (req, res) => {
    try {
        const updatedProject = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedProject) {
            res.status(404).json({ message: "No project found with this ID." });
        } else {
            res.status(200).json(updatedProject);
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}


// get projects by project manager
exports.getProjectsByProjectManager = async (req, res) => {
    try {
        const projects = await Project.find({ projectManager: req.params.managerId });
        res.status(200).json(projects);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// get projects by project director
exports.getProjectsByProjectDirector = async (req, res) => {
    try {
        const projects = await Project.find({ projectDirector: req.params.directorId });
        res.status(200).json(projects);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// get projects by contractor
exports.getProjectsByContractors = async (req, res) => {
    try {
        const projects = await Project.find({
            contractors: { $in: [req.params.contractorId] }
        });
        res.status(200).json(projects);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}