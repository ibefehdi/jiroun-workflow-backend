const mongoose = require('mongoose')
const Project = require('../models/projectSchema');
const { SubContract, ContractorWorkRepository } = require('../models/contractorWorkRepository');

// get all projects
exports.getProjectsCount = async (req, res) => {
    try {
        const projects = await Project.countDocuments();
        res.status(200).json({ count: projects });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}
exports.getAllProjects = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const resultsPerPage = parseInt(req.query.resultsPerPage, 10) || 10;
        const skip = (page - 1) * resultsPerPage;

        // Fetch projects with pagination
        const projects = await Project.find()

            .populate('contractors')
            .populate('projectManager')
            .populate('foremen')
            .populate('projectDirector');

        const count = await Project.countDocuments();

        // Add subcontract count for each project
        const projectsWithSubcontractCount = await Promise.all(
            projects.map(async (project) => {
                const subcontractProject = await ContractorWorkRepository.findOne({ project: project?._id });
                if (!subcontractProject) {
                    return { ...project.toJSON(), subContractsCount: 0 };
                }
                const subContractsCount = subcontractProject.subContracts.length;
                return { ...project.toJSON(), subContractsCount };
            })
        );

        res.status(200).json({
            data: projectsWithSubcontractCount,
            count: count,
            metadata: {
                total: count
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


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
        foremen: req.body.foremen,
        latitude: req.body.latitude,
        longitude: req.body.longitude,
        radius: req.body.radius
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
                { projectDirector: new mongoose.Types.ObjectId(userId) },
                { foremen: new mongoose.Types.ObjectId(userId) }
            ]
        }).populate('contractors').populate('projectManager').populate('projectDirector').populate('foremen');
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

exports.getProjectsById = async (req, res) => {
    const { projectId } = req.params;
    console.log(projectId);
    try {
        const project = await Project.findById({
            _id: projectId
        }).populate('contractors').populate('projectManager').populate('projectDirector').populate('foremen');

        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        res.status(200).json({
            data: project,
            metadata: {
                total: 1
            }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};



// get projectDirectors by projectId
exports.getProjectDirectors = async (req, res) => {
    const { projectId } = req.params;

    try {
        const project = await Project.findById(projectId).populate('projectDirector');
        if (project) {
            res.status(200).json(project.projectDirector);
        } else {
            res.status(404).json({ message: 'Project not found' });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// get projectManagers by projectId
exports.getProjectManagers = async (req, res) => {
    const { projectId } = req.params;

    try {
        const project = await Project.findById(projectId).populate('projectManager');
        if (project) {
            res.status(200).json(project.projectManager);
        } else {
            res.status(404).json({ message: 'Project not found' });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
exports.getContractors = async (req, res) => {
    const { projectId } = req.params;

    try {
        const project = await Project.findById(projectId).populate('contractors');
        if (project) {
            res.status(200).json(project.contractors);
        } else {
            res.status(404).json({ message: 'Project not found' });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
