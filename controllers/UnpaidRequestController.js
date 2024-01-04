const { Request, SubRequest, Counter, DeletedRequest, UnpaidRequest } = require('../models/requestSchema');

const mongoose = require('mongoose');

exports.getAllUnpaidRequests = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const resultsPerPage = parseInt(req.query.resultsPerPage, 10) || 10;

        const skip = (page - 1) * resultsPerPage;
        const requests = await UnpaidRequest.find().skip(skip)
            .limit(resultsPerPage)
            .populate('project')
            .populate({
                path: 'subRequests',
                populate: {
                    path: 'sender recipient',
                    model: 'User',
                },
            });
        const count = await UnpaidRequest.countDocuments();
        requests.sort((a, b) => b.requestID - a.requestID);

        res.status(200).json({ data: requests, count: count, metadata: { total: count } });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching requests', error: error.message });
    }
};
exports.completeUnpaidRequests = async (req, res) => {
    try {
        // Validate input
        const requestId = req.params.id;
        const reference = req.body.reference;

        if (!requestId || !reference) {
            return res.status(400).json({ message: 'Invalid input' });
        }

        // Find the request
        const request = await UnpaidRequest.findById(requestId);

        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        // Update the request
        request.referenceNumber = reference;
        request.progress = 100;

        // Save the updated request
        await request.save();
        const initiator = await User.findById(request.initiator);
        const contractor = await User.findById(request.contractorForPayment)
        const mailOptions = {
            from: 'noreply@smartlifekwt.com',
            to: initiator?.email,
            subject: `[CONTRACTOR PAID] Your Request No ${request?.requestID} has been completed.`,
            html: `
                <div style="font-family: Arial, sans-serif;">
                    <h2>Hello ${initiator?.fName} ${initiator?.lName},</h2>
                    <p> <span style="color:red; font-weight:bolder">[CONTRACTOR PAID]:</span>The contractor ${contractor?.fName} ${contractor?.lName} from Request ID ${request?.requestID} has been paid for ${request?.paymentType}. You can now proceed with the contractor</strong>.</p>
                    <p>Please <a href="http://161.97.150.244:8081/listyourrequests">Click here</a> for details.</p>
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
        res.status(200).json({ request });

    } catch (error) {
        res.status(500).json({ message: 'Error fetching or updating requests', error });
    }
}
exports.getItemUnpaidRequests = async function (req, res) {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const resultsPerPage = parseInt(req.query.resultsPerPage, 10) || 10;

        const skip = (page - 1) * resultsPerPage;
        const requests = await UnpaidRequest.find({ requestType: "Request Item" }).skip(skip)
            .limit(resultsPerPage)
            .populate('project')
            .populate({
                path: 'subRequests',
                populate: {
                    path: 'sender recipient',
                    model: 'User',
                },
            });
        const count = await UnpaidRequest.countDocuments({ requestType: "Request Item" })
        res.status(200).send({ data: requests, count: count, metadata: { total: count } });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching or updating requests', error });

    }
}
exports.getPaymentUnpaidRequests = async function (req, res) {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const resultsPerPage = parseInt(req.query.resultsPerPage, 10) || 10;

        const skip = (page - 1) * resultsPerPage;
        const requests = await UnpaidRequest.find({ requestType: "Request Payment" }).skip(skip)
            .limit(resultsPerPage)
            .populate('project')
            .populate({
                path: 'subRequests',
                populate: {
                    path: 'sender recipient',
                    model: 'User',
                },
            });
        const count = await UnpaidRequest.countDocuments({ requestType: "Request Payment" })
        res.status(200).send({ data: requests, count: count, metadata: { total: count } });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching or updating requests', error });

    }
}

exports.getUnpaidRequestById = async (req, res) => {
    try {

        const request = await UnpaidRequest.findById(req.params.id)
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