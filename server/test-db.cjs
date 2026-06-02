const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  try {
    await prisma.$connect();
    console.log('CONNECTION_SUCCESSFUL');
    await prisma.$disconnect();
  } catch (e) {
    console.error('CONNECTION_FAILED', e);
  }
}
main();
