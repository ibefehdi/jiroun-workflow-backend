const User = require('../models/userSchema');
// require bcrypt for password hashing
const bcrypt = require('bcrypt');

exports.addUser = async (req, res, next) => {
    try {
        // Get user input
        const { userName, fName, lName, occupation, superAdmin, password } = req.body;

        // Validate user input
        if (!(userName && fName && lName && occupation && password)) {
            res.status(400).send("All input is required");
        }

        // check if user already exist
        const oldUser = await User.findOne({ userName });

        if (oldUser) {
            return res.status(409).send("User Already Exist. Please Login");
        }

        //Encrypt user password
        const encryptedPassword = await bcrypt.hash(password, 10);

        // Create user in our database
        const user = await User.create({
            userName,
            fName,
            lName,
            occupation,
            superAdmin: superAdmin || false,  // By default superAdmin is set to false unless provided
            password: encryptedPassword,
        });

        // return new user
        res.status(201).json(user);
    } catch (err) {
        console.log(err);
    }
};
exports.loginUser = async (req,res,next)=>{
    passport.authenticate("local", async function (err, user, info) {
        if (err) {
          return next(err);
        }
        if (!user) {
          return res.status(401).send(info.message);
        }
        req.logIn(user, async function (err) {
          if (err) {
            return next(err);
          }
          return res.status(200).json({
            message: "Authenticated successfully.",
            username:user.userName,
            fName: user.fName,
            lName: user.lName,
            occupation: user.occupation,
            superAdmin:user.superAdmin
          });
        });
      })(req, res, next);
}
exports.getAllUsers = async (req, res, next) => {
    try {
        const users = await User.aggregate([
            {
                $project: {
                    _id: 1,
                    userName: 1,
                    fName: 1,
                    lName: 1,
                    occupation: 1,
                }
            }
        ]);
        res.status(200).json(users)
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}