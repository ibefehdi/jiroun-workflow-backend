const Request = require('../models/requestSchema');
const mongoose = require('mongoose');
// Get all requests
exports.getAllRequests = async (req, res) => {
    try {
        const requests = await Request.find({})
            .populate('project')
            .populate('lastSentBy')
            .populate({
                path: 'chainOfCommand.userId',
                model: 'User'
            })
            .populate({
                path: 'chainOfCommand.nextUserId',
                model: 'User'
            })
            .populate({
                path: 'chainOfCommand.comments.madeBy',
                model: 'User'
            }); const count = await Request.countDocuments();

        res.status(200).json({
            data: requests,
            count: count,
            metadata: {
                total: count
            }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get all requests by projectId
exports.getAllRequestsByProjectId = async (req, res) => {
    try {
        const { projectId } = req.params;
        const requests = await Request.find({ project: projectId });
        res.status(200).json(requests);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getRequestsByAttentionRequired = async (req, res) => {
    try {
        const requests = await Request.find({ status: 0 });
        res.status(200).json(requests);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get requests by status: Approved
exports.getRequestsByApproved = async (req, res) => {
    try {
        const requests = await Request.find({ status: 1 });
        res.status(200).json(requests);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get requests by status: Declined
exports.getRequestsByDeclined = async (req, res) => {
    try {
        const requests = await Request.find({ status: 2 });
        res.status(200).json(requests);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Edit request to add comments as it passes down the chainOfCommand
exports.editRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const updatedData = req.body;

        // If chainOfCommand is included in the update, add sentAt timestamps
        if (updatedData.chainOfCommand) {
            updatedData.chainOfCommand = updatedData.chainOfCommand.map(command => ({
                ...command,
                sentAt: command.sentAt || Date.now(), // use existing timestamp or create a new one
                comments: command.comments.map(comment => ({
                    ...comment,
                    madeAt: comment.madeAt || Date.now() // use existing timestamp or create a new one
                }))
            }));
        }

        const updatedRequest = await Request.findByIdAndUpdate(
            requestId,
            { $set: updatedData },
            { new: true }  // This option requests that MongoDB return the updated document
        );

        res.status(200).json(updatedRequest);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


// Create a request without item price and total price
exports.createRequest = async (req, res) => {
    try {
        const { requestType, project, items, acheivedAmount, status, chainOfCommand, lastSentBy } = req.body;

        // Validate necessary data based on requestType
        if (requestType === 'Request Item') {
            if (!items || items.length === 0) {
                return res.status(400).json({ message: 'Items array is required for Request Item type' });
            } else if (acheivedAmount !== null && acheivedAmount !== undefined) {
                return res.status(400).json({ message: 'Achieved amount is not allowed for Request Item type' });
            }
        } else if (requestType === 'Request Payment') {
            if (acheivedAmount === null || acheivedAmount === undefined) {
                return res.status(400).json({ message: 'Achieved amount is required for Request Payment type' });
            } else if (items && items.length > 0) {
                return res.status(400).json({ message: 'Items array is not allowed for Request Payment type' });
            }
        }

        const newRequest = new Request({
            requestType,
            project,
            items: requestType === 'Request Item' ? items.map(item => ({ itemName: item.itemName, itemQuantity: item.itemQuantity })) : [],
            acheivedAmount: requestType === 'Request Payment' ? acheivedAmount : 0,
            status,
            chainOfCommand: chainOfCommand.map(command => ({
                ...command,
                sentAt: Date.now(),
                comments: command.comments.map(comment => ({
                    ...comment,
                    madeAt: Date.now()
                }))
            })),
            lastSentBy,
        });

        const savedRequest = await newRequest.save();

        res.status(201).json(savedRequest);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
// Get a specific request by requestId
exports.getRequestById = async (req, res) => {
    try {
        const { requestId } = req.params;
        const request = await Request.findById(requestId)
            .populate('project')
            .populate('lastSentBy')
            .populate({
                path: 'chainOfCommand.userId',
                model: 'User'
            })
            .populate({
                path: 'chainOfCommand.nextUserId',
                model: 'User'
            })
            .populate({
                path: 'chainOfCommand.comments.madeBy',
                model: 'User'
            })
            .populate({
                path: 'project.contractors',
                model: 'User'
            })
            .populate({
                path: 'project.projectManager',
                model: 'User',
                options: { retainNullValues: true }
            })
            .populate({
                path: 'project.projectDirector',
                model: 'User',
                options: { retainNullValues: true }
            });
        if (!request) {
            return res.status(404).json({ message: `Request with id ${requestId} not found.` });
        }

        res.status(200).json(request);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


exports.getRequestsByNextUserId = async (req, res) => {
    try {
        const { userId } = req.params;

        // Use $elemMatch to find documents where the nextUserId in any of the chainOfCommand matches the userId
        const requests = await Request.find({
            'chainOfCommand': {
                $elemMatch: { 'nextUserId': userId }
            }
        })
            .populate('project')
            .populate('lastSentBy')
            .populate({
                path: 'chainOfCommand.userId',
                model: 'User'
            })
            .populate({
                path: 'chainOfCommand.nextUserId',
                model: 'User'
            })
            .populate({
                path: 'chainOfCommand.comments.madeBy',
                model: 'User'
            });

        res.status(200).json(requests);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
