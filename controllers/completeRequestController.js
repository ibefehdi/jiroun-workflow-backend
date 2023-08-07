const Request = require('../models/completeRequest');
const mongoose = require('mongoose');

exports.createCompleteRequest = async (req, res) => {
    try {
        const { requestType, sender, items, acheivedAmount, project, comments, previousRequestId } = req.body;

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
            sender, // recipient removed here
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


exports.getAllCompleteRequests = async (req, res) => {
    try {
        const completeRequests = await Request.find().populate('project sender recipient recipientRequestId previousRequestId');
        const count = await Request.count();
        res.status(200).json({ data: completeRequests, count: count, metadata: { total: count } });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getByProjectId = async (req, res) => {
    try {
        const projectId = req.params.projectId;
        const completeRequests = await Request.find({ project: projectId }).populate('project sender recipient recipientRequestId previousRequestId allRequests');
        const count = completeRequests.length;
        res.status(200).json({ data: completeRequests, count: count, metadata: { total: count } });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getByRequestIdInAllRequests = async (req, res) => {
    try {
        const requestId = req.params.requestId;
        const completeRequests = await Request.find({ allRequests: requestId }).populate('project sender recipient recipientRequestId previousRequestId allRequests');
        const count = completeRequests.length;
        res.status(200).json({ data: completeRequests, count: count, metadata: { total: count } });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getBySender = async (req, res) => {
    try {
        const senderId = req.params.senderId;
        const completeRequests = await Request.find({ sender: senderId }).populate('project sender recipient recipientRequestId previousRequestId allRequests');
        const count = completeRequests.length;
        res.status(200).json({ data: completeRequests, count: count, metadata: { total: count } });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getByRecipient = async (req, res) => {
    try {
        const recipientId = req.params.recipientId;
        const completeRequests = await Request.find({ recipient: recipientId }).populate('project sender recipient recipientRequestId previousRequestId allRequests');
        const count = completeRequests.length;
        res.status(200).json({ data: completeRequests, count: count, metadata: { total: count } });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
