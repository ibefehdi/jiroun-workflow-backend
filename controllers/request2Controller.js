const Request = require('../models/requestSchema2');
const mongoose = require('mongoose');


exports.getRequestsCount = async (req, res) => {
    try {
        const requests = await Request.countDocuments();
        res.status(200).json({ count: requests })
    }
    catch (err) {
        res.status(500).json({ message: err.message });

    }
}

exports.getRequestById = async (req, res) => {
    try {
        const { requestId } = req.params;
        console.log(requestId);
        const request = await Request.findById(requestId).populate({
            path: 'project',
            model: 'Project',
            populate: {
                path: 'contractors projectManager projectDirector',
                model: 'User',
                options: { retainNullValues: true }
            }
        }).populate('sender').populate('recipient').populate({
            path: 'allRequests',
            model: 'Request2',
            select: 'sentAt comments sender',
            populate: {
                path: 'sender',
                model: 'User',
                select: 'fName lName'
            }
        });

        if (!request) {
            return res.status(404).json({ message: `Request with id ${requestId} not found.` });
        }

        res.status(200).json(request);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


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

exports.getRequestsByApproved = async (req, res) => {
    try {
        const requests = await Request.find({ status: 1 });
        res.status(200).json(requests);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getRequestsByDeclined = async (req, res) => {
    try {
        const requests = await Request.find({ status: 2 });
        res.status(200).json(requests);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createRequest = async (req, res) => {
    try {
        const { requestType, sender, recipient, items, acheivedAmount, project, comments, previousRequestId } = req.body;
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

        let previousItems = [];

        if (previousRequestId) {
            const previousRequest = await Request.findById(previousRequestId);
            if (previousRequest) {
                previousItems = previousRequest.allRequests || [];
            }
        }

        const newRequest = new Request({
            requestType,
            project,
            sender,
            recipient,
            items: requestType === 'Request Item' ? items.map(item => ({ itemName: item.itemName, itemQuantity: item.itemQuantity, unitPrice: item.unitPrice, totalPrice: item.totalPrice })) : [],
            acheivedAmount: requestType === 'Request Payment' ? acheivedAmount : 0,
            status: 0,
            comments,
            sentAt: Date.now()
        })
        const savedRequest = await newRequest.save();
        savedRequest.allRequests.push(savedRequest._id);
        if (previousItems.length > 0) {
            savedRequest.allRequests.push(...previousItems);
        }
        await savedRequest.save();



        res.status(201).json(savedRequest);
    } catch (err) {
        res.status(500).json({ message: err.message });

    }
}
exports.getRequestsBySender = async (req, res) => {
    try {
        const requests = await Request.find({ sender: req.params.userId }).populate('project').populate('sender').populate('recipient');
        const count = requests.length;
        res.status(200).json({ data: requests, count: count, metadata: { total: count } });
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving requests', error });
    }
};
exports.getRequestsByReceiver = async (req, res) => {
    try {
        const requests = await Request.find({ recipient: req.params.userId }).populate('project').populate('sender').populate('recipient');
        const count = requests.length;
        res.status(200).json({ data: requests, count: count, metadata: { total: count } });
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving requests', error });
    }
};

exports.editRequest = async (req, res) => {
    try {
        const updatedRequest = await Request.findByIdAndUpdate(req.params.requestId, req.body, { new: true });
        res.status(200).json(updatedRequest);
    } catch (error) {
        res.status(500).json({ message: 'Error updating request', error });
    }
};

exports.getRequestsByProject = async (req, res) => {
    try {
        const requests = await Request.find({ project: req.params.projectId }).populate('sender').populate('recipient');
        res.status(200).json(requests);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving requests', error });
    }
};

