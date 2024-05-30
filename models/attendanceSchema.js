const mongoose = require('mongoose');
const { Schema } = mongoose;
const attendanceSchema = new mongoose.Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  siteId: { type: Schema.Types.ObjectId, ref: "Project", required: true },
  checkIn: { type: Date },
  checkOut: { type: Date },
  workingHours: { type: String }
});

module.exports = mongoose.model('Attendance', attendanceSchema);
