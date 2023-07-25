const mongoose = require('mongoose');
const requestSchema = new mongoose.Schema({
    requestType: String,
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [{
        itemName: { type: String, required: true },
        itemQuantity: { type: String, required: true },
        unitPrice: Number,
        totalPrice: Number,
    }],
    acheivedAmount: { type: Number, required: true },
    status: { type: Number, enum: [0, 1, 2], default: 0 }, // 0: Attention Required, 1: Approved, 2: Declined and more information is required
    chainOfCommand: [ //Chain of commands is how the request is going to move down the chain of command ending always in a managing partner unless it has been declined
        {
            user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
            sentAt: { type: Date, required: true },
            comments: [
                {
                    text: { type: String, required: true },
                    madeBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
                    madeAt: { type: Date, required: true },
                }
            ]
        },

    ],
    lastSentBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
});
// TODO: Add separate endpoints for the declined, approved and Attention required requests, Also add an endpoint that sends back all the requests
module.exports = mongoose.model('Request', requestSchema);