const mongoose = require('mongoose');
const requestSchema = new mongoose.Schema({
    requestType: String,
    items: [{
        itemName: { type: String, required: true },
        itemQuantity: { type: String, required: true },
        unitPrice: Number,
        totalPrice: Number,
    }],
    status: { type: Number, enum: [0, 1, 2], default: 0 }, // 0: Attention Required, 1: Approved, 2: Declined and more information is required
    chainOfCommand: [
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

module.exports = mongoose.model('Request', requestSchema);