import prisma from './config/db.js';
import dotenv from 'dotenv';
dotenv.config({ override: true });

async function runDueCheck() {
  console.log('--- STARTING MANUAL DUE CHECK ---');
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const in3Days = new Date(today);
    in3Days.setDate(today.getDate() + 3);

    const dueStudents = await prisma.student.findMany({
      where: {
        nextDueDate: { lte: in3Days },
        isActive: true
      },
      include: { user: true }
    });

    console.log(`Found ${dueStudents.length} students to check...`);

    for (const student of dueStudents) {
      const dueDate = new Date(student.nextDueDate);
      dueDate.setHours(0, 0, 0, 0);

      const diffTime = dueDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      console.log(`Checking ${student.fullName} - Due: ${dueDate.toDateString()} (diffDays: ${diffDays})`);

      if (diffDays <= 0) {
        if (student.feeStatus !== 'DUE' || diffDays <= -28) {
           const newNextDue = new Date(dueDate);
           newNextDue.setMonth(newNextDue.getMonth() + 1);

           await prisma.student.update({
             where: { id: student.id },
             data: {
               feeStatus: 'DUE',
               remainingBalance: { increment: student.monthlySubscription },
               nextDueDate: newNextDue
             }
           });
           console.log(` -> UPDATED: feeStatus set to DUE, balance incremented by ${student.monthlySubscription}, next due date moved to ${newNextDue.toDateString()}`);
        } else {
           console.log(` -> ALREADY DUE: No balance changes made this cycle.`);
        }
      } else {
        console.log(` -> NOT DUE YET.`);
      }
    }
    console.log('--- FINISHED ---');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

runDueCheck();
