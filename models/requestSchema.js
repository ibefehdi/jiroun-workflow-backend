const mongoose = require('mongoose');
const requestSchema = new mongoose.Schema({
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
    chainOfCommand: [
        {
            userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
            nextUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
            sentAt: { type: Date, required: true },
            status: { type: Number, enum: [0, 1, 2], default: 0 }, // Adding status here
            comments: [
                {
                    comment: { type: String, required: true },
                    madeBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
                    madeAt: { type: Date, required: true },
                }
            ]
        },
    ],
    lastSentBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    completionDate: { type: Date }

}, { timestamps: true });

module.exports = mongoose.model('Request', requestSchema);
