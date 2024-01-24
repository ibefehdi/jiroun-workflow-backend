const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const passport = require("passport");
const session = require("express-session");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcrypt");
const User = require("./models/userSchema")
const projectRoutes = require("./routes/projectRoutes");
const userRoutes = require("./routes/userRoutes");
const requestRoutes = require("./routes/requestRoutes");
const requestRoutes2 = require("./routes/request2Routes");
const completeRequestRoutes = require('./routes/completeRequestRoutes');
const deletedRoutes = require("./routes/DeletedRequestRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const unpaidRequestRoutes = require("./routes/UnpaidRequestRoutes");
const ContractorWorkRoutes = require("./routes/ContractorWorkRoutes");
require('dotenv').config();


const app = express();
app.use(bodyParser.json());
app.use(cors());
app.use(express.json());


const mongoURI = process.env.MONGODB_CONNECTION_STRING;
const port = process.env.PORT || 7001;

app.use(
    session({
        secret: process.env.PASSPORT_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            maxAge: 24 * 60 * 60 * 1000, // The duration in milliseconds that the cookie is valid
            secure: false, // Ensure this is true if your app is running on HTTPS
            httpOnly: true, // Ensures the cookie is sent only over HTTP(S), not client JavaScript, helping to protect against cross-site scripting attacks.
        },
    })
);
app.use(passport.initialize());
app.use(passport.session());
app.use((req, res, next) => {
    const clientVersion = req.headers['app-version'];
    const serverVersion = process.env.APP_VERSION || '1.0';

    if (clientVersion !== serverVersion) {
        return res.status(409).json({ error: 'App version mismatch. Please refresh or reload the application.' });
    }

    next();
});
mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log("Connected to MongoDB"))
    .catch((err) => console.log("Error connecting to MongoDB", err));

passport.use(
    new LocalStrategy(async function (username, password, done) {
        try {
            const user = await User.findOne({ username: username });
            if (!user) {
                return done(null, false, { message: "Incorrect username." });
            }
            const match = await bcrypt.compare(password, user.password);
            if (!match) {
                return done(null, false, { message: "Incorrect password." });
            }
            return done(null, user);
        } catch (err) {
            return done(err);
        }
    })
);
// Serialize & Deserialize User
passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
        done(err, user);
    });
});

app.use('/api/v1/', userRoutes);
app.use('/api/v1/', projectRoutes);
app.use('/api/v1/', requestRoutes)
app.use('/api/v1/new', requestRoutes2);
app.use('/api/v1/', completeRequestRoutes);
app.use('/api/v1/', deletedRoutes)
app.use('/api/v1/', unpaidRequestRoutes)
app.use('/api/v1/', notificationRoutes);
app.use('/api/v1/', ContractorWorkRoutes)
app.listen(port, '0.0.0.0', () => console.log(`Listening on port ${port}`));