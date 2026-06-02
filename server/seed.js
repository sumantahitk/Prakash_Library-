import prisma from './config/db.js';
import bcrypt from 'bcryptjs';

const seedDatabase = async () => {
  try {
    console.log('Seeding Database...');
    
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('123456', salt);

    // Create the Admin User
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@gmail.com' },
      update: {},
      create: {
        name: 'Super Admin',
        email: 'admin@gmail.com',
        password: hashedPassword,
        role: 'ADMIN',
      }
    });

    console.log('Admin user seeded successfully:');
    console.log('Email: admin@gmail.com');
    console.log('Password: 123456');

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await prisma.$disconnect();
  }
};

seedDatabase();
