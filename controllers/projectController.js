const mongoose = require('mongoose')
const Project = require('../models/projectSchema');

// get all projects
exports.getAllProjects = async (req, res) => {
    try {
        const projects = await Project.find().populate('requests');
        const count = await Project.countDocuments();
        res.status(200).json({
            data: projects,
            count: count,
            metadata: {
                total: count
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// create a new project
exports.createProject = async (req, res) => {
    const project = new Project({
        projectName: req.body.projectName,
        projects: req.body.projects,
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
        const updatedProject = await Project.findByIdAndUpdate(req.params.projectId, req.body, { new: true });
        if (!updatedProject) {
            res.status(404).json({ message: "No project found with this ID." });
        } else {
            res.status(200).json(updatedProject);
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}


// // get projects by project manager
// exports.getProjectsByProjectManager = async (req, res) => {
//     try {
//         const projects = await Project.find({ projectManager: req.params.managerId });
//         res.status(200).json(projects);
//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// }

// // get projects by project director
// exports.getProjectsByProjectDirector = async (req, res) => {
//     try {
//         const projects = await Project.find({ projectDirector: req.params.directorId });
//         res.status(200).json(projects);
//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// }

// // get projects by contractor
// exports.getProjectsByContractors = async (req, res) => {
//     try {
//         const projects = await Project.find({
//             contractors: { $in: [req.params.contractorId] }
//         });
//         res.status(200).json(projects);
//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// }


exports.getUserProjects = async (req, res) => {
    const { userId } = req.params;

    try {
        const projects = await Project.find({
            $or: [
                { contractors: new mongoose.Types.ObjectId(userId) },
                { projectManager: new mongoose.Types.ObjectId(userId) },
                { projectDirector: new mongoose.Types.ObjectId(userId) }
            ]
        }).populate('requests');
        const count = projects.length;
        res.status(200).json({
            data: projects,
            count: count,
            metadata: {
                total: count
            }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


exports.getProjectRequests = async (req, res) => {
    const { projectId } = req.params;

    try {
        const project = await Project.findById(projectId).populate('requests');
        if (project) {
            res.status(200).json(project.requests);
        } else {
            res.status(404).json({ message: 'Project not found' });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};