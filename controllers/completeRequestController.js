const { Request, SubRequest, Counter, DeletedRequest, CompletedRequest } = require('../models/requestSchema');

const mongoose = require('mongoose');
exports.getAllCompletedRequests = async (req, res) => {
    try {
        const requests = await CompletedRequest.find()
            .populate('project')
            .populate({
                path: 'subRequests',
                populate: {
                    path: 'sender recipient',
                    model: 'User',
                },
            });
        const count = await CompletedRequest.countDocuments();
        res.status(200).json({ data: requests, count: count, metadata: { total: count } });

    } catch (error) {
        console.error(error); 
        res.status(500).json({ message: 'Error fetching requests', error: error.message });
    }
};