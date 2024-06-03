const { Request, SubRequest, Counter, DeletedRequest, CompletedRequest, UnpaidRequest } = require('../models/requestSchema');
const User = require('../models/userSchema');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const multer = require('multer');
const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
        if (file.fieldname.startsWith('attachments_') || file.fieldname === 'attachment') {
            cb(null, true);
        } else {
            cb(new Error('Invalid field name'));
        }
    }
});
const AWS = require('aws-sdk')

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
        const requestType = req.query.requestType;
        const startDate = req.query.startDate;
        const endDate = req.query.endDate;
        const initiator = req.query.initiator;
        const contractorForPayment = req.query.contractorForPayment;
        const project = req.query.project;
        const requestID = req.query.requestID;
        const skip = (page - 1) * resultsPerPage;

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
        if (requestID) {
            const regex = new RegExp(requestID, 'i');
            queryConditions.$expr = { $regexMatch: { input: { $toString: "$requestID" }, regex: regex } };

        }
        if (contractorForPayment) {
            queryConditions.contractorForPayment = contractorForPayment;
        }
        if (project) {
            queryConditions.project = project;
        }

        const requests = await Request.find(queryConditions)

            .populate('contractorForPayment').populate('initiator').populate('contractorForPayment')

            .populate('project')
            .populate({
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
            }).exec();
        const deletedRequests = await DeletedRequest.find(queryConditions)
            .populate('project').populate('initiator').populate('contractorForPayment')
            .populate({
                path: 'subRequests',
                populate: {
                    path: 'sender recipient',
                    model: 'User',
                },
            }).exec();
        const completedRequests = await CompletedRequest.find(queryConditions)
            .populate('project').populate('initiator').populate('contractorForPayment')
            .populate({
                path: 'subRequests',
                populate: {
                    path: 'sender recipient',
                    model: 'User',
                },
            }).exec();
        const unpaidRequests = await UnpaidRequest.find(queryConditions)
            .populate('project').populate('initiator').populate('contractorForPayment')
            .populate({
                path: 'subRequests',
                populate: {
                    path: 'sender recipient',
                    model: 'User',
                },
            }).exec();
        const combinedRequests = [...requests, ...deletedRequests, ...completedRequests, ...unpaidRequests];

        const countRequests = await Request.count(queryConditions);
        const countDeletedRequests = await DeletedRequest.countDocuments(queryConditions);
        const countCompletedRequests = await CompletedRequest.countDocuments(queryConditions);
        const countUnpaidRequests = await UnpaidRequest.countDocuments(queryConditions);
        const totalCount = countRequests + countDeletedRequests + countCompletedRequests + countUnpaidRequests;
        const startIndex = (page - 1) * resultsPerPage;
        const endIndex = startIndex + resultsPerPage;
        const paginatedResults = combinedRequests.slice(startIndex, endIndex);
        // combinedRequests.sort((b, a) => a.requestID - b.requestID);
        res.status(200).json({
            data: combinedRequests,
            count: totalCount,
            metadata: { total: totalCount }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching requests', error });
    }
};


exports.getRequestById = async (req, res) => {
    try {
        // Function to search a model for the request
        const findRequestInModel = async (model) => {
            return model.findById(req.params.id)
                .populate('project')
                .populate({
                    path: 'subRequests',
                    populate: {
                        path: 'sender recipient',
                        model: 'User',
                    }
                })
                .populate('initiator').populate('contractorForPayment')
                .populate({
                    path: 'subRequests',
                    populate: {
                        path: 'sender recipient',
                        model: 'User',
                    }
                })
                .lean();
        };

        // Initiate parallel searches
        const [request, unpaidRequest, completedRequest, deletedRequest] = await Promise.all([
            findRequestInModel(Request),
            findRequestInModel(UnpaidRequest),
            findRequestInModel(CompletedRequest),
            findRequestInModel(DeletedRequest)
        ]);

        // Return the first non-null result
        let foundRequest = request || unpaidRequest || completedRequest || deletedRequest;

        if (!foundRequest) {
            return res.status(404).json({ message: 'Request not found' });
        }

        // Add completionReason or deletedReason based on the request type
        if (completedRequest) {
            foundRequest.completionReason = completedRequest.comments;
        } else if (deletedRequest) {
            foundRequest.deletedReason = deletedRequest.comments;
        }
        else if (unpaidRequest) {
            foundRequest.unpaidReason = unpaidRequest.comments;
        }

        res.status(200).json(foundRequest);
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
        const recipientUser = await User.findById(recipient);
        const mailOptions = {
            from: 'noreply@smartlifekwt.com',
            to: recipientUser?.email,
            subject: `[NEW REQUEST]There is a new subrequest for <strong>Request ID: ${request.requestID}`,
            html: `
                <div style="font-family: Arial, sans-serif;">
                    <h2>Hello ${recipientUser?.fName} ${recipientUser?.lName},</h2>
                    <p><span style="color:red; font-weight:bold">[NEW REQUEST]:</span> New Subrequest Created for Request No <strong>Request ID: ${request.requestID}</strong>.</p>
                    <p>Please <a href="http://161.97.150.244:8081//list_your_requests">Click here</a> to view the details.</p>
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
    upload.any()(req, res, async (err) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ message: 'Error uploading files', error: err });
        }
        const { ObjectId } = mongoose.Types;

        try {
            // Extract fields for the request
            const {
                requestType,
                project,
                requestTitle,
                paymentType,
                mobile,
                globalStatus = 0,
                isFinalized = 'false',
                subRequest,
            } = req.body;
            console.log("the req body: ", req.body)
            const projectId = typeof project === 'string' ? new ObjectId(project.replace(/"/g, '')) : project;
            let contractorForPayment
            if (req.body.contractorForPayment) {
                contractorForPayment = req.body.contractorForPayment

            }
            console.log(contractorForPayment)
            const items = req.body.items ? JSON.parse(req.body.items) : null;
            const labour = req.body.labour ? JSON.parse(req.body.labour) : null;
            console.log("labour before parse", req.body.labour)
            console.log("Labour after parse: ", labour);
            const { sender, recipient, comments } = JSON.parse(subRequest);
            console.log(sender, recipient, comments);
            // Configure AWS SDK
            const s3 = new AWS.S3({
                accessKeyId: process.env.S3_ACCESS_KEY,
                secretAccessKey: process.env.S3_SECRET_KEY,
                endpoint: 'https://usc1.contabostorage.com',
                s3ForcePathStyle: true,
                signatureVersion: 'v4',
                region: process.env.S3_REGION,
            });
            let attachmentUrl = null;
            if (req.files && req.files.length > 0) {
                const attachmentFile = req.files.find((file) => file.fieldname === 'attachment');
                console.log(attachmentFile)
                if (attachmentFile) {
                    const uniqueFileName = `${Date.now()}-${attachmentFile.originalname}`;
                    const params = {
                        Bucket: 'jiroun-attachments',
                        Key: uniqueFileName,
                        Body: attachmentFile.buffer,
                        ContentType: attachmentFile.mimetype,
                    };
                    const uploadResult = await s3.upload(params).promise();
                    attachmentUrl = `https://usc1.contabostorage.com/410b07e5584e4d59abd535a08d7a69e6:jiroun-attachments/${uploadResult.Key}`;
                }
            }
            let updatedLabour = null;
            console.log("is it array? ", Array.isArray(labour))
            if (labour && Array.isArray(labour)) {
                console.log("Inside the if block");

                updatedLabour = await Promise.all(
                    labour.map(async (item, index) => {
                        const attachments = req.files.filter((file) => file.fieldname === `attachments_${index}`);
                        console.log(attachments);
                        const attachmentUrls = await Promise.all(
                            attachments.map(async (file) => {
                                const uniqueFileName = `${Date.now()}-${file.originalname}`;
                                const params = {
                                    Bucket: 'jiroun-attachments',
                                    Key: uniqueFileName,
                                    Body: file.buffer,
                                    ContentType: file.mimetype,
                                };
                                const uploadResult = await s3.upload(params).promise();
                                return `https://usc1.contabostorage.com/410b07e5584e4d59abd535a08d7a69e6:jiroun-attachments/${uploadResult.Key}`;
                            })
                        );
                        return { ...item, labourAttachments: attachmentUrls.join(',') };
                    })
                );
            }

            // Create a new SubRequest
            const newSubRequest = new SubRequest({
                sender,
                recipient,
                subRequestSentAt: new Date(),
                comments,
            });
            await newSubRequest.save();

            // Find the recipient user
            const recipientUser = await User.findById(recipient);
            const noOfLabour = updatedLabour && Array.isArray(updatedLabour)
                ? updatedLabour.reduce((total, item) => total + parseInt(item.numberOfSpecializedLabour), 0)
                : 0;

            const priceOfLabour = updatedLabour && Array.isArray(updatedLabour)
                ? updatedLabour.reduce((total, item) => total + parseFloat(item.unitPriceOfLabour), 0)
                : 0;

            const transportationPrice = updatedLabour && Array.isArray(updatedLabour)
                ? updatedLabour.reduce((total, item) => total + parseFloat(item.unitTransportationPrice), 0)
                : 0;
            // Calculate total values
            const totalAmount = updatedLabour && Array.isArray(updatedLabour)
                ? updatedLabour.reduce((total, item) => {
                    const itemTotal = (parseInt(item.numberOfSpecializedLabour) * parseFloat(item.unitPriceOfLabour)) + parseFloat(item.unitTransportationPrice);
                    return total + itemTotal;
                }, 0)
                : 0;
            console.log(`Number of Labour: ${noOfLabour}`);
            console.log(`Price of Labour: ${priceOfLabour}`);
            console.log(`Transportation Price: ${transportationPrice}`);
            console.log(`Total Amount: ${totalAmount}`);
            // Create a new Request
            const newRequest = new Request({
                requestType,
                project: projectId,
                estimatedAmount: 0,
                requestTitle,
                totalAmount: !isNaN(totalAmount) ? totalAmount : 0,
                paidAmount: 0,
                requiredAmount: 0,
                items: items !== null ? items : [],
                noOfLabour: !isNaN(noOfLabour) ? noOfLabour : 0,
                priceOfLabour: !isNaN(priceOfLabour) ? priceOfLabour : 0,
                transportationPrice: !isNaN(transportationPrice) ? transportationPrice : 0,
                progress: 25,
                globalStatus,
                isFinalized,
                contractorForPayment: mobile
                    ? !isNaN(contractorForPayment) && contractorForPayment !== "null"
                        ? contractorForPayment
                        : null
                    : contractorForPayment !== "null"
                        ? contractorForPayment
                        : null,
                initiator: sender,
                subRequests: [newSubRequest._id],
                attachment: attachmentUrl,

                labour: updatedLabour !== null && updatedLabour !== undefined ? updatedLabour : [],
            });
            await newRequest.save();

            const mailOptions = {
                from: 'noreply@smartlifekwt.com',
                to: recipientUser?.email,
                subject: `[NEW REQUEST] There is a new request for you. Request No ${newRequest?.requestID}`,
                html: `
            <div style="font-family: Arial, sans-serif;">
              <h2>Hello ${recipientUser?.fName} ${recipientUser?.lName},</h2>
              <p><span style="color:red; font-weight:bolder">[NEW REQUEST]:</span>An action required from your side to complete the request process. Request No ${newRequest?.requestID}</strong>.</p>
              <p>Please <a href="http://161.97.150.244:8081//list_your_requests">Click here</a> for details.</p>
            </div>
          `,
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
    });
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
        const { estimatedAmount, totalAmount, paidAmount, requiredAmount, noOfLabour, priceOfLabour, transportationPrice } = req.body;
        console.log("This is the req.body", req.body)
        // Iterate through the updated items and match them with the existing items in the request
        // updatedItems?.forEach(updatedItem => {
        //     const existingItem = request.items.find(item => item.boqId === updatedItem.boqId);
        //     if (existingItem) {
        //         existingItem.itemQuantity = updatedItem.itemQuantity;
        //         existingItem.unitPrice = updatedItem.unitPrice;
        //         existingItem.totalPrice = updatedItem.totalPrice;
        //     }
        // });

        if (noOfLabour !== undefined && noOfLabour !== null) request.noOfLabour = noOfLabour;
        if (priceOfLabour !== undefined && priceOfLabour !== null) request.priceOfLabour = priceOfLabour;
        if (transportationPrice !== undefined && transportationPrice !== null) request.transportationPrice = transportationPrice;
        if (estimatedAmount !== undefined && estimatedAmount !== null) request.estimatedAmount = estimatedAmount;
        if (totalAmount !== undefined && totalAmount !== null) request.totalAmount = totalAmount;
        if (paidAmount !== undefined && paidAmount !== null) request.paidAmount = paidAmount;
        if (requiredAmount !== undefined && requiredAmount !== null) request.requiredAmount = requiredAmount;

        // Save the request with the updated items and amounts
        await request.save();

        // Send success response
        res.status(200).json(request);
    } catch (error) {
        console.error("Error details:", error); // Log the detailed error
        res.status(500).json({ message: 'Error updating request items', error });
    }
};

exports.editContractorinRequest = async (req, res) => {
    try {
        const requestId = req.params.requestId;

        const request = await Request.findById(requestId);
        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        const { contractorForPayment } = req.body;


        request.contractorForPayment = contractorForPayment;

        await request.save();

        // Send success response
        res.status(200).json(request);
    } catch (error) {
        console.error("Error details:", error);
        res.status(500).json({ message: 'Error updating request items', error });
    }
};

exports.getRequestBySender = async (req, res) => {
    try {
        const userId = req.params.userId;
        console.log(userId)
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
        // console.log(requests)
        const completedRequests = await CompletedRequest.find({})
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
        // console.log(completedRequests)

        const deletedRequests = await DeletedRequest.find({})
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
        // console.log(deletedRequests)
        const unpaidRequests = await UnpaidRequest.find({})
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
        // console.log(unpaidRequests)
        const requestsMap = {};
        const combinedRequests = [...requests, ...deletedRequests, ...completedRequests, ...unpaidRequests];
        // console.log(combinedRequests)
        combinedRequests.forEach(request => {
            request.subRequests.forEach(subRequest => {
                if (subRequest.sender._id.toString() === userId) {
                    // If this requestID is already in the map and the current subRequest is newer, update the entry
                    if (requestsMap[request.requestID] && requestsMap[request.requestID].subRequestSentAt < subRequest.subRequestSentAt) {
                        console.log("first")
                        requestsMap[request.requestID] = {
                            _id: request._id,
                            requestID: request.requestID,
                            isFinalized: subRequest.isFinalized !== undefined ? subRequest.isFinalized : 'N/A',
                            projectName: request.project && request.project.projectName ? request.project.projectName : 'N/A',
                            subRequestSentAt: subRequest.subRequestSentAt,
                            attachment: request.attachment !== undefined ? request.attachment : 'N/A',
                            requestType: request.requestType !== undefined ? request.requestType : 'N/A',
                            requestTitle: request.requestTitle !== undefined ? request.requestTitle : 'N/A',
                            recipient: {
                                fName: subRequest.recipient && subRequest.recipient.fName ? subRequest.recipient.fName : 'N/A',
                                lName: subRequest.recipient && subRequest.recipient.lName ? subRequest.recipient.lName : 'N/A'
                            },
                            contractorForPayment: request.contractorForPayment !== undefined ? request.contractorForPayment : 'N/A'


                        };
                    }

                    else if (!requestsMap[request.requestID]) {
                        console.log
                        requestsMap[request.requestID] = {
                            _id: request._id,
                            requestID: request.requestID,
                            isFinalized: subRequest.isFinalized !== undefined ? subRequest.isFinalized : 'N/A',
                            projectName: request.project && request.project.projectName ? request.project.projectName : 'N/A',
                            subRequestSentAt: subRequest.subRequestSentAt,
                            attachment: request.attachment !== undefined ? request.attachment : 'N/A',
                            requestType: request.requestType !== undefined ? request.requestType : 'N/A',
                            requestTitle: request.requestTitle !== undefined ? request.requestTitle : 'N/A',
                            recipient: {
                                fName: subRequest.recipient && subRequest.recipient.fName ? subRequest.recipient.fName : 'N/A',
                                lName: subRequest.recipient && subRequest.recipient.lName ? subRequest.recipient.lName : 'N/A'
                            },
                            contractorForPayment: request.contractorForPayment !== undefined ? request.contractorForPayment : 'N/A'

                        };
                    }
                }
            });
        });

        // Convert the requestsMap object values to an array
        const extractedData = Object.values(requestsMap);
        // console.log(extractedData);
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
                        subrequestId: subRequest._id,
                        requestID: request.requestID,
                        isFinalized: subRequest.isFinalized,
                        subRequestSentAt: subRequest.subRequestSentAt,
                        requestTitle: request.requestTitle,
                        attachment: request.attachment,
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
                        requestTitle: request.requestTitle,
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
        console.log("Subrequest ID: " + subrequestId + " isFinalized: " + isFinalized);
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
        const timeStamp = new Date();
        const deletedRequest = new DeletedRequest({
            ...request.toObject(),
            comments,
            timeStamp,
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
exports.rejectandremove = async (req, res) => {
    try {
        const request = await Request.findById(req.params.id);
        const { isFinalized, comments } = req.body;

        if (!request) {
            return res.status(404).send('Request not found');
        }
        const lastSubRequestId = request.subRequests[request.subRequests.length - 1];

        // Find the subrequest by ID and update isFinalized
        const subRequest = await SubRequest.findById(lastSubRequestId);
        if (!subRequest) {
            return res.status(404).json({ message: 'SubRequest not found' });
        }

        subRequest.isFinalized = isFinalized;
        await subRequest.save();
        const timeStamp = new Date();
        const deletedRequest = new DeletedRequest({
            ...request.toObject(),
            comments,
            timeStamp,
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
        const requestFinalizedAt = new Date();
        const completedRequest = new CompletedRequest({
            ...request.toObject(),
            comments,
            progress,
            requestFinalizedAt,
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
                    <p>Please <a href="http://161.97.150.244:8081/list_your_requests">Click here</a> for details.</p>
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
        console.log(req.params.id);
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
        const requestFinalApprovalAt = new Date();
        const comments = req.body.comments;
        const recipient = req.body.recipient;
        console.log(recipient);
        const progress = 90;
        const unpaidRequest = new UnpaidRequest({
            ...request.toObject(),
            comments,
            progress,
            requestFinalApprovalAt
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
                    <p>Please <a href="http://161.97.150.244:8081/unpaid_requests">Click here</a> for details.</p>
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
exports.getRequestInitiator = async (req, res) => {
    try {
        const request = await Request.findById(req.params.id).populate('initiator');
        const initiator = request.initiator;
        console.log(initiator);
        res.status(200).json({ initiator: initiator });
    } catch (err) {
        res.status(500).send(err.message);
    }
}
