import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['citizen', 'admin'], default: 'citizen' },
    address: { type: String, trim: true },
    phone: { type: String, trim: true }
  },
  { timestamps: true }
);

userSchema.index({ email: 1 });

const User = mongoose.model('User', userSchema);

export default User;
