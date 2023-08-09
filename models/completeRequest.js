const mongoose = require('mongoose');



const completeSubRequestSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isFinalized: { type: Number, enum: [0, 1, 2], default: 0 },
    subRequestSentAt: { type: Date },
    comments: { type: String, required: true },
}, { timestamps: true });

const CompleteSubRequest = mongoose.model('CompleteSubRequestSchema', completeSubRequestSchema);

const completeRequestSchema = new mongoose.Schema({
    requestType: String,
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    acheivedAmount: { type: Number },
    items: [{
        itemName: { type: String },
        itemQuantity: { type: String },
        boqId: { type: String },
        unitPrice: { type: String },
        totalPrice: { type: String },
    }],
    subRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SubRequest' }],
    globalStatus: { type: Number, enum: [0, 1, 2], default: 0 },
    requestID: { type: Number },
    progress: { type: Number, default: 100 }

}, { timestamps: true })




const CompleteRequest = mongoose.model('CompleteRequest', completeRequestSchema);


module.exports.SubRequest = CompleteSubRequest;
module.exports.Request = CompleteRequest;
