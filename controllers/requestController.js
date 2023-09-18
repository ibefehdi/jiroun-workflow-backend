const { Request, SubRequest, Counter, DeletedRequest, CompletedRequest } = require('../models/requestSchema');
const mongoose = require('mongoose');


exports.getAllRequests = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const resultsPerPage = parseInt(req.query.resultsPerPage, 10) || 10;

        const skip = (page - 1) * resultsPerPage;
        const requests = await Request.find()
            .skip(skip)
            .limit(resultsPerPage)
            .populate('project').populate({
                path: 'project',
                populate: {
                    path: 'contractors projectManager projectDirector',
                    model: 'User',
                }
            })
            .populate({
                path: 'subRequests',
                populate: {
                    path: 'sender recipient',
                    model: 'User',
                },
            });
        const count = await Request.count()
        res.status(200).json({ data: requests, count: count, metadata: { total: count } });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching requests', error });
    }
};

exports.getRequestById = async (req, res) => {
    try {

        const request = await Request.findById(req.params.id)
            .populate('project')
            .populate('contractorForPayment')
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

exports.getRequestsByProjectId = async (req, res) => {
    try {
        const requests = await Request.find({ project: req.params.projectId })
            .populate('project')
            .populate({
                path: 'subRequests',
                populate: {
                    path: 'sender recipient',
                    model: 'User',
                },
            });

        if (requests.length === 0) {
            return res.status(404).json({ message: 'No requests found for this project' });
        }

        res.status(200).json(requests);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching requests', error });
    }
};


exports.getPendingRequests = async (req, res) => {
    try {
        const requests = await Request.find({ globalStatus: 0 })
            .populate('project')
            .populate({
                path: 'subRequests',
                populate: {
                    path: 'sender recipient',
                    model: 'User',
                },
            });

        res.status(200).json(requests);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching pending requests', error });
    }
};
exports.getAllSendersInRequest = async (req, res) => {
    try {
        // Find the request by ID and populate the 'sender' field in 'subRequests'
        const request = await Request.findById(req.params.id)
            .populate({
                path: 'subRequests',
                populate: {
                    path: 'sender',
                    model: 'User',
                    select: 'fName lName username'
                },
            });

        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        // Extract the senders from the subRequests
        const senders = request.subRequests.map(subRequest => subRequest.sender);

        res.status(200).json(senders);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching senders', error });
    }
};
exports.getApprovedRequests = async (req, res) => {
    try {
        const requests = await Request.find({ globalStatus: 1 })
            .populate('project')
            .populate({
                path: 'subRequests',
                populate: {
                    path: 'sender recipient',
                    model: 'User',
                },
            });

        res.status(200).json(requests);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching approved requests', error });
    }
};

exports.getDeclinedRequests = async (req, res) => {
    try {
        const requests = await Request.find({ globalStatus: 2 })
            .populate('project')
            .populate({
                path: 'subRequests',
                populate: {
                    path: 'sender recipient',
                    model: 'User',
                },
            });

        res.status(200).json(requests);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching declined requests', error });
    }
};


exports.createSubRequest = async (req, res) => {
    try {
        const requestId = req.params.requestId;

        const request = await Request.findOne({ _id: requestId });
        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        const { sender, recipient, isFinalized, comments } = req.body;

        const newSubRequest = new SubRequest({ sender, recipient, isFinalized, subRequestSentAt: new Date(), comments });
        await newSubRequest.save();

        request.subRequests.push(newSubRequest._id);

        if (request.subRequests.length > 0) {
            const lastSubRequest = await SubRequest.findById(request.subRequests[request.subRequests.length - 1]).populate('recipient');

            if (lastSubRequest) {
                if (lastSubRequest.recipient.occupation === 'Project Director') request.progress = 25;
                else if (lastSubRequest.recipient.occupation === 'Quantity Surveyor') request.progress = 25;
                else if (lastSubRequest.recipient.occupation === 'Procurement') request.progress = 50;
                else if (lastSubRequest.recipient.occupation === 'Finance') request.progress = 75;
                else if (lastSubRequest.recipient.occupation === 'Managing Partner') request.progress = 90;

            }
        }

        await request.save();
        // Send success response
        res.status(201).json(newSubRequest);
    } catch (error) {
        console.error("Error details:", error); // Log the detailed error
        res.status(500).json({ message: 'Error creating subrequest', error });
    }
};




exports.createRequest = async (req, res) => {
    try {
        // Extract fields for the request
        const {
            requestType,
            project,
            estimatedAmount,
            totalAmount,
            paidAmount,
            paymentType,
            items,
            noOfLabour,
            priceOfLabour,
            transportationPrice,
            contractorForPayment,
            globalStatus = 0,
            isFinalized = false,
        } = req.body;

        const {
            sender,
            recipient,
            comments,
        } = req.body.subRequest;


        const newSubRequest = new SubRequest({
            sender,
            recipient,
            subRequestSentAt: new Date(),
            comments,
        });

        await newSubRequest.save();

        const newRequest = new Request({
            requestType,
            project,
            estimatedAmount: 0,
            totalAmount: totalAmount !== 0 ? totalAmount : 0,
            paidAmount: 0,
            requiredAmount: 0,
            items,
            noOfLabour,
            priceOfLabour,
            transportationPrice,
            progress: 25,
            globalStatus,
            isFinalized,
            contractorForPayment,
            paymentType,
            subRequests: [newSubRequest._id],
        });

        await newRequest.save();

        res.status(201).json(newRequest);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Error creating request and subrequest', error });
    }
};

exports.editRequestItems = async (req, res) => {
    try {
        const requestId = req.params.requestId;

        // Find the request object using the request ID
        const request = await Request.findById(requestId);
        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        // Extract the items and amounts from the request body
        const { updatedItems, estimatedAmount, totalAmount, paidAmount, requiredAmount } = req.body;
        // Iterate through the updated items and match them with the existing items in the request
        updatedItems?.forEach(updatedItem => {
            const existingItem = request.items.find(item => item.boqId === updatedItem.boqId);
            if (existingItem) {
                existingItem.unitPrice = updatedItem.unitPrice;
                existingItem.totalPrice = updatedItem.totalPrice;
            }
        });

        request.estimatedAmount = estimatedAmount;
        request.totalAmount = totalAmount;
        request.paidAmount = paidAmount;
        request.requiredAmount = requiredAmount;
        // Save the request with the updated items and amounts
        await request.save();

        // Send success response
        res.status(200).json(request);
    } catch (error) {
        console.error("Error details:", error); // Log the detailed error
        res.status(500).json({ message: 'Error updating request items', error });
    }
};


exports.getRequestBySender = async (req, res) => {
    try {
        const userId = req.params.userId;
        const page = parseInt(req.query.page, 10) || 1;
        const resultsPerPage = parseInt(req.query.resultsPerPage, 10) || 10;
        const skip = (page - 1) * resultsPerPage;
        const requests = await Request.find({})
            .populate({
                path: 'subRequests',
                model: SubRequest,
                match: { sender: userId },
                populate: {
                    path: 'recipient',
                    select: 'fName lName'
                }
            })

            .populate('project')
            .exec();


        const extractedData = [];
        requests.forEach(request => {
            request.subRequests.forEach(subRequest => {
                if (subRequest.sender._id.toString() === userId) {
                    extractedData.push({
                        _id: request._id,
                        requestID: request.requestID,
                        isFinalized: subRequest.isFinalized,
                        projectName: request.project.projectName,
                        subRequestSentAt: subRequest.subRequestSentAt,
                        requestType: request.requestType,
                        recipient: {
                            fName: subRequest.recipient.fName,
                            lName: subRequest.recipient.lName
                        }
                    });
                }
            });
        });

        const count = extractedData.length;
        extractedData.sort((a, b) => b.requestID - a.requestID);

        res.status(200).json({ data: extractedData, count: count, metadata: { total: count } });
    } catch (error) {
        // Handle error
        res.status(500).json({ message: 'Error getting requests by sender', error });
    }
};
exports.getRequestByReceiver = async (req, res) => {
    try {
        const userId = req.params.userId;
        const page = parseInt(req.query.page, 10) || 1;
        const resultsPerPage = parseInt(req.query.resultsPerPage, 10) || 10;
        const skip = (page - 1) * resultsPerPage;
        const requests = await Request.find({})

            .populate({
                path: 'subRequests',
                model: SubRequest,
                match: { recipient: userId },
                populate: {
                    path: 'sender',
                    select: 'fName lName'

                }
            })
            .populate('project')
            .exec();

        const extractedData = [];
        requests.forEach(request => {
            request.subRequests.forEach(subRequest => {
                if (subRequest.recipient._id.toString() === userId) {
                    extractedData.push({
                        _id: request._id,
                        requestID: request.requestID,
                        isFinalized: subRequest.isFinalized,
                        subRequestSentAt: subRequest.subRequestSentAt,
                        projectName: request.project.projectName,
                        requestType: request.requestType,
                        sender: {
                            fName: subRequest.sender.fName,
                            lName: subRequest.sender.lName
                        }
                    });
                }
            });
        });
        extractedData.sort((a, b) => b.requestID - a.requestID);

        const count = extractedData.length;
        res.status(200).json({ data: extractedData, count: count, metadata: { total: count } });
    } catch (error) {
        res.status(500).json({ message: 'Error getting requests by receiver', error });
    }
};



exports.updatePreviousSubRequest = async (req, res) => {
    try {
        // Get request ID and isFinalized from request payload
        const requestId = req.params.requestId;
        const { isFinalized } = req.body;

        // Find the corresponding request
        const request = await Request.findOne({ _id: requestId });
        if (!request || request.subRequests.length === 0) {
            return res.status(404).json({ message: 'Request not found or no subrequests available' });
        }

        // Find the last subrequest
        const lastSubRequestId = request.subRequests[request.subRequests.length - 2];

        // Find the subrequest by ID and update isFinalized
        const subRequest = await SubRequest.findById(lastSubRequestId);
        if (!subRequest) {
            return res.status(404).json({ message: 'SubRequest not found' });
        }

        subRequest.isFinalized = isFinalized;
        await subRequest.save();

        // Send success response
        res.status(200).json({ message: 'SubRequest updated successfully', subRequest });
    } catch (error) {
        res.status(500).json({ message: 'Error updating subrequest', error });
    }
};

exports.editSubRequest = async (req, res) => {
    try {
        const subrequestId = req.params.subrequestId;
        const { isFinalized } = req.body;
        const subRequest = await SubRequest.findById({ _id: subrequestId });
        if (!subRequest) {
            return res.status(404).json({ message: 'SubRequest not found' });
        }
        subRequest.isFinalized = isFinalized;
        await subRequest.save();
        res.status(200).json({ message: 'SubRequest updated successfully', subRequest });

    } catch (error) {
        res.status(500).json({ message: 'Error updating subrequest', error });

    }
}

exports.editRequest = async (req, res) => {
    try {
        const requestId = req.params.requestId;
        const { globalStatus, progress } = req.body;
        const request = await Request.findById({ _id: requestId });
        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }
        request.globalStatus = globalStatus;
        request.progress = progress;
        await request.save();
        res.status(200).json({ message: 'Request updated successfully', request });

    } catch (error) {
        res.status(500).json({ message: 'Error updating Request', error });
    }
}

exports.checkRecipient = async (req, res) => {
    const { userId, requestId } = req.params;

    try {
        const request = await Request.findById(requestId).populate('subRequests');

        if (!request) {
            return res.status(404).send({ message: 'Request not found' });
        }

        const lastSubRequest = request.subRequests[request.subRequests.length - 1];

        if (!lastSubRequest) {
            return res.status(404).send({ message: 'No SubRequest found' });
        }

        const subRequest = await SubRequest.findById(lastSubRequest._id);

        if (!subRequest) {
            return res.status(404).send({ message: 'SubRequest not found' });
        }

        if (subRequest.recipient.toString() === userId.toString()) {
            return res.status(200).send({ isRecipient: true });
        } else {
            return res.status(200).send({ isRecipient: false });
        }
    } catch (error) {
        return res.status(500).send({ message: 'An error occurred', error });
    }
};



exports.getRequestsCount = async (req, res) => {
    try {
        const requests = await Request.countDocuments();
        res.status(200).json({ count: requests })
    }
    catch (err) {
        res.status(500).json({ message: err.message });

    }
}
exports.deleteRequest = async (req, res) => {
    try {
        const request = await Request.findById(req.params.id);

        if (!request) {
            return res.status(404).send('Request not found');
        }

        const comments = req.body.comments;

        const deletedRequest = new DeletedRequest({
            ...request.toObject(),
            comments
        });
        await deletedRequest.save();

        await Request.findByIdAndDelete(req.params.id);

        res.status(200).send('Request deleted successfully');
    } catch (err) {
        console.error(err);
        res.status(500).send(err.message);
    }

}
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