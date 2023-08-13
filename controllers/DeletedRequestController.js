const { Request, SubRequest, Counter, DeletedRequest } = require('../models/requestSchema');

const mongoose = require('mongoose');
exports.getAllDeletedRequests = async (req, res) => {
    try {
        const requests = await DeletedRequest.find()
            .populate('project')
            .populate({
                path: 'subRequests',
                populate: {
                    path: 'sender recipient',
                    model: 'User',
                },
            });
        const count = await DeletedRequest.countDocuments();
        //res.status(200).json(requests)
        res.status(200).json({ data: requests, count: count, metadata: { total: count } });

        // res.status(200).json({ data: requests, count: count, metadata: { total: count } });
    } catch (error) {
        console.error(error); // Log the error to the console

        res.status(500).json({ message: 'Error fetching requests', error: error.message });
    }
};
exports.getRequestById = async (req, res) => {
    try {

        const request = await DeletedRequest.findById(req.params.id)
            .populate('project')
            .populate({
                path: 'subRequests',
                populate: {
                    path: 'sender recipient',
                    model: 'User',
                },
            });

        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        res.status(200).json(request);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching request', error });
    }
};

exports.getDeletedRequestCount = async (req, res) => {
    try {
        const count = await DeletedRequest.countDocuments();
        res.status(200).json({ count: count });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching request', error });
    }
}