const { Request, SubRequest, Counter, DeletedRequest, CompletedRequest, UnpaidRequest } = require('../models/requestSchema');
const User = require('../models/userSchema');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');

let transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: 'noreply@smartlifekwt.com',
        pass: 'Sm@Rt@Server'
    }
});
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
        requests.sort((a, b) => b.requestID - a.requestID);
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

exports.getRequestsByProjectId = async (req, res) => {
    try {
        const requests = await Request.find({ project: req.params.projectId })
            .populate('project')
            .populate('initiator')
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
            .populate('initiator')
            .populate({
                path: 'subRequests',
                populate: {
                    path: 'sender recipient ',
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
        const recipientUser = await User.findById(recipient);
        const mailOptions = {
            from: 'noreply@smartlifekwt.com',
            to: recipientUser?.email,
            subject: `[URGENT] There is a new subrequest for <strong>Request ID: ${request.requestID}`,
            html: `
                <div style="font-family: Arial, sans-serif;">
                    <h2>Hello ${recipientUser?.fName} ${recipientUser?.lName},</h2>
                    <p><span style="color:red; font-weight:bold">[URGENT]:</span> New Subrequest Created for Request No <strong>Request ID: ${request.requestID}</strong>.</p>
                    <p>Please <a href="http://213.136.88.115:8005/list_your_requests">Click here</a> to view the details.</p>
                </div>
            `
        };

        // Send the email
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log('Error sending email:', error);
            } else {
                console.log('Email sent:', info.response);
            }
        });


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

        const recipientUser = await User.findById(recipient);

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
            initiator: sender,
            subRequests: [newSubRequest._id],
        });

        await newRequest.save();
        const mailOptions = {
            from: 'noreply@smartlifekwt.com',
            to: recipientUser?.email,
            subject: `[URGENT] There is a new request for you. Request No ${newRequest?.requestID}`,
            html: `
                <div style="font-family: Arial, sans-serif;">
                    <h2>Hello ${recipientUser?.fName} ${recipientUser?.lName},</h2>
                    <p> <span style="color:red; font-weight:bolder">[URGENT]:</span>An action required from your side to complete the request process. Request No ${newRequest?.requestID}</strong>.</p>
                    <p>Please <a href="http://213.136.88.115:8005/list_your_requests">Click here</a> for details.</p>
                </div>
            `
        };

        // Send the email
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log('Error sending email:', error);
            } else {
                console.log('Email sent:', info.response);
            }
        });
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
                existingItem.itemQuantity = updatedItem.itemQuantity;
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
            .populate('contractorForPayment')
            .populate('initiator')
            .exec();

        const requestsMap = {};

        requests.forEach(request => {
            request.subRequests.forEach(subRequest => {
                if (subRequest.sender._id.toString() === userId) {
                    // If this requestID is already in the map and the current subRequest is newer, update the entry
                    if (requestsMap[request.requestID] && requestsMap[request.requestID].subRequestSentAt < subRequest.subRequestSentAt) {
                        requestsMap[request.requestID] = {
                            _id: request._id,
                            requestID: request.requestID,
                            isFinalized: subRequest.isFinalized,
                            projectName: request.project.projectName,
                            subRequestSentAt: subRequest.subRequestSentAt,
                            requestType: request.requestType,
                            recipient: {
                                fName: subRequest.recipient.fName,
                                lName: subRequest.recipient.lName
                            },
                            contractorForPayment: request.contractorForPayment,


                        };
                    }

                    else if (!requestsMap[request.requestID]) {
                        requestsMap[request.requestID] = {
                            _id: request._id,
                            requestID: request.requestID,
                            isFinalized: subRequest.isFinalized,
                            projectName: request.project.projectName,
                            subRequestSentAt: subRequest.subRequestSentAt,
                            requestType: request.requestType,
                            recipient: {
                                fName: subRequest.recipient.fName,
                                lName: subRequest.recipient.lName
                            },
                            contractorForPayment: request.contractorForPayment,

                        };
                    }
                }
            });
        });

        // Convert the requestsMap object values to an array
        const extractedData = Object.values(requestsMap);
        extractedData.sort((a, b) => b.requestID - a.requestID);

        const count = extractedData.length;
        res.status(200).json({ data: extractedData, count: count, metadata: { total: count } });
    } catch (error) {
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
                match: { recipient: userId, isFinalized: 0 },
                populate: {
                    path: 'sender',
                    select: 'fName lName'

                }
            })
            .populate('project')
            .populate('contractorForPayment')
            .populate('initiator')
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
                        contractorForPayment: request.contractorForPayment,
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
exports.getRequestByReceiverCount = async (req, res) => {
    try {
        const userId = req.params.userId;
        const page = parseInt(req.query.page, 10) || 1;
        const resultsPerPage = parseInt(req.query.resultsPerPage, 10) || 10;
        const skip = (page - 1) * resultsPerPage;
        const requests = await Request.find({})
            

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
                        contractorForPayment: request.contractorForPayment,
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
        res.status(200).json({ count: count });
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
        const initiator = await User.findById(deletedRequest.initiator);

        const mailOptions = {
            from: 'noreply@smartlifekwt.com',
            to: initiator?.email,
            subject: `[REJECTED] Your Request No ${deletedRequest?.requestID} has been Rejected.`,
            html: `
                <div style="font-family: Arial, sans-serif;">
                    <h2>Hello ${initiator?.fName} ${initiator?.lName},</h2>
                    <p> <span style="color:red; font-weight:bolder">[COMPLETED]:</span>The Request No ${deletedRequest?.requestID} has been completed that was raised by you.</strong>.</p>
                </div>
            `
        };

        // Send the email
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log('Error sending email:', error);
            } else {
                console.log('Email sent:', info.response);
            }
        });
        await Request.findByIdAndDelete(req.params.id);

        res.status(200).send('Request deleted successfully');
    } catch (err) {
        console.error(err);
        res.status(500).send(err.message);
    }

}
exports.createCompleteRequest = async (req, res) => {
    try {
        const request = await UnpaidRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).send('Request not found');
        }

        const comments = req.body.comments;
        const progress = req.body.progress;
        const referenceNumber = req.body.referenceNumber;
        const completedRequest = new CompletedRequest({
            ...request.toObject(),
            comments,
            progress,
            referenceNumber
        });
        await completedRequest.save();
        const initiator = await User.findById(completedRequest.initiator);
        const mailOptions = {
            from: 'noreply@smartlifekwt.com',
            to: initiator?.email,
            subject: `[COMPLETED] Your Request No ${request?.requestID} has been completed.`,
            html: `
                <div style="font-family: Arial, sans-serif;">
                    <h2>Hello ${initiator?.fName} ${initiator?.lName},</h2>
                    <p> <span style="color:red; font-weight:bolder">[COMPLETED]:</span>The Request No ${completedRequest?.requestID} has been completed that was raised by you.</strong>.</p>
                    <p>Please <a href="http://213.136.88.115:8005/list_your_requests">Click here</a> for details.</p>
                </div>
            `
        };

        // Send the email
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log('Error sending email:', error);
            } else {
                console.log('Email sent:', info.response);
            }
        });
        await UnpaidRequest.findByIdAndDelete(req.params.id);

        res.status(200).send('Request Completed successfully');
    } catch (err) {
        console.error(err);
        res.status(500).send(err.message);
    }


}
exports.getSendersFromSubRequests = async (req, res) => {

    try {

        const requestId = req.params.id;

        const request = await Request.findById(requestId);

        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        // Get distinct sender IDs
        const subRequests = await SubRequest.find({ '_id': { $in: request.subRequests } }).distinct('sender');

        const uniqueSenderIds = [...new Set(subRequests)];

        // Fetch first match for each sender ID
        const senders = await User.aggregate([
            { $match: { '_id': { $in: uniqueSenderIds } } },
            { $group: { _id: '$_id', sender: { $first: '$$ROOT' } } },
            { $replaceRoot: { newRoot: '$sender' } }
        ]);

        return res.status(200).json(senders);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }

};
exports.createUnpaidRequest = async (req, res) => {
    try {
        const request = await Request.findById(req.params.id);

        if (!request) {
            return res.status(404).send('Request not found');
        }

        const comments = req.body.comments;
        const progress = 90;
        const unpaidRequest = new UnpaidRequest({
            ...request.toObject(),
            comments,
            progress
        });
        await unpaidRequest.save();

        let recipientEmail;
        switch (request.requestType) {
            case "Request Item":
                recipientEmail = 'basel.almasri@jiroun.com';
                break;
            case "Request Payment":
                recipientEmail = 'mo.maher@jiroun.com';
                break;
            default:
                recipientEmail = 'testing@gmail.com';
        }

        const mailOptions = {
            from: 'noreply@smartlifekwt.com',
            to: recipientEmail,
            subject: `[UNPAID] Your Request No ${request?.requestID} has been completed but REQUIRES PAYMENT.`,
            html: `
                <div style="font-family: Arial, sans-serif;">
                    <h2>Hello Mohammad Maher,</h2>
                    <p> <span style="color:red; font-weight:bolder">[UNPAID]:</span>The Request No ${unpaidRequest?.requestID} has been approved by a managing partner you can now pay to complete the request.</strong>.</p>
                    <p>Please <a href="http://213.136.88.115:8005/unpaid_requests">Click here</a> for details.</p>
                </div>
            `
        };

        // Send the email
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log('Error sending email:', error);
            } else {
                console.log('Email sent:', info.response);
            }
        });

        await Request.findByIdAndDelete(req.params.id);

        res.status(200).send('Request Updated successfully');
    } catch (err) {
        console.error(err);
        res.status(500).send(err.message);
    }
}
