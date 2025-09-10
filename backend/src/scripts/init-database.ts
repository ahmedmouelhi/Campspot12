#!/usr/bin/env ts-node

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Logger from '../utils/logger';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/camping-app';

interface DatabaseInitOptions {
  dropExisting?: boolean;
  seedData?: boolean;
}

class DatabaseInitializer {
  private async connectToDatabase(): Promise<void> {
    try {
      await mongoose.connect(MONGODB_URI);
      Logger.info('✅ Connected to MongoDB for initialization');
    } catch (error) {
      Logger.error('❌ Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  private async createIndexes(): Promise<void> {
    try {
      const db = mongoose.connection.db;
      
      if (!db) {
        throw new Error('Database connection not available');
      }
      
      // Create indexes for better performance
      const collections = [
        {
          name: 'users',
          indexes: [
            { email: 1 } as any,
            { createdAt: -1 } as any
          ]
        },
        {
          name: 'campingsites', 
          indexes: [
            { location: '2dsphere' },
            { name: 'text', description: 'text' },
            { pricePerNight: 1 },
            { availability: 1 }
          ]
        },
        {
          name: 'bookings',
          indexes: [
            { userId: 1 },
            { campingSiteId: 1 },
            { checkInDate: 1, checkOutDate: 1 },
            { status: 1 }
          ]
        },
        {
          name: 'activities',
          indexes: [
            { name: 'text', description: 'text' },
            { campingSiteId: 1 }
          ]
        },
        {
          name: 'equipment',
          indexes: [
            { name: 'text', description: 'text' },
            { category: 1 },
            { pricePerDay: 1 }
          ]
        }
      ];

      for (const collection of collections) {
        try {
          const coll = db.collection(collection.name);
          for (const index of collection.indexes) {
            await coll.createIndex(index);
            Logger.info(`✅ Created index for ${collection.name}:`, index);
          }
        } catch (error) {
          Logger.warn(`⚠️  Could not create indexes for ${collection.name}:`, error);
        }
      }
    } catch (error) {
      Logger.error('❌ Failed to create indexes:', error);
    }
  }

  private async seedBasicData(): Promise<void> {
    try {
      const db = mongoose.connection.db;

      if (!db) {
        throw new Error('Database connection not available');
      }

      // Check if data already exists
      const userCount = await db.collection('users').countDocuments();
      if (userCount > 0) {
        Logger.info('📊 Database already contains data. Skipping seeding.');
        return;
      }

      Logger.info('🌱 Seeding basic data...');

      // Seed sample camping sites
      const sampleCampingSites = [
        {
          name: 'Mountain View Campground',
          description: 'Beautiful mountain views with hiking trails',
          location: {
            type: 'Point',
            coordinates: [-122.4194, 37.7749] // San Francisco coordinates as example
          },
          address: '123 Mountain Road, Nature Valley, CA 94000',
          pricePerNight: 45.00,
          maxGuests: 6,
          amenities: ['Fire Pit', 'Picnic Table', 'Restrooms', 'Hiking Trails'],
          images: ['/images/mountain-camp.jpg'],
          availability: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: 'Lakeside Retreat',
          description: 'Peaceful lakeside camping with fishing opportunities',
          location: {
            type: 'Point',
            coordinates: [-121.4944, 38.5816] // Sacramento coordinates as example
          },
          address: '456 Lake Shore Drive, Blue Lake, CA 95000',
          pricePerNight: 55.00,
          maxGuests: 8,
          amenities: ['Lake Access', 'Boat Rental', 'Fire Pit', 'Fishing Dock'],
          images: ['/images/lake-camp.jpg'],
          availability: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      await db.collection('campingsites').insertMany(sampleCampingSites);
      Logger.info('✅ Seeded camping sites');

      // Seed sample activities
      const sampleActivities = [
        {
          name: 'Guided Nature Walk',
          description: 'Explore local flora and fauna with an experienced guide',
          duration: 120,
          price: 25.00,
          maxParticipants: 15,
          difficulty: 'Easy',
          category: 'Nature',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: 'Kayak Rental',
          description: 'Rent a kayak for lake exploration',
          duration: 240,
          price: 35.00,
          maxParticipants: 2,
          difficulty: 'Moderate',
          category: 'Water Sports',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      await db.collection('activities').insertMany(sampleActivities);
      Logger.info('✅ Seeded activities');

      // Seed sample equipment
      const sampleEquipment = [
        {
          name: 'Camping Tent (4-person)',
          description: 'Waterproof 4-person camping tent',
          category: 'Shelter',
          pricePerDay: 15.00,
          quantity: 10,
          specifications: {
            capacity: 4,
            weight: '3.2kg',
            material: 'Waterproof Polyester'
          },
          images: ['/images/tent-4person.jpg'],
          available: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: 'Sleeping Bag',
          description: 'Warm sleeping bag suitable for temperatures down to 5°C',
          category: 'Bedding',
          pricePerDay: 8.00,
          quantity: 20,
          specifications: {
            temperature: '5°C',
            material: 'Synthetic Fill',
            weight: '1.8kg'
          },
          images: ['/images/sleeping-bag.jpg'],
          available: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      await db.collection('equipment').insertMany(sampleEquipment);
      Logger.info('✅ Seeded equipment');

      Logger.info('🎉 Database seeding completed successfully!');

    } catch (error) {
      Logger.error('❌ Failed to seed data:', error);
    }
  }

  async initialize(options: DatabaseInitOptions = {}): Promise<void> {
    const { dropExisting = false, seedData = true } = options;

    try {
      await this.connectToDatabase();

      if (dropExisting) {
        Logger.warn('🗑️  Dropping existing database...');
        const db = mongoose.connection.db;
        if (db) {
          await db.dropDatabase();
          Logger.info('✅ Database dropped');
        }
      }

      await this.createIndexes();

      if (seedData) {
        await this.seedBasicData();
      }

      Logger.info('🎉 Database initialization completed successfully!');
    } catch (error) {
      Logger.error('❌ Database initialization failed:', error);
      throw error;
    } finally {
      await mongoose.connection.close();
    }
  }
}

// CLI execution
async function main() {
  const args = process.argv.slice(2);
  const dropExisting = args.includes('--drop');
  const seedData = !args.includes('--no-seed');

  Logger.info('🚀 Starting database initialization...');
  Logger.info(`Options: dropExisting=${dropExisting}, seedData=${seedData}`);

  const initializer = new DatabaseInitializer();
  await initializer.initialize({ dropExisting, seedData });
}

// Execute if run directly
if (require.main === module) {
  main().catch(error => {
    Logger.error('❌ Initialization failed:', error);
    process.exit(1);
  });
}

export { DatabaseInitializer };
