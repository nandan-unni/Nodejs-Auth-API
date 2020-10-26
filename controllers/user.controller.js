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
                return res.status(203).json({message: "Username already taken."});
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
        console.log(`Account confirmation email sent to ${req.body.username}`);
        return res.status(201)
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
            return res.status(203).json({message: "Invalid credentials"})
        }
        if (!user.isActive) {
            console.log("Email not verified");
            return res.status(203).json({message: "Please verify your email"})
        }
        req.logIn(user, (err) => {
            if (err) {
                console.log("Some error occured");
                return res.status(500).json({message: "Server error"});
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
            return res.status(203).json({ message: "Invalid credentials" })
        }
        User.findByIdAndDelete({ _id: req.params.id }, (err) => {
            if (err) {
                return res.status(500)
            }
            return res.status(204)
        });
    });
};


exports.forgotPassword = (req, res) => {
    async.waterfall(
        [
            (callback) => {
                let otp = OTPFactory();
                return callback(null, otp);
            }, // func 1
            (otp, callback) => {
                User.findOne({ _email: req.body.email }, (err, user) => {
                    if (err) {
                        console.log("Invalid Email");
                        return callback(err);
                    }
                    if(!user) {
                        console.log("User not found");
                        return callback(err);
                    }
                    user.passwordResetOTP = otp;
                    user.passwordResetOTPExpiry = Date.now() + 432000; // 5 days
                    user.save((err) => {
                        if (err) {
                            console.log("Error in OTP generation");
                            return callback(err);
                        }
                        return callback(null, otp, user);
                    });
                });
            }, // func 2
            (otp, user, callback) => {
                let gmailTransport = nodemailer.createTransport({
                    service: "Gmail",
                    auth: {
                        user: process.env.GMAIL_SERVICE_ID,
                        pass: process.env.GMAIL_SERVICE_PASSWORD,
                    },
                });
                let mailContent = {
                    to: user.email,
                    from: "Nodejs Auth API<nodejs.auth.api@gmail.com>",
                    subject: "Request for Password Reset",
                    text: `Hey ${user.username}, 
                                You have requested for a password reset.
                                Click on this link to verify that its you
                                and enter a new password.
            
                                http://${req.headers.host}/forgotpassword/${otp}

                                Ignore this email if that wasn't you.
                                
                                Thank you!`,
                };
                gmailTransport.sendMail(mailContent, (err) => {
                    if (err) {
                        console.log("Error in sending mail");
                        return callback(err);
                    }
                    console.log(`Password reset email sent to ${user.username}`);
                    return callback(null);
                });
            }, // func 3
        ], // waterfall func array end
        (err) => { // Callback func error handler
            if (err) {
                console.log("Some error occured");
                return res.status(203).json({message: "Some error occured."});
            }
            return res.status(200).json({message: "Check your mailbox to reset the password"})
        }
    ) // waterfall end
};


exports.forgotPasswordVerify = (req, res) => {
    User.findOne(
        {
            passwordResetOTP: req.params.otp,
            passwordResetOTPExpiry: { $gt: Date.now() },
        },
        (err, user) => {
            if (err) {
                console.log("Some internal error occured");
                return res.status(500).json({message: "Some internal error occured"});
            }
            if (!user) {
                console.log("Expired reset password link");
                return res.status(203).json({message: "Expired password reset OTP"})
            }
            console.log("OTP verification success");
            return res.status(200).json(user);
        }
    );
}


exports.resetPassword = (req, res) => {
    async.waterfall(
        [
            (callback) => {
                User.findById({ _id: req.params.id }, (err, user) => {
                    if (err) {
                        console.log("Some internal error occured finding user");
                        return callback(err);
                    }
                    if (!user) {
                        console.log("User not found");
                        return callback(err);
                    }
                    console.log("Found user");
                    user.setPassword(req.body.password, (err) => {
                        if (err) {
                            console.log("Some internal error occured setting password");
                            return callback(err);
                        }
                        console.log(`${user.username} changed the password`);
                        user.passwordResetOTP = undefined;
                        user.passwordResetOTPExpiry = undefined;
                        user.save((err) => {
                            if (err) {
                                console.log("Some internal error occured at saving user");
                                callback(err);
                            }
                            callback(null, user)
                        });
                    });
                });
            }, // func 1
            (user, callback) => {
                let gmailTransport = nodemailer.createTransport({
                    service: "Gmail",
                    auth: {
                        user: process.env.GMAIL_SERVICE_ID,
                        pass: process.env.GMAIL_SERVICE_PASSWORD,
                    },
                });
                let mailContent = {
                    to: user.email,
                    from: "Nodejs Auth API<nodejs.auth.api@gmail.com>",
                    subject: "Request for Password Reset",
                    text: `Hey ${user.username}, 
                                You have successfully changed your password.
                                
                                Thank you!`,
                };
                gmailTransport.sendMail(mailContent, (err) => {
                    if (err) {
                        console.log("Error in sending mail");
                        return callback(err);
                    }
                    console.log(`Password changed email sent to ${user.username}`);
                    return callback(null);
                });
            }, // func 2
        ], // func array end
        (err) => {
            if (err) {
                console.log(err);
                return res.status(203).json({message: "Some internal error occured"});
            }
            console.log("Successfully changed password")
            return res.status(200).json({message: "Successfully changed your password."})
        } // waterfall error handler
    ); // waterfall end
};
