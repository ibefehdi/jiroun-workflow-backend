const Request = require('../models/completeRequest');
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

        let previousItems = [];

        if (previousRequestId) {
            const previousRequest = await Request.findById(previousRequestId);
            if (previousRequest) {
                previousItems = previousRequest.allRequests || [];
            }
        }

        const newRequest = new Request({
            requestType,
            project,
            sender, // recipient removed here
            items: requestType === 'Request Item' ? items.map(item => ({ itemName: item.itemName, itemQuantity: item.itemQuantity, unitPrice: item.unitPrice, totalPrice: item.totalPrice })) : [],
            acheivedAmount: requestType === 'Request Payment' ? acheivedAmount : 0,
            status: 0,
            comments,
            sentAt: Date.now()
        })
        const savedRequest = await newRequest.save();
        savedRequest.allRequests.push(savedRequest._id);
        if (previousItems.length > 0) {
            savedRequest.allRequests.push(...previousItems);
        }
        await savedRequest.save();

        res.status(201).json(savedRequest);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}
