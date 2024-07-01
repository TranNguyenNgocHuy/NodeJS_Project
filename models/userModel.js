const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    trim: true,
    required: [true, 'The full name field should not be empty!'],
    maxlength: [50, 'A full name must have less or equal then 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    trim: true,
    validate: [validator.isEmail, 'Please provide a valid email!']
  },
  avatarImg: {
    type: String
  },
  role: {
    type: String,
    enum: ['customer', 'admin'],
    default: 'customer'
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    trim: true,
    minlength: [8, 'A password must have more or equal then 8 characters'],
    select: false
  },
  passwordConfirm: {
    type: String,
    trim: true,
    required: [true, 'Please confirm your password!'],
    validate: {
      validator: function(passwordConfirm) {
        // Only works with CREATE and SAVE, not with updates
        return passwordConfirm === this.password;
      },
      message: 'Confirm password should be equal password'
    }
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false
  }
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', function(next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.pre(/^find/, function(next) {
  this.find({ active: { $ne: false } });
  next();
});

userSchema.methods.isValidPassword = async function(
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changePasswordAfterIssued = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const passwordChangedAtToTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < passwordChangedAtToTimestamp;
  }

  return false;
};

userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
