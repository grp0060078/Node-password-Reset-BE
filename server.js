const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const cors = require('cors');


const app = express();
app.use(cors());

const PORT = 3001;

mongoose.set('strictQuery', false);

// MongoDB setup (replace with your MongoDB connection string)
mongoose.connect('mongodb+srv://grp0060078:Raja123@cluster0.ib4jxpt.mongodb.net/Reset_password');

// Define MongoDB models
const User = mongoose.model('User', {
  email: String,
  password: String,
});

const ResetToken = mongoose.model('ResetToken', {
  email: String,
  token: String,
  createdAt: { type: Date, default: Date.now },
});

// Set up middleware
app.use(bodyParser.json());

// NodeMailer setup (replace with your email service details)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'your-email@gmail.com',
    pass: 'your-email-password',
  },
})


//define home endpoint
app.get('/',(req,res) => {
  res.send('<h1>WELCOME</h1>')
})

// Endpoint to initiate password reset
app.post('/api/reset-password', async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate a random token (replace with a more secure method)
    const token = crypto.randomBytes(20).toString('hex');
    await ResetToken.create({ email, token });

    // Send reset link to the user's email
    const resetLink = `http://localhost:3001/reset-password/${token}`;
    const mailOptions = {
      from: 'your-email@gmail.com',
      to: email,
      subject: 'Password Reset',
      text: `Click on the following link to reset your password: ${resetLink}`,
    };

    transporter.sendMail(mailOptions, (error) => {
        res.status(200).json({ message: 'Reset email sent successfully' });
      
      
    });
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
});


  
  // Endpoint to verify and reset the password
app.post('/api/reset-password/:token', async (req, res) => {
    const { token } = req.params;
    const { email, newPassword } = req.body;
  
    try {
      const resetToken = await ResetToken.findOne({ email, token });
  
      if (!resetToken || isTokenExpired(resetToken.createdAt)) {
        return res.status(400).json({ message: 'Invalid or expired token' });
      }
  
      // Update the user's password in the database
      const user = await User.findOne({ email });
  
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      // Assuming you have a method in your User model to securely hash the password
      user.password = newPassword;
      await user.save();
  
      // Clear the reset token
      await ResetToken.deleteOne({ email, token });
  
      res.json({ message: 'Password reset successfully' });
    } catch (error) {
      console.error('Error:', error.message);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Helper function to check if a token has expired
  function isTokenExpired(createdAt) {
    // Set your desired token expiration time (e.g., 1 hour)
    const expirationTime = 60 * 60 * 1000; // 1 hour in milliseconds
    const now = new Date();
    return now - new Date(createdAt) > expirationTime;
  }
  
  

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
