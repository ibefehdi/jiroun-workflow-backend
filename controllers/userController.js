const User = require('../models/userSchema');
const bcrypt = require('bcrypt');
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;


exports.getUsersCount = async (req, res) => {
    try {
        const users = await User.countDocuments();
        res.status(200).json({ count: users })
    }
    catch (err) {
        res.status(500).json({ message: err.message });

    }
}
exports.disableUser = async (req, res) => {
    const { id } = req.params;

    try {
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        user.active = false
        await user.save();
    } catch (err) {
        res.status(404).json({ message: err });
    }
}
exports.changePassword = async (req, res) => {
    const { id } = req.params;
    const { oldPassword, newPassword } = req.body;

    if (!id || !oldPassword || !newPassword) {
        return res.status(400).json({ message: "Please provide userId, oldPassword and newPassword." });
    }

    try {
        // Fetch user by ID
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        // Compare old password with the one stored in the database
        const passwordMatch = await bcrypt.compare(oldPassword, user.password);
        if (!passwordMatch) {
            return res.status(400).json({ message: "Old password is incorrect." });
        }

        // If old password matches, hash the new password and update the user document
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        user.hasChangedPassword = true; // Set this flag to true since the password is being changed
        await user.save();

        res.status(201).json({
            message: "Sign-up successfully.",
            username: user.username,
            fName: user.fName,
            lName: user.lName,
            occupation: user.occupation,
            superAdmin: user.superAdmin,
            hasChangedPassword: user.hasChangedPassword,
            _id: user._id
        })
    } catch (error) {
        res.status(500).json({ message: "Server error." });
    }
};

exports.resetPassword = async (req, res) => {
    const { id } = req.params;
    const { newPassword } = req.body;


    try {
        // Fetch user by ID
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        // If old password matches, hash the new password and update the user document
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        user.hasChangedPassword = false;
        await user.save();

        res.status(201).json({
            message: "Sign-up successfully.",
            username: user.username,
            fName: user.fName,
            lName: user.lName,
            occupation: user.occupation,
            superAdmin: user.superAdmin,
            hasChangedPassword: user.hasChangedPassword,
            _id: user._id
        })
    } catch (error) {
        res.status(500).json({ message: "Server error." });
    }
};

exports.editUser = async (req, res, next) => {
    try {
        const id = req.params.id;
        const { username, fName, lName, occupation, superAdmin, email, phoneNo, permissions } = req.body;

        let updateObject = {};
        if (username) updateObject.username = username;
        if (fName) updateObject.fName = fName;
        if (lName) updateObject.lName = lName;
        if (phoneNo) updateObject.phoneNo = phoneNo;
        if (occupation) updateObject.occupation = occupation;
        if (typeof superAdmin !== 'undefined') updateObject.superAdmin = superAdmin;
        if (email) updateObject.email = email;
        if (permissions) updateObject.permissions = permissions

        const updatedUser = await User.findByIdAndUpdate(id, updateObject, { new: true });

        res.status(200).json({ message: "User Updated.", data: { user: updatedUser } });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Failed to update user.", error: error.message });
    }
}

