const passport = require("passport");
const User = require("../models/user.model");
const nodemailer = require("nodemailer");
const { session } = require("passport");

exports.createUser = (req, res) => {
    let user = new User({
        username: req.body.username,
        email: req.body.email,
        phno: req.body.phno,
    });
    User.register(user, req.body.password, (err, user) => {
        if (err) {
            if(err) {
                console.log("Username already taken.");
                res.status(203).json({error: "Username already taken."});
            } else {
                console.log("Invalid credentials");
                res.status(203).json(err);
            }
        } else {
            console.log(`${req.body.username} created an account`)
            res.status(200);
        }
    });
    let gmailTransport = nodemailer.createTransport({
        service: "Gmail",
        auth: {
            user: "argon.intelligence@gmail.com",
            pass: "1806@two000",
        },
    });
    let mailContent = {
        to: req.body.mail,
        from: "Nodejs Auth API<nodejs.auth.api@gmail.com>",
        subject: "Confirm your account",
        text: `Hey ${req.body.username}, 
                    You have successfully registered your account.
                    Click on the following link to confirm your email id and
                    activate your account.

                    http://${req.headers.host}/activate/${token}
                    
                    Thank you!`,
    };
    gmailTransport.sendMail(mailContent, (err) => {
        if (err) {
            console.log("Error in sending mail");
            return next(err);
        }
        console.log(`Email sent to ${req.body.username}`);
        res.status(200)
    });
};


exports.activateUser = (req, res, next) => {
    User.findOneAndUpdate(
        { signUpOTP: req.params.token },
        { isActive: true },
        (err) => {
            if (err) {
                console.log("Invalid activation link recieved.");
                return next(err)
            }
            console.log("A user activated their account")
            res.status(200)
        }
    );
};


exports.loginUser = (req, res, next) => {
    passport.authenticate("local", (err, user) => {
        if (err) {
            console.log("Invalid credentials");
            return res.status(203).json({"error": "Invalid credentials"})
        }
        if (!user.isActive) {
            console.log("Email not verified");
            return res.status(203).json({"error": "Please verify your email"})
        }
        req.logIn(user, (err) => {
            if (err) {
                console.log("Some error occured");
                return res.status(500).json({"error": "Server error"});
            }
            console.log(`${user.username} logged in.`)
            sessionId = req.session
            sessionId.userId = user.id
            res.status(200).json(user)
        });
    })(req, res, next);
};


exports.logoutUser = (req, res) => {
    req.logout();
    req.session.destroy()
    console.log("User logged out");
    return res.status(200)
};


exports.getUser = (req, res) => {};
exports.passwordResetUser = (req, res) => {};
exports.deleteUser = (req, res) => {};
