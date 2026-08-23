const User = require('../models/User');
const jwt = require('jsonwebtoken');
const cloudinary = require('../config/cloudinary');
const { Readable } = require('stream');
const crypto = require('crypto');
const sendEmail = require('../config/email');

// Async wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

const uploadBufferToCloudinary = (buffer, folder = 'taskflow/avatars') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }]
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    Readable.from(buffer).pipe(uploadStream);
  });
};

const getMe = async (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
};

const updateAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please choose an image file' });
    }

    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return res.status(500).json({ message: 'Cloudinary is not configured yet. Add your credentials to the environment variables.' });
    }

    if (req.user.avatarPublicId) {
      await cloudinary.uploader.destroy(req.user.avatarPublicId);
    }

    const result = await uploadBufferToCloudinary(req.file.buffer);

    req.user.avatarUrl = result.secure_url;
    req.user.avatarPublicId = result.public_id;
    await req.user.save();

    res.json({
      success: true,
      message: 'Profile picture uploaded successfully',
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        avatarUrl: req.user.avatarUrl,
        avatarPublicId: req.user.avatarPublicId
      }
    });
  } catch (error) {
    console.error('Avatar Upload Error:', error);
    res.status(500).json({ message: 'Failed to upload image' });
  }
};

const removeAvatar = async (req, res) => {
  try {
    if (req.user.avatarPublicId) {
      await cloudinary.uploader.destroy(req.user.avatarPublicId).catch(() => {});
    }

    req.user.avatarUrl = '';
    req.user.avatarPublicId = null;
    await req.user.save();

    res.json({
      success: true,
      message: 'Profile picture removed successfully',
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        avatarUrl: req.user.avatarUrl,
        avatarPublicId: req.user.avatarPublicId
      }
    });
  } catch (error) {
    console.error('Remove Avatar Error:', error);
    res.status(500).json({ message: 'Failed to remove profile picture' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || name.trim().length < 2) {
      return res.status(400).json({ message: 'Name must be at least 2 characters' });
    }

    req.user.name = name.trim();
    await req.user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        avatarUrl: req.user.avatarUrl,
        avatarPublicId: req.user.avatarPublicId
      }
    });
  } catch (error) {
    console.error('Profile Update Error:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Change Password Error:', error);
    res.status(500).json({ message: 'Failed to change password' });
  }
};

const deleteAccount = async (req, res) => {
  try {
    if (req.user.avatarPublicId) {
      await cloudinary.uploader.destroy(req.user.avatarPublicId).catch(() => {});
    }

    await User.findByIdAndDelete(req.user._id);

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Delete Account Error:', error);
    res.status(500).json({ message: 'Failed to delete account' });
  }
};

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(verificationToken)
      .digest('hex');

    // Create user with verification token
    const user = await User.create({
      name,
      email,
      password,
      verificationToken: hashedToken,
      verificationTokenExpires: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
    });

    // Create verification URL
    const verifyURL = `http://localhost:5173/verify-email/${verificationToken}`;

    // Email Template
    const message = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4f46e5;">Welcome to TaskFlow!</h2>
        <p>Hello ${user.name},</p>
        <p>Thank you for registering. Please verify your email address by clicking the button below.</p>
        
        <a href="${verifyURL}" 
           style="display: inline-block; background-color: #4f46e5; color: white; 
                  padding: 12px 24px; text-decoration: none; border-radius: 8px; 
                  margin: 20px 0;">
          Verify Email
        </a>
        
        <p>This link will expire in 24 hours.</p>
        <p>If you did not create an account, please ignore this email.</p>
        <p>Thanks,<br>TaskFlow Team</p>
      </div>
    `;

    // Send verification email
    await sendEmail({
      email: user.email,
      subject: 'Verify Your Email - TaskFlow',
      html: message
    });

    // Don't auto-login. Tell user to verify email first
    res.status(201).json({
      success: true,
      message: 'Registration successful! Please check your email to verify your account.'
    });

  } catch (error) {
    console.error('Register Error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (!user.isVerified) {
      return res.status(401).json({ message: 'Please verify your email before logging in' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl || '',
        avatarPublicId: user.avatarPublicId || null
      }
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

const googleCallback = async (req, res) => {
  try {
    const token = jwt.sign(
      { id: req.user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Redirect to frontend with token
    res.redirect(`http://localhost:5173/tasks?token=${token}`);
  } catch (error) {
    res.redirect('http://localhost:5173/login?error=google_failed');
  }
};

// Forgot Password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Important security practice: Don't reveal if email exists or not
      return res.status(200).json({ 
        message: 'If an account with that email exists, a reset link has been sent' 
      });
    }

    // Generate secure token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Save hashed token + expiry (15 minutes)
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;
    await user.save();

    // Create reset URL
    const resetURL = `http://localhost:5173/reset-password/${resetToken}`;

    // Email Template
    const message = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4f46e5;">Password Reset Request</h2>
        <p>Hello ${user.name},</p>
        <p>You requested a password reset for your TaskFlow account.</p>
        <p>Click the button below to reset your password. This link is valid for <strong>15 minutes</strong>.</p>
        
        <a href="${resetURL}" 
           style="display: inline-block; background-color: #4f46e5; color: white; 
                  padding: 12px 24px; text-decoration: none; border-radius: 8px; 
                  margin: 20px 0;">
          Reset Password
        </a>
        
        <p>If you did not request this, please ignore this email.</p>
        <p>Thanks,<br>TaskFlow Team</p>
      </div>
    `;

    // Send Email
    await sendEmail({
      email: user.email,
      subject: 'Password Reset - TaskFlow',
      html: message
    });

    res.status(200).json({
      success: true,
      message: 'Password reset link has been sent to your email'
    });

  } catch (error) {
    console.error('Forgot Password Error:', error);
    res.status(500).json({ message: 'Error sending email. Please try again later.' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Hash the token from URL so we can compare with DB
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user with valid token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Update password
    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.json({
      success: true,
      message: 'Password has been reset successfully'
    });

  } catch (error) {
    console.error('Reset Password Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    console.log("Received token:", token);

    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    console.log("Hashed token:", hashedToken);

    const user = await User.findOne({
      verificationToken: hashedToken,
      verificationTokenExpires: { $gt: Date.now() }
    });

    console.log("User found:", user ? user.email : "No user found");

    if (!user) {
      return res.status(400).json({ 
        message: 'Invalid or expired verification link' 
      });
    }

    user.isVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpires = null;
    await user.save();

    res.json({
      success: true,
      message: 'Email verified successfully! You can now login.'
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'Email is already verified' });
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(verificationToken)
      .digest('hex');

    user.verificationToken = hashedToken;
    user.verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    await user.save();

    // Create verification URL
    const verifyURL = `http://localhost:5173/verify-email/${verificationToken}`;

    const message = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4f46e5;">Verify Your Email - TaskFlow</h2>
        <p>Hello ${user.name},</p>
        <p>You requested a new verification email. Please click the button below to verify your account.</p>
        
        <a href="${verifyURL}" 
           style="display: inline-block; background-color: #4f46e5; color: white; 
                  padding: 12px 24px; text-decoration: none; border-radius: 8px; 
                  margin: 20px 0;">
          Verify Email
        </a>
        
        <p>This link will expire in 24 hours.</p>
        <p>Thanks,<br>TaskFlow Team</p>
      </div>
    `;

    await sendEmail({
      email: user.email,
      subject: 'Verify Your Email - TaskFlow',
      html: message
    });

    res.json({
      success: true,
      message: 'Verification email has been resent successfully'
    });

  } catch (error) {
    console.error('Resend Verification Error:', error);
    res.status(500).json({ message: 'Error sending email' });
  }
};

module.exports = {
  register,
  login,
  googleCallback,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
  getMe,
  updateAvatar,
  removeAvatar,
  updateProfile,
  changePassword,
  deleteAccount,
  asyncHandler
};
