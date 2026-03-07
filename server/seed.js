import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './src/models/user.model.js';
import Complaint from './src/models/complaint.model.js';
import { attachComplaintEmbedding } from './src/services/semantic.service.js';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

const seedDatabase = async () => {
  try {
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 10,
      serverApi: {
        version: "1",
        strict: true,
        deprecationErrors: true,
      }
    });
    console.log('Connected to MongoDB.');

    // Clear existing data
    await User.deleteMany({});
    await Complaint.deleteMany({});
    console.log('Cleared existing users and complaints.');

    const passwordHash = await bcrypt.hash('123456', 10);

    const adminUser = await User.create({
      name: 'System Admin',
      email: 'admin@gmail.com',
      passwordHash,
      role: 'admin',
      address: 'Town Hall',
      phone: '9999999999'
    });

    const standardUser = await User.create({
      name: 'Standard User',
      email: 'user@gmail.com',
      passwordHash,
      role: 'citizen',
      address: '12 MG Road',
      phone: '8888888888'
    });
    console.log('Created admin@gmail.com and user@gmail.com with password 123456.');

    const sampleComplaints = [
      {
        title: 'Massive Pothole on Main Street',
        description: 'There is a huge crater-like pothole outside the bakery on Main Street. It has already damaged two cars today and is extremely dangerous for two-wheelers especially at night.',
        category: 'Roads & Streets',
        location: 'Opposite to Central Bakery, Main Street',
        priorityScore: 0.85,
        priorityLevel: 'High',
        createdBy: standardUser._id,
        status: 'submitted',
        tags: [{ label: 'Priority', value: 'High' }]
      },
      {
        title: 'Streetlight completely out in residential area',
        description: 'The entire block of streetlights on 4th Avenue have been out for three consecutive days. It is pitch dark at night causing security concerns for residents.',
        category: 'Electrical & Lighting',
        location: '4th Avenue, Near Park Block',
        priorityScore: 0.65,
        priorityLevel: 'Medium',
        createdBy: standardUser._id,
        status: 'in_progress',
        tags: [{ label: 'Priority', value: 'Medium' }]
      },
      {
        title: 'Overflowing garbage bin near school',
        description: 'The public garbage bin next to the primary school has not been cleared for a week. The smell is unbearable and stray animals are scattering it everywhere.',
        category: 'Waste Management',
        location: 'Next to St. Marys School gate',
        priorityScore: 0.95,
        priorityLevel: 'Critical',
        createdBy: standardUser._id,
        status: 'submitted',
        tags: [{ label: 'Priority', value: 'Critical' }]
      },
      {
        title: 'Faded crosswalk paint',
        description: 'The white lines for the crosswalk at the intersection of Maple and 5th are fading away. It still works but could use a fresh coat of paint soon.',
        category: 'Roads & Streets',
        location: 'Intersection of Maple and 5th',
        priorityScore: 0.20,
        priorityLevel: 'Low',
        createdBy: standardUser._id,
        status: 'resolved',
        tags: [{ label: 'Priority', value: 'Low' }]
      }
    ];

    let insertedCount = 0;
    for (let complaintData of sampleComplaints) {
      let complaint = new Complaint(complaintData);
      complaint = await attachComplaintEmbedding(complaint);
      await complaint.save();
      insertedCount++;
    }
    
    console.log(`Inserted ${insertedCount} vectorized sample complaints successfully.`);

    await mongoose.disconnect();
    console.log('Seed completed. Exiting.');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
};

seedDatabase();
