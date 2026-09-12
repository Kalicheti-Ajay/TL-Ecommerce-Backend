const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },

        email: {
            type: String,
            required: true,
            unique: true
        },

        role: {
            type: String,
            required: true
        },

        experience: {
            type: String,
            required: true
        },

        password: {
            type: String,
            required: true
        },
        resetPasswordOtp: {
            type: String,
            default: null
        },

        resetPasswordOtpExpiry: {
            type: Date,
            default: null
        },

        resetPasswordOtpVerified: {
            type: Boolean,
            default: false
        }



    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("User", userSchema);
