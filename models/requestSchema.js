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
    //Main Request
    requestType: String,
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    globalStatus: { type: Number, enum: [0, 1, 2, 3], default: 0 },
    requestID: { type: Number },
    progress: { type: Number, default: 0 },
    initiator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    //Request Item
    items: [{
        itemName: { type: String },
        itemQuantity: { type: String },
        boqId: { type: String },
        unitPrice: { type: String },
        totalPrice: { type: String },
    }],
    //Request Payment
    paymentType: { type: String },
    estimatedAmount: { type: Number },
    paidAmount: { type: Number },
    requiredAmount: { type: Number },
    totalAmount: { type: Number },
    contractorForPayment: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    //Subrequests
    subRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SubRequest' }],
    //Request Labour
    noOfLabour: { type: Number },
    priceOfLabour: { type: Number },
    transportationPrice: { type: Number },


}, { timestamps: true })


requestSchema.pre('save', async function (next) {
    if (this.isNew) {
        try {
            const counter = await Counter.findByIdAndUpdate(
                { _id: 'requestID' },
                { $inc: { seq: 1 } },
                { new: true, upsert: true }
            );


            this.requestID = counter.seq;

            next();


        } catch (error) {

            next(error);
        }
    } else {
        next();
    }
});


const Request = mongoose.model('Request', requestSchema);

const deletedRequestSchema = new mongoose.Schema({
    ...requestSchema.obj,
    comments: { type: String }
});
const DeletedRequest = mongoose.model('DeletedRequest', deletedRequestSchema);
const completedRequestSchema = new mongoose.Schema({
    ...requestSchema.obj,
    comments: { type: String }
});
const CompletedRequest = mongoose.model('CompletedRequest', completedRequestSchema);

module.exports.Counter = Counter;
module.exports.SubRequest = SubRequest;
module.exports.Request = Request;
module.exports.DeletedRequest = DeletedRequest;
module.exports.CompletedRequest = CompletedRequest;
