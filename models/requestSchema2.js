const mongoose = require('mongoose');
const requestSchema2 = new mongoose.Schema({
    requestType: String,
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    items: [{
        itemName: { type: String },
        itemQuantity: { type: String },
        boqId: { type: String },
        unitPrice: { type: String },
        totalPrice: { type: String },
    }],
    acheivedAmount: { type: Number },
    status: { type: Number, enum: [0, 1, 2], default: 0 },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    recipientRequestId: { type: mongoose.Schema.Types.ObjectId, ref: 'Request2' },
    previousRequestId: { type: mongoose.Schema.Types.ObjectId, ref: 'Request2' },
    allRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Request2' }],
    sentAt: { type: Date },
    comments: { type: String, required: true }
})
module.exports = mongoose.model('Request2', requestSchema2);
