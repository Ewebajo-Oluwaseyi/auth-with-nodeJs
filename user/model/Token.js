const mongoose = require('mongoose')
const tokenSchema = mongoose.Schema({
    _userId: {
    type: mongoose.Schema.Types.ObjectId,
    require: true,
    ref: "User"
    },
    token: {
        type: String,
        require: true
    },
    createdAt: {
        type: Date,
        require: true,
        default: Date.now,
        //expires: 43200
    }
})

module.exports = mongoose.model('Token', tokenSchema);