const Request = require('../models/requestSchema');

// Get all requests
exports.getAllRequests = async (req, res) => {
    try {
        const requests = await Request.find({});
        res.status(200).json(requests);
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


