const Task = require('../models/Task');
const User = require('../models/User');
const sendEmail = require('../config/email');

const sendDueReminders = async () => {
  try {
    // Get start and end of tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

    // Find all tasks that are due tomorrow and not completed
    const tasks = await Task.find({
      dueDate: {
        $gte: tomorrow,
        $lt: dayAfterTomorrow
      },
      status: { $ne: 'done' }
    }).populate('user', 'name email');

    console.log(`Found ${tasks.length} tasks due tomorrow`);

    for (const task of tasks) {
      if (!task.user || !task.user.email) continue;

      const message = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4f46e5;">Task Reminder - Due Tomorrow</h2>
          <p>Hello ${task.user.name},</p>
          <p>This is a friendly reminder that the following task is due <strong>tomorrow</strong>:</p>
          
          <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0 0 8px 0;">${task.title}</h3>
            ${task.description ? `<p style="margin: 0; color: #4b5563;">${task.description}</p>` : ''}
            <p style="margin: 8px 0 0 0; font-size: 14px;">
              Priority: <strong>${task.priority}</strong> | 
              Status: <strong>${task.status}</strong>
            </p>
          </div>

          <p>Don't forget to complete it on time!</p>
          <p>Thanks,<br>TaskFlow Team</p>
        </div>
      `;

      await sendEmail({
        email: task.user.email,
        subject: `Reminder: "${task.title}" is due tomorrow`,
        html: message
      });

      console.log(`Reminder sent to ${task.user.email} for task: ${task.title}`);
    }

    return { success: true, count: tasks.length };
  } catch (error) {
    console.error('Error sending due reminders:', error);
    return { success: false, error: error.message };
  }
};

module.exports = sendDueReminders;