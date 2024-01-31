const { Request, SubRequest, Counter, DeletedRequest, CompletedRequest } = require('../models/requestSchema');

const mongoose = require('mongoose');
exports.getAllCompletedRequests = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const resultsPerPage = parseInt(req.query.resultsPerPage, 10) || 10;
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
        const skip = (page - 1) * resultsPerPage;
        const requests = await CompletedRequest.find(queryConditions).skip(skip)
            .limit(resultsPerPage)
            .populate('initiator')
            .populate('project')
            .populate({
                path: 'subRequests',
                populate: {
                    path: 'sender recipient',
                    model: 'User',
                },
            });
        const count = await CompletedRequest.countDocuments(queryConditions);
        requests.sort((a, b) => b.requestID - a.requestID);

        res.status(200).json({ data: requests, count: count, metadata: { total: count } });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching requests', error: error.message });
    }
};

exports.getCompletedRequestById = async (req, res) => {
    try {

        const request = await CompletedRequest.findById(req.params.id)
            .populate('project')
            .populate('contractorForPayment')
            .populate('initiator')

            .populate({
                path: 'subRequests',
                populate: {
                    path: 'sender recipient',
                    model: 'User',
                }


            });

        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        res.status(200).json(request);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching request', error });
    }
};
exports.createCompleteRequest = async (req, res) => {
    try {
        const request = await Request.findById(req.params.id);

        if (!request) {
            return res.status(404).send('Request not found');
        }

        const comments = req.body.comments;
        const progress = req.body.progress;
        const completedRequest = new CompletedRequest({
            ...request.toObject(),
            comments,
            progress
        });
        await completedRequest.save();
        res.status(200).send('Request deleted successfully');
    } catch (err) {
        console.error(err);
        res.status(500).send(err.message);
    }

}