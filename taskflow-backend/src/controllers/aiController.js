const openai = require("../config/openai");

const generateSubtasks = async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title) {
      return res.status(400).json({ message: "Task title is required" });
    }

    const prompt = `
You are a productivity assistant.
Break the following task into 4 to 6 clear and actionable subtasks.
Return ONLY a valid JSON array of strings. Do not add any extra text.

Task: ${title}
${description ? `Description: ${description}` : ""}
`;

    const completion = await openai.chat.completions.create({
      model: "openai/gpt-oss-20b",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful productivity assistant. Always respond with pure JSON.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
    });

    const content = completion.choices[0].message.content;

    // Parse the JSON response
    let subtasks;
    try {
      subtasks = JSON.parse(content);
    } catch (err) {
      // fallback if AI doesn't return pure JSON
      subtasks = content.split("\n").filter((line) => line.trim().length > 0);
    }

    res.json({
      success: true,
      subtasks,
    });
  } catch (error) {
    console.error("AI Error:", error);
    res.status(500).json({ message: "Failed to generate subtasks" });
  }
};

const summarizeTasks = async (req, res) => {
  try {
    const { tasks } = req.body; // array of task titles/descriptions

    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
      return res.status(400).json({ message: "Tasks are required" });
    }

    const taskList = tasks
      .map(
        (task, i) =>
          `${i + 1}. ${task.title}${task.description ? ` - ${task.description}` : ""}`,
      )
      .join("\n");

    const prompt = `
You are a productivity assistant.
Summarize the following tasks into a short and clear paragraph (maximum 3-4 sentences).
Focus on the overall goal and key points.

Tasks:
${taskList}
`;

    const completion = await openai.chat.completions.create({
      model: "openai/gpt-oss-20b",
      messages: [
        {
          role: "system",
          content: "You are a helpful productivity assistant.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.5,
    });

    const summary = completion.choices[0].message.content;

    res.json({
      success: true,
      summary,
    });
  } catch (error) {
    console.error("Summarize Error:", error);
    res.status(500).json({ message: "Failed to generate summary" });
  }
};

module.exports = {
  generateSubtasks,
  summarizeTasks,
};
