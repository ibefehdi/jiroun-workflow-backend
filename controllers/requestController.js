const { Request, SubRequest, Counter, DeletedRequest } = require('../models/requestSchema');
const mongoose = require('mongoose');


exports.getAllRequests = async (req, res) => {
    try {
        const requests = await Request.find()
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
        res.status(500).json({ message: 'Error fetching requests', error });
    }
};

exports.getRequestById = async (req, res) => {
    try {

        const request = await Request.findById(req.params.id)
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

        if (request.subRequests.length > 0 && request.requestType === 'Request Item') {
            const lastSubRequest = await SubRequest.findById(request.subRequests[request.subRequests.length - 1]).populate('recipient');

            if (lastSubRequest) {
                if (lastSubRequest.recipient.occupation === 'Project Director') request.progress = 25;
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
            acheivedAmount,
            items,
            globalStatus = 0,
            isFinalized = false,
        } = req.body;

        // Extract fields for the subrequest
        const {
            sender,
            recipient,
            comments,
        } = req.body.subRequest; // Assuming subrequest data is nested under "subRequest"

        // Validate fields if necessary

        // Create a new subrequest using Mongoose with the current timestamp
        const newSubRequest = new SubRequest({
            sender,
            recipient,
            subRequestSentAt: new Date(), // Set to current timestamp
            comments,
        });

        await newSubRequest.save();

        // Create a new request object and include the subrequest ID
        const newRequest = new Request({
            requestType,
            project,
            acheivedAmount,
            items,
            globalStatus,
            isFinalized,
            subRequests: [newSubRequest._id], // Include the new subrequest
        });

        // Save the new request using Mongoose
        await newRequest.save();

        // Send success response
        res.status(201).json(newRequest);
    } catch (error) {
        // Handle error
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

        // Extract the items from the request body
        const updatedItems = req.body.items;

        // Iterate through the updated items and match them with the existing items in the request
        updatedItems.forEach(updatedItem => {
            const existingItem = request.items.find(item => item.boqId === updatedItem.boqId);
            if (existingItem) {
                existingItem.unitPrice = updatedItem.unitPrice;
                existingItem.totalPrice = updatedItem.totalPrice;
            }
        });

        // Save the request with the updated items
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

        res.status(200).json({ data: extractedData, count: count, metadata: { total: count } });
    } catch (error) {
        // Handle error
        res.status(500).json({ message: 'Error getting requests by sender', error });
    }
};
exports.getRequestByReceiver = async (req, res) => {
    try {
        const userId = req.params.userId;

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
        const { globalStatus } = req.body;
        const request = await Request.findById({ _id: requestId });
        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }
        request.globalStatus = globalStatus;
        await request.save();
        res.status(200).json({ message: 'Request updated successfully', request });

    } catch (error) {
        res.status(500).json({ message: 'Error updating Request', error });
    }
}

exports.checkRecipient = async (req, res) => {
    const { userId, requestId } = req.params; // Assuming that userId and requestId are passed as URL parameters

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
        // Find the request by ID
        const request = await Request.findById(req.params.id);

        // If no request found, handle it accordingly
        if (!request) {
            return res.status(404).send('Request not found');
        }

        // Get comments from the request body
        const comments = req.body.comments;

        // Create a new DeletedRequest using the found request's data and the comments
        const deletedRequest = new DeletedRequest({
            ...request.toObject(),
            comments
        });
        await deletedRequest.save();

        // Delete the request from the original collection
        await Request.findByIdAndDelete(req.params.id); // Updated line

        // Send a success response
        res.status(200).send('Request deleted successfully');
    } catch (err) {
        // Log the full error to the console
        console.error(err);
        res.status(500).send(err.message);
    }

}
