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
        const newRequest = new Request({
            requestType,
            project,
            items: items.map(item => ({ itemName: item.itemName, itemQuantity: item.itemQuantity })),
            acheivedAmount,
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


