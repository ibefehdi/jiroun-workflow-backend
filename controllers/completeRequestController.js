const Request = require('../models/completeRequest');
const Request2 = require('../models/requestSchema2');
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

        let previousAllRequests = [];

        // If there is a previous request ID, find the previous request using Request2 model and get its allRequests field
        if (previousRequestId) {
            const previousRequest = await Request2.findById(previousRequestId);
            if (previousRequest) {
                previousAllRequests = previousRequest.allRequests || [];
            }
        }

        const newRequest = new Request({
            requestType,
            project,
            sender,
            items: requestType === 'Request Item' ? items.map(item => ({ itemName: item.itemName, itemQuantity: item.itemQuantity, unitPrice: item.unitPrice, totalPrice: item.totalPrice })) : [],
            acheivedAmount: requestType === 'Request Payment' ? acheivedAmount : 0,
            status: 0,
            comments,
            sentAt: Date.now()
        });
        const savedRequest = await newRequest.save();

        // Combine the allRequests of the saved request with the previousAllRequests
        savedRequest.allRequests = [savedRequest._id, ...previousAllRequests];

        await savedRequest.save();

        res.status(201).json(savedRequest);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


exports.getAllCompleteRequests = async (req, res) => {
    try {
        const completeRequests = await Request.find().populate('project sender recipient recipientRequestId previousRequestId').populate({
            path: 'allRequests',
            model: 'Request2',
            select: 'sentAt comments sender',
            populate: {
                path: 'sender',
                model: 'User',
                select: 'fName lName'
            }
        });;
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
