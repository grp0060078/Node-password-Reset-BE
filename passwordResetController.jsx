// passwordResetController.js

const crypto = require('crypto');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');

// Connect to MongoDB (replace 'your-mongodb-uri' with your actual MongoDB URI)
mongoose.connect('mongodb+srv://grp0060078:Raja123@cluster0.ib4jxpt.mongodb.net/password-reset', { useNewUrlParser: true, useUnifiedTopology: true });

// Create a mongoose schema and model for users
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
});

const User = mongoose.model('User', userSchema);

// Mock Database (replace this with actual database usage)
const resetTokens = {};

// Configure nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'your-email@gmail.com', // replace with your email
    pass: 'your-password', // replace with your email password or an app password
  },
});

const sendResetEmail = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const token = crypto.randomBytes(20).toString('hex');
    resetTokens[token] = { email, userId: user._id };

    const resetLink = `http://localhost:5173//reset-password/${token}`;

    const mailOptions = {
      from: 'your-email@gmail.com',
      to: email,
      subject: 'Password Reset Request',
      text: `Click on the following link to reset your password: ${resetLink}`,
    };

    // Send email
    await transporter.sendMail(mailOptions);
    res.json({ message: 'Reset email sent successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const resetPassword = async (req, res) => {
  const { password, token } = req.body;
  const resetData = resetTokens[token];

  if (!resetData) {
    return res.status(404).json({ error: 'Invalid or expired token' });
  }

  try {
    // Update password in the database
    await User.findByIdAndUpdate(resetData.userId, { password });

    // Clear the token
    delete resetTokens[token];

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = { sendResetEmail, resetPassword };
