const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validation');

const userSchema = mongoose.Schema({
    name: {
        type: String,
        Required: true
    },
    email: {
        type: String,
        Required: true,
        unique: true
    },
    username: {
        type: String,
        Required: true
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    password: {
        type: String,
        Required: true
    },
    resetPasswordToken : {
        type: String
    },
    resetPasswordExpires: {
        type: Date
    },
    isAdmin: {
        type: Boolean,
        default: false
    }
})

userSchema.plugin(uniqueValidator);
module.exports = mongoose.model('User', userSchema);