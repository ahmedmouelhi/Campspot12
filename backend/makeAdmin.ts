import mongoose from 'mongoose';
import User from './src/models/User';
import dotenv from 'dotenv';

dotenv.config();

const makeUserAdmin = async (email: string) => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/campspot');
        console.log('✅ Connected to MongoDB');

        // Find user by email and update role to admin
        const user = await User.findOneAndUpdate(
            { email: email },
            { $set: { role: 'admin' } },
            { new: true }
        );

        if (user) {
            console.log(`✅ User ${email} is now an admin!`);
            console.log(`User ID: ${user._id}`);
            console.log(`Name: ${user.name}`);
            console.log(`Role: ${user.role}`);
        } else {
            console.log(`❌ User with email ${email} not found`);
        }

        await mongoose.disconnect();
        console.log('✅ Disconnected from MongoDB');
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

// Get email from command line argument
const email = process.argv[2];

if (!email) {
    console.log('Usage: ts-node makeAdmin.ts <user-email>');
    console.log('Example: ts-node makeAdmin.ts admin@example.com');
    process.exit(1);
}

makeUserAdmin(email);
