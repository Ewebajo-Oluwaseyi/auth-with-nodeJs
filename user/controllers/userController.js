require('dotenv').config()
const User = require('../model/User');
const Token = require('../model/Token');
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const async = require('async')
const crypto = require('crypto');
const nodemailer = require('nodemailer')

//nodemailer
let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        type: 'OAuth2',
        user: '',
        clientId: '',
        clientSecret: '',
        refreshToken: '',
        accessToken: ''
    }
})

//register new user
exports.registerUser = async(req, res) => {
    let checkUser = await User.find({
        email: req.body.email
    });
    if(checkUser.length >= 1){
        res.status(400).json({
            error: "Email already exist"
        })
    } else {
        const { name, email, password, username} = req.body;

        let user = new User({
            name,
            email,
            username,
            password
        });


        const salt = await bcrypt.genSalt(10)
        user.password = await bcrypt.hash(password, salt)

        user.save((err, user) => {
            if (err) {
                res.status(400).json({error: err})
            }

            //generate new token using crypto
            let token = new Token({
                _userId: user._id,
                token: crypto.randomBytes(16).toString('hex')
            });
            token.save(err => {
                if (err) {
                    res.status(400).json({error: err})
                }

                let mailOptions = {
                    from: "no-reply@gmail.com",
                    to: user.email,
                    subject: "Verify token",
                    text: "Hello, \n\n" +
                    "verify your account \n" +
                    "click the link: \nhttp://" + req.headers.host +
                    "/user/verifytoken/" +
                    token.token +
                    ".\n"
                };

                transporter.sendMail(mailOptions, err=> {
                    if (err) {
                        return res.status(500).send({msg: err.message})
                    }
                     res.status(200).send("Verfiy token in your email")
                })
            })
        })
    }
}

exports.verifyToken = async(req, res)=> {
    Token.findOne({
        token: req.params.token
    }, (err, token) => {
        if(!token)
            return res.status(400).send({
                type: "not-verified",
                msg: "Expired token"
            });
         User.findOne({
             _id: token._userId
         }, (err, user) => {
             if (!user)
             return res.status(400).send({
                 msg: "no user with this token"
             });

             if(user.isVerified)
             return res.status(400).send({
                 type: "verified",
                 msg: "User has been verified"
             });

             user.isVerified = true;
             user.save(err => {
                 if(err) {
                     return res.status(500).send({
                         msg: err
                     })
                 };

                 res.status(200).send("Account has verified, Please log in")
             })
         })
    })
}


exports.resendVerifyToken = async(req, res) => {
    User.findOne({
        email: req.body.email
    }, (err, user) => {
        if(err) {
            return res.status(500).send({
                msg: err
            })
        }

        if(!user) {
            if(err) {
                return res.status(400).send({
                    msg: "User not found"
                })
            }
        }

        if(user.isVerified) {
            return res.status(400).send({
                msg: "account already verified"
            })
        }

        let token = new Token({
            _userId: user._id,
            token: crypto.randomBytes(16).toString("hex")
        });

        token.save(err => {
            if(err) {
                return res.status(500).send({
                    msg: err.message
                })
            }

            let mailOptions = {
                from: "no-reply@gmail.com",
                to: user.email,
                subject: "Verify token",
                text: "Hello, \n\n" +
                "verify your account \n" +
                "click the link: \nhttp://" + req.headers.host +
                "/user/verifytoken/" +
                token.token +
                ".\n"
            };

            transporter.sendMail(mailOptions, err => {
                if(err) {
                    return res.status(500).send({
                        msg: err.message
                    })
                }

                res.status(200).send("Verfiy token in your email")
            })
        })
    })
}

exports.forgotPassword = (req, res) => {
    async.waterfall([
        //find user
        done => {
            User.findOne({
                email: req.body.email
            }).exec((err, user) => {
                if (user) {
                    done(err, user);
                } else {
                    done("User not found")
                }
            })
        },

        //generate token
        (user, done) => {
            crypto.randomBytes(16, (err, buffer) => {
                let token = buffer.toString("hex");
                done(err, user, token)
            })
        },

        //find user and assign token
        (user, token, done) => {
            User.findByIdAndUpdate(
                {
                    _id: user._id
                },
                {
                    resetPasswordToken: token
                },
                {
                    upsert: true,
                    new: true
                }
            ).exec(function(err, new_user) {
                done(err, token, new_user)
            })
        },

        //create email template

        (token, user, done) => {
           let mailOptions = {
            from: "no-reply@gmail.com",
            to: user.email,
            template: "forgot-password-email",
            subject: "Reset Password",
            text: "Hello, \n\n" +
            "verify your account \n" +
            "click the link: \nhttp://" + req.headers.host +
            "/user/resetpassword/" +
            token
           };

           transporter.sendMail(mailOptions, err => {
               if(!err) {
                   return res.json({message: "check your email for password reset"});
               } else {
                   res.status(200).json({message: err})
               }
           })
        }
    ],
    err => {
        return res.status(422).json({
            message: err
        })
    }
    )
}

exports.resetPassword = (req, res) => {
    User.findOne({
        resetPasswordToken: req.params.token,
    }).exec((err, user) => {
        if(!err && user) {
            if(req.body.newPassword === req.body.verifyToken) {
                user.password = bcrypt.hashSync(req.body.newPassword, 10);
                user.resetPasswordToken = undefined;
                user.save(err => {
                    if(err) {
                        return res.res.status(422).send({message: err})
                    } else {
                        let mailOptions = {
                            from: "no-reply@gmail.com",
                            to: user.email,
                            template: "forgot-password-email",
                            subject: "Password Reset!",
                            text: "Hello, \n\n" +
                            "Conformation that your password has changed.\n"
                        };

                        transporter.sendMail(mailOptions, err => {
                            if(!err) {
                                return res.json({
                                    message: "Password reset"
                                });
                            } else {
                                res.status(200).json({
                                    error: err
                                });
                            }
                        });

                        res.status(200).json({
                            message: "Passoword changed"
                        })
                    }
                })
            } else {
                return res.status(422).json({
                    message: "Password do not match"
                })
            }
        } else {
            return res.status(400).send({
                message: "Password reset is invalid"
            })
        }
    })
}

exports.login = async(req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    User.findOne({
        email: email
    }, (err, user) => {
        if(err) {
            res.status(404).json(err)
        }
        if(!user) {
            return res.status(404).json({
                success: false,
                message: 'Wrong Login details'
            })
        }
        if(!user.isVerified) {
            return res.status(401).send({
                msg: "Your account is not verified"
            })
        }

        bcrypt.compare(password, user.password, (err, isUser) => {
            if(err) {
                res.status(404).json(err);
            }

            if(isUser) {
                const token = jwt.sign({
                    data: {
                        _id: user._id,
                        username: user.username,
                        name: user.name,
                        email: user.email
                    }
                },
                "secret"
                );
                return res.status(200).json({
                    success: true,
                    token: token
                })
            } else {
                return res.status(404).json({
                    success: false,
                    message: "Wrong login details"
                })
            }
        })

    })
}

exports.getUsers = async(req, res) => {
    try {
        let user = await User.find();
        res.status(200).json(user)
    } catch (err) {
        res.status(500).json({error: err})
    }
}