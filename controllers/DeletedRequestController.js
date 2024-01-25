const { Request, SubRequest, Counter, DeletedRequest } = require('../models/requestSchema');

const mongoose = require('mongoose');
exports.getAllDeletedRequests = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const resultsPerPage = parseInt(req.query.resultsPerPage, 10) || 10;

        const skip = (page - 1) * resultsPerPage;
        const requestType = req.query.requestType;
        const startDate = req.query.startDate;
        const endDate = req.query.endDate;
        const initiator = req.query.initiator;
        const contractorForPayment = req.query.contractorForPayment;
        const project = req.query.project;
        // Build query conditions based on filters
        let queryConditions = {};
        if (requestType) {
            queryConditions.requestType = requestType;
        }
        if (startDate || endDate) {
            queryConditions.createdAt = {};
            if (startDate) {
                queryConditions.createdAt.$gte = new Date(startDate);
            }
            if (endDate) {
                queryConditions.createdAt.$lte = new Date(endDate);
            }
        }
        if (initiator) {
            queryConditions.initiator = initiator;
        }
        if (contractorForPayment) {
            queryConditions.contractorForPayment = contractorForPayment;
        }
        if (project) {
            queryConditions.project = project;
        }
        const requests = await DeletedRequest.find(queryConditions).skip(skip)
            .limit(resultsPerPage)
            .populate('project')
            .populate({
                path: 'subRequests',
                populate: {
                    path: 'sender recipient',
                    model: 'User',
                },
            });
        const count = await DeletedRequest.countDocuments(queryConditions);
        requests.sort((a, b) => b.requestID - a.requestID);

        res.status(200).json({ data: requests, count: count, metadata: { total: count } });

    } catch (error) {
        console.error(error);

        res.status(500).json({ message: 'Error fetching requests', error: error.message });
    }
};
exports.getRequestById = async (req, res) => {
    try {

        const request = await DeletedRequest.findById(req.params.id)
            .populate('project').populate('contractorForPayment')
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