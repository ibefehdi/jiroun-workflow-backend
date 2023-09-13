const mongoose = require('mongoose');

const User = require('../models/userSchema');

async function migrate() {
    await mongoose.connect('mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+1.10.1', { useNewUrlParser: true, useUnifiedTopology: true });

    const result = await User.updateMany(
        { hasChangedPassword: { $exists: false } },
        { $set: { hasChangedPassword: false } }
    );

    console.log(`Updated ${result.nModified} documents.`);
    mongoose.connection.close();
}

migrate().catch(console.error);