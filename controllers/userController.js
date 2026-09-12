const crypto = require("crypto");
const User = require("../models/users");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sendMail } = require("../services/mailService");

async function register(req, res) {
    try {
        const { name, email,role,experience, password } = req.body;

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({
                error: "User already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email,
            role,
            experience,
            password: hashedPassword
        });

        res.status(201).json({
            message: "User registered successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (err) {
        res.status(500).json({
            error: err.message
        });
    }
}


async function login(req, res) {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({
                error: "Invalid email or password"
            });
        }

        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                error: "Invalid email or password"
            });
        }

        const token = jwt.sign(
            {
                userId: user._id,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d"
            }
        );

        res.status(200).json({
            message: "Login successful",
            token
        });

    } catch (err) {
        res.status(500).json({
            error: err.message
        });
    }
}

function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

async function forgotPassword(req, res) {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                error: "User not found"
            });
        }

        // Generate 6 digit OTP
        const otp = generateOtp();

        // OTP expires after 10 minutes
        const otpExpiry = new Date(
            Date.now() + 10 * 60 * 1000
        );

        user.resetPasswordOtp = otp;
        user.resetPasswordOtpExpiry = otpExpiry;
        user.resetPasswordOtpVerified = false;

        await user.save();

        await sendMail({
            to: user.email,
            subject: "Password Reset OTP",

            text: `Hello ${user.name},

We received a request to reset your password.

Your password reset OTP is:

${otp}

This OTP will expire in 10 minutes.

If you did not request this password reset, you can safely ignore this email.

Regards,
Project Management Team`,

            html: `
                <h2>Password Reset OTP</h2>

                <p>Hello ${user.name},</p>

                <p>
                    We received a request to reset your password.
                </p>

                <h1>${otp}</h1>

                <p>
                    This OTP will expire in 10 minutes.
                </p>

                <p>
                    If you did not request this password reset,
                    you can safely ignore this email.
                </p>

                <p>
                    Regards,<br>
                    Project Management Team
                </p>
            `
        });

        res.status(200).json({
            message: "OTP sent successfully"
        });

    } catch (err) {
        console.error("Forgot password error:", err);

        res.status(500).json({
            error: "Failed to send OTP"
        });
    }
}

async function verifyOtp(req, res) {
    try {
        const {
            email,
            otp
        } = req.body;

        if (!email || !otp) {
            return res.status(400).json({
                error: "Email and OTP are required"
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                error: "User not found"
            });
        }

        if (!user.resetPasswordOtp) {
            return res.status(400).json({
                error: "No OTP requested"
            });
        }

        if (user.resetPasswordOtpExpiry < new Date()) {
            return res.status(400).json({
                error: "OTP has expired"
            });
        }

        if (user.resetPasswordOtp !== otp) {
            return res.status(400).json({
                error: "Invalid OTP"
            });
        }

        user.resetPasswordOtpVerified = true;

        await user.save();

        res.status(200).json({
            message: "OTP verified successfully"
        });

    } catch (err) {
        console.error("OTP verification error:", err);

        res.status(500).json({
            error: "Failed to verify OTP"
        });
    }
}

async function resetPassword(req, res) {
    try {
        const {
            email,
            newPassword
        } = req.body;

        if (!email || !newPassword) {
            return res.status(400).json({
                error: "Email and new password are required"
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                error: "User not found"
            });
        }

        if (!user.resetPasswordOtpVerified) {
            return res.status(403).json({
                error: "Please verify OTP first"
            });
        }

        const hashedPassword = await bcrypt.hash(
            newPassword,
            10
        );

        user.password = hashedPassword;

        // Clear OTP information
        user.resetPasswordOtp = null;
        user.resetPasswordOtpExpiry = null;
        user.resetPasswordOtpVerified = false;

        await user.save();

        res.status(200).json({
            message: "Password reset successfully"
        });

    } catch (err) {
        console.error("Reset password error:", err);

        res.status(500).json({
            error: "Failed to reset password"
        });
    }
}



module.exports = {
    register,
    login,
    forgotPassword,
    verifyOtp,
    resetPassword
};