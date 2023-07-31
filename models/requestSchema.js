const mongoose = require('mongoose');
const requestSchema = new mongoose.Schema({
    requestType: String,
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    items: [{
        itemName: { type: String },
        itemQuantity: { type: String },
        boqId: { type: String } // added boqId field in items array
    }],
    acheivedAmount: { type: Number },
    status: { type: Number, enum: [0, 1, 2], default: 0 },
    chainOfCommand: [
        {
            userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // renamed 'user' to 'userId'
            nextUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // renamed 'nextUser' to 'nextUserId'
            sentAt: { type: Date, required: true },
            comments: [
                {
                    comment: { type: String, required: true }, // renamed 'text' to 'comment'
                    madeBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
                    madeAt: { type: Date, required: true },
                }
            ]
        },
    ],
    lastSentBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

module.exports = mongoose.model('Request', requestSchema);
