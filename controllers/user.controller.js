const passport = require("passport");
const User = require("../models/user.model");
const nodemailer = require("nodemailer");
const { session } = require("passport");
require('dotenv').config()

const OTPFactory = () => {
    return Math.floor(100000 + Math.random() * 900000);
};

exports.createUser = (req, res, next) => {
    let otp = OTPFactory()
    let user = new User({
        username: req.body.username,
        email: req.body.email,
        phno: req.body.phno,
        signUpOTP: otp
    });
    User.register(user, req.body.password, (err, user) => {
        if (err) {
            if(err.name === "UserExistsError") {
                console.log("Username already taken.");
                return res.status(203).json({error: "Username already taken."});
            }
            console.log("Invalid credentials");
            return res.status(203).json(err);
        }
        console.log(`${req.body.username} created an account`)
    });
    let gmailTransport = nodemailer.createTransport({
        service: "Gmail",
        auth: {
            user: process.env.GMAIL_SERVICE_ID,
            pass: process.env.GMAIL_SERVICE_PASSWORD,
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

                    http://${req.headers.host}/activate/${otp}
                    
                    Thank you!`,
    };
    gmailTransport.sendMail(mailContent, (err) => {
        if (err) {
            console.log("Error in sending mail");
            return next(err);
        }
        console.log(`Email sent to ${req.body.username}`);
        res.status(201)
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
            return res.status(200)
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


exports.getUser = async (req, res) => {
    const user = await User.findById({ _id: req.params.id });
    if (user) {
        return res.status(200).json(user)
    }
    return res.status(404)
};


exports.deleteUser = (req, res) => {
    passport.authenticate("local", (err, user) => {
        if (err) {
            return res.status(203).json({ error: "Invalid credentials" })
        }
        User.findByIdAndDelete({ _id: req.params.id }, (err) => {
            if (err) {
                return res.status(500)
            }
            return res.status(204)
        });
    });
};


exports.resetPassword = (req, res) => {
    // send mail with reset token
};


exports.forgotPassword = (req, res) => {
    // recieve post with token as param and new password in body
};
