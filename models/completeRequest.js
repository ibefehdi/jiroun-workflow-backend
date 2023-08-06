const mongoose = require('mongoose');
const completeRequest = new mongoose.Schema({
    requestType: String,
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    items: [{
        itemName: { type: String },
        itemQuantity: { type: String },
        boqId: { type: String },
        unitPrice: { type: String },
        totalPrice: { type: String },
    }],
    acheivedAmount: { type: Number },
    status: { type: Number, enum: [0, 1, 2], default: 0 },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    recipientRequestId: { type: mongoose.Schema.Types.ObjectId, ref: 'Request2' },
    previousRequestId: { type: mongoose.Schema.Types.ObjectId, ref: 'Request2' },
    allRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Request2' }],
    sentAt: { type: Date },
    comments: { type: String }
})
module.exports = mongoose.model('CompleteRequest', completeRequest);