exports.addUser = async (req, res, next) => {
    try {
        // Get user input
        const { username, fName, lName, occupation, superAdmin, password, email, phoneNo, permissions } = req.body;

        // Validate user input
        if (!(username && fName && lName && occupation && password)) {
            res.status(400).send("All input is required");
        }

        // check if user already exist
        const oldUser = await User.findOne({ username });

        if (oldUser) {
            return res.status(409).send("User Already Exist. Please Login");
        }

        //Encrypt user password
        const encryptedPassword = await bcrypt.hash(password, 10);

        // Create user in our database
        const user = await User.create({
            username,
            fName,
            lName,
            phoneNo,
            occupation,
            email,
            permissions,
            superAdmin: superAdmin || false,  // By default superAdmin is set to false unless provided
            password: encryptedPassword,
        });

        // return new user
        res.status(201).json({
            message: "Sign-up successfully.",
            username: user.username,
            fName: user.fName,
            lName: user.lName,
            email: user.email,
            phoneNo: user.phoneNo,
            occupation: user.occupation,
            superAdmin: user.superAdmin,
            hasChangedPassword: user.hasChangedPassword,
            permissions: user.permissions,
            _id: user._id
        });
    } catch (err) {
        console.log(err);
    }
};
exports.loginUser = async (req, res, next) => {
    passport.authenticate("local", async function (err, user, info) {
        console.log(user);
        if (err) {
            return next(err);
        }
        if (!user) {
            return res.status(401).json({ error: info.message });
        }
        req.logIn(user, async function (err) {
            if (err) {
                return next(err);
            }
            console.log({
                message: "Authenticated successfully.",
                username: user.username,
                fName: user.fName,
                lName: user.lName,
                occupation: user.occupation,
                superAdmin: user.superAdmin,
                hasChangedPassword: user.hasChangedPassword,
                permissions: user.permissions,
                _id: user._id
            });
            return res.status(200).json({
                message: "Authenticated successfully.",
                username: user.username,
                fName: user.fName,
                lName: user.lName,
                occupation: user.occupation,
                superAdmin: user.superAdmin,
                hasChangedPassword: user.hasChangedPassword,
                permissions: user.permissions,
                _id: user._id
            });
        });
    })(req, res, next);
}
exports.getAllUsers = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const resultsPerPage = parseInt(req.query.resultsPerPage, 10) || 10;

        const skip = (page - 1) * resultsPerPage;
        const users = await User.find({
            occupation: { $nin: ['Contractor', 'Inactive'] }
        }, {
            _id: 1,
            username: 1,
            fName: 1,
            lName: 1,
            phoneNo: 1,
            occupation: 1,
            superAdmin: 1,
            permissions: 1,
            email: 1,
        }).skip(skip)
            .limit(resultsPerPage);

        // Get the count of all users
        const count = await User.countDocuments({
            occupation: { $nin: ['Contractor', 'Inactive'] }
        },);

        // Send the response in the requested format
        res.status(200).json({
            data: users,
            count: count,
            metadata: {
                total: count
            }
        });

    } catch (err) {
        console.error(err);  // Add this line to log the error
        res.status(500).json({ message: err.message });
    }
};

exports.getContractorsUsers = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const resultsPerPage = parseInt(req.query.resultsPerPage, 10) || 10;

        const skip = (page - 1) * resultsPerPage;
        // Define the array of occupations
        const occupation = 'Contractor'

        // Find users with specific occupations
        const users = await User.find({
            occupation: occupation
        }, {
            _id: 1,
            username: 1,
            fName: 1,
            lName: 1,
            occupation: 1,
            phoneNo: 1,
            email: 1,
        })
        const count = await User.countDocuments({ occupation: 'Contractor' });


        // Send the response in the requested format
        res.status(200).json({
            data: users,
            count: count,
            metadata: {
                total: count
            }
        });
    } catch (err) {
        console.error(err);  // Add this line to log the error
        res.status(500).json({ message: err.message });
    }
};

exports.getProjectManagerUsers = async (req, res, next) => {
    try {
        // Define the array of occupations
        const occupation = 'Project Manager'

        // Find users with specific occupations
        const users = await User.find({
            occupation: occupation
        }, {
            _id: 1,
            username: 1,
            fName: 1,
            lName: 1,
            occupation: 1,
        });



        // Send the response in the requested format
        res.status(200).json(users);

    } catch (err) {
        console.error(err);  // Add this line to log the error
        res.status(500).json({ message: err.message });
    }
};
exports.getProjectDirectorUsers = async (req, res, next) => {
    try {
        // Define the array of occupations
        const occupation = 'Project Director'

        // Find users with specific occupations
        const users = await User.find({
            occupation: occupation
        }, {
            _id: 1,
            username: 1,
            fName: 1,
            lName: 1,
            occupation: 1,
        });



        // Send the response in the requested format
        res.status(200).json(users);

    } catch (err) {
        console.error(err);  // Add this line to log the error
        res.status(500).json({ message: err.message });
    }
};
exports.getFinanceUsers = async (req, res, next) => {
    try {
        // Define the array of occupations
        const occupation = 'Finance'

        // Find users with specific occupations
        const users = await User.find({
            occupation: occupation
        }, {
            _id: 1,
            username: 1,
            fName: 1,
            lName: 1,
            occupation: 1,
        });



        // Send the response in the requested format
        res.status(200).json(users);

    } catch (err) {
        console.error(err);  // Add this line to log the error
        res.status(500).json({ message: err.message });
    }
};
exports.getUserDetails = async (req, res) => {
    try {
        // Extract _id from the request parameters
        const userId = req.params.id;

        // Find the user by _id and exclude the password field from the result
        const user = await User.findById(userId, '-password').exec();

        // If user is not found, send a 404 response
        if (!user) {
            return res.status(404).send({ message: 'User not found' });
        }

        // Respond with the user details
        res.status(200).send(user);
    } catch (error) {
        // If there's an error, send a 500 server error response
        res.status(500).send({ message: 'Error retrieving user details', error: error.message });
    }
};
exports.getAllUsersnontable = async (req, res, next) => {
    try {
        const users = await User.find({
            occupation: { $nin: ['Contractor', 'Foreman', 'Developer'] }
        }, {
            _id: 1,
            username: 1,
            fName: 1,
            lName: 1,
            occupation: 1,
        });
        res.status(200).json(users);
    } catch (err) {
        console.error(err);  // Add this line to log the error
        res.status(500).json({ message: err.message });
    }
};
exports.getAlloftheUsersNontable = async (req, res, next) => {
    try {
        const users = await User.find({ occupation: { $nin: ['Contractor'] } }, { _id: 1, fName: 1, lName: 1, username: 1, occupation: 1 });
        res.status(200).json(users);

    } catch (err) {
        console.error(err);  // Add this line to log the error
        res.status(500).json({ message: err.message });
    }
};
exports.getManagingPartnerUsers = async (req, res, next) => {
    try {
        const occupation = 'Managing Partner'
        const users = await User.find({
            occupation: occupation
        }, {
            _id: 1,
            username: 1,
            fName: 1,
            lName: 1,
            occupation: 1,
        });



        // Send the response in the requested format
        res.status(200).json(users);

    } catch (err) {
        console.error(err);  // Add this line to log the error
        res.status(500).json({ message: err.message });
    }
};


exports.getQosUsers = async (req, res, next) => {
    try {
        // Define the array of occupations
        const occupation = 'Quantity Surveyor'

        // Find users with specific occupations
        const users = await User.find({
            occupation: occupation
        }, {
            _id: 1,
            username: 1,
            fName: 1,
            lName: 1,
            occupation: 1,
        });
        // Send the response in the requested format
        res.status(200).json(users);

    } catch (err) {
        console.error(err);  // Add this line to log the error
        res.status(500).json({ message: err.message });
    }
};


exports.getForemenUsers = async (req, res, next) => {
    try {
        // Define the array of occupations
        const occupation = 'Foreman'

        // Find users with specific occupations
        const users = await User.find({
            occupation: occupation
        }, {
            _id: 1,
            username: 1,
            fName: 1,
            lName: 1,
            occupation: 1,
        });
        // Send the response in the requested format
        res.status(200).json(users);

    } catch (err) {
        console.error(err);  // Add this line to log the error
        res.status(500).json({ message: err.message });
    }
};

exports.getProcurementUsers = async (req, res, next) => {
    try {
        // Define the array of occupations
        const occupation = 'Procurement'

        // Find users with specific occupations
        const users = await User.find({
            occupation: occupation
        }, {
            _id: 1,
            username: 1,
            fName: 1,
            lName: 1,
            occupation: 1,
        });
        // Send the response in the requested format
        res.status(200).json(users);

    } catch (err) {
        console.error(err);  // Add this line to log the error
        res.status(500).json({ message: err.message });
    }
};

exports.getAllContractorUsers = async (req, res, next) => {
    try {
        // Define the array of occupations
        const occupation = 'Contractor'

        // Find users with specific occupations
        const users = await User.find({
            occupation: occupation
        }, {
            _id: 1,
            username: 1,
            fName: 1,
            lName: 1,
            occupation: 1,
        });



        // Send the response in the requested format
        res.status(200).json(users);

    } catch (err) {
        console.error(err);  // Add this line to log the error
        res.status(500).json({ message: err.message });
    }
};