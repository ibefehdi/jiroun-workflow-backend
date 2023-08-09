const mongoose = require('mongoose');
const counterSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    seq: { type: Number, default: 0 }
});

const Counter = mongoose.model('Counter', counterSchema);

const subRequestSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isFinalized: { type: Number, enum: [0, 1, 2], default: 0 },
    subRequestSentAt: { type: Date },
    comments: { type: String, required: true },
}, { timestamps: true });

const SubRequest = mongoose.model('SubRequest', subRequestSchema);

const requestSchema = new mongoose.Schema({
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
    requestID: { type: Number }, //Sequential ID
    progress: { type: Number, default: 0 } // 0 means the first step, 1 the second, etc.

}, { timestamps: true })

const getProgressFromOccupation = (occupation) => {
    switch (occupation) {
        case 'Project Director': return 25;
        case 'Procurement': return 50;
        case 'Finance': return 75;
        case 'Managing Partner': return 90;
        default: return 0; // Default case if occupation doesn't match any of the above
    }
}





requestSchema.pre('save', async function (next) {
    if (this.isNew) {
        try {
            // Find the counter document and increment it
            const counter = await Counter.findByIdAndUpdate(
                { _id: 'requestID' }, // Match this string with the identifier used in your Counter collection
                { $inc: { seq: 1 } },
                { new: true, upsert: true }
            );


            // Set the sequential ID to the incremented value of the counter
            this.requestID = counter.seq; // Match the field name in your schema

            if (this.isNew && this.requestType === 'Request Item') {
                this.progress = 25;
            }
            next();


        } catch (error) {
            // Handle the error
            next(error);
        }
    } else {
        next();
    }
});


const Request = mongoose.model('Request', requestSchema);


module.exports.Counter = Counter;
module.exports.SubRequest = SubRequest;
module.exports.Request = Request;
