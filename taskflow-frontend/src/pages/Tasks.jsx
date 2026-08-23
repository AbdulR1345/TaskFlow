import { useState, useEffect, useContext, useRef, useCallback } from "react";
import { io } from "socket.io-client";
import { AuthContext } from "../context/AuthContext";
import API from "../utils/api";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import {
  matchesTaskSearch,
  getReminderMeta,
  STATUS_ORDER,
  normalizeStatus,
} from "../utils/taskUtils";

const Tasks = () => {
  const { user, darkMode } = useContext(AuthContext);
  const navigate = useNavigate();

  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    status: "todo",
    priority: "medium",
    dueDate: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [draggedTaskId, setDraggedTaskId] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [sortBy, setSortBy] = useState("newest");
  const limit = 5;
  const [aiLoading, setAiLoading] = useState(false);
  const [subtasks, setSubtasks] = useState([]);
  const [showSubtasksModal, setShowSubtasksModal] = useState(false);
  const [summary, setSummary] = useState("");
  const [showSummaryModal, setShowSummaryModal] = useState(false);

  const observerRef = useRef();
  const socketRef = useRef(null);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 2500);
  };

  const fetchTasks = async (page = 1, append = false) => {
    try {
      if (page > 1) setLoadingMore(true);

      const archivedQuery = showArchived ? "&archived=true" : "";
      const res = await API.get(
        `/tasks?page=${page}&limit=${limit}&sort=${sortBy}${archivedQuery}`,
      );

      if (append) {
        setTasks((prev) => [...prev, ...res.data.tasks]);
      } else {
        setTasks(res.data.tasks);
      }

      setCurrentPage(res.data.currentPage);
      setTotalPages(res.data.totalPages);
      setHasMore(res.data.hasNextPage);
    } catch (error) {
      showMessage("error", "Failed to load tasks");
    } finally {
      setLoadingMore(false);
    }
  };

  const lastTaskRef = useCallback(
    (node) => {
      if (loadingMore) return;
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore && !loadingMore) {
            fetchTasks(currentPage + 1, true);
          }
        },
        {
          rootMargin: "100px",
          threshold: 0.1,
        },
      );

      if (node) observerRef.current.observe(node);
    },
    [loadingMore, hasMore, currentPage, sortBy, searchTerm],
  );

  useEffect(() => {
    setTasks([]);
    setCurrentPage(1);
    setHasMore(true);
    fetchTasks(1, false, searchTerm, showArchived);
  }, [sortBy, searchTerm, showArchived]);

  useEffect(() => {
    if (!user?._id) return undefined;

    const socket = io("http://localhost:5000", {
      transports: ["websocket"],
    });

    socketRef.current = socket;
    socket.emit("join-user-room", user._id);

    socket.on("task-updated", () => {
      fetchTasks(1, false, searchTerm);
    });

    return () => {
      socket.emit("leave-user-room", user._id);
      socket.disconnect();
    };
  }, [user?._id, searchTerm]);

  const totalTasks = tasks.length;
  const completed = tasks.filter(
    (t) => normalizeStatus(t.status) === "done",
  ).length;
  const pending = totalTasks - completed;
  const dueSoon = tasks.filter((task) => {
    const reminder = getReminderMeta(task);
    return reminder && ["overdue", "due-soon"].includes(reminder.type);
  }).length;

  const filteredTasks = tasks
    .filter((task) => {
      if (filter !== "all" && normalizeStatus(task.status) !== filter)
        return false;
      return matchesTaskSearch(task, searchTerm);
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const statusColumns = STATUS_ORDER.map((status) => ({
    status,
    tasks: filteredTasks.filter(
      (task) => normalizeStatus(task.status) === status,
    ),
  }));

  const createTask = async (e) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;

    setLoading(true);
    try {
      await API.post("/tasks", newTask);
      setNewTask({
        title: "",
        description: "",
        status: "todo",
        priority: "medium",
        dueDate: "",
      });
      fetchTasks(1, false, searchTerm);
      showMessage("success", "Task added successfully!");
    } catch (error) {
      showMessage("error", "Failed to create task");
    }
    setLoading(false);
  };

  const updateTask = async (id, updates) => {
    try {
      await API.put(`/tasks/${id}`, updates);
      fetchTasks(1, false, searchTerm);
      showMessage("success", "Task updated");
    } catch (error) {
      showMessage("error", "Failed to update task");
    }
  };

  const handleGenerateSubtasks = async (task) => {
    setAiLoading(true);
    try {
      const res = await API.post("/ai/generate-subtasks", {
        title: task.title,
        description: task.description,
      });

      setSubtasks(res.data.subtasks);
      setShowSubtasksModal(true);
    } catch (error) {
      showMessage("error", "Failed to generate subtasks");
    } finally {
      setAiLoading(false);
    }
  };

  const handleSummarize = async () => {
    if (tasks.length === 0) {
      showMessage("error", "No tasks to summarize");
      return;
    }

    setAiLoading(true);
    try {
      const res = await API.post("/ai/summarize", {
        tasks: tasks.map((t) => ({
          title: t.title,
          description: t.description,
        })),
      });

      setSummary(res.data.summary);
      setShowSummaryModal(true);
    } catch (error) {
      showMessage("error", "Failed to generate summary");
    } finally {
      setAiLoading(false);
    }
  };

  const archiveTask = async (id) => {
    try {
      await API.put(`/tasks/${id}/archive`);
      setTasks((prev) => prev.filter((task) => task._id !== id));
      showMessage("success", "Task archived");
    } catch (error) {
      showMessage("error", "Failed to archive task");
    }
  };

  const restoreTask = async (id) => {
    try {
      await API.put(`/tasks/${id}/restore`);
      setTasks((prev) => prev.filter((task) => task._id !== id));
      showMessage("success", "Task restored");
    } catch (error) {
      showMessage("error", "Failed to restore task");
    }
  };

  const permanentDeleteTask = async (id) => {
    if (!window.confirm("Permanently delete this task? This cannot be undone."))
      return;

    try {
      await API.delete(`/tasks/${id}/permanent`);
      setTasks((prev) => prev.filter((task) => task._id !== id));
      showMessage("success", "Task permanently deleted");
    } catch (error) {
      showMessage("error", "Failed to delete task");
    }
  };

  const handleDropOnStatus = async (status) => {
    if (!draggedTaskId) return;
    await updateTask(draggedTaskId, { status });
    setDraggedTaskId(null);
  };
  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      console.log("This browser does not support notifications.");
      return;
    }
    if (Notification.permission === "granted") {
      console.log("Notification permission already granted.");
    } else if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        console.log("Notification permission granted.");
      } else {
        console.log("Notification permission denied.");
      }
    }
  };
  const checkDueTomorrowTasks = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const dayAfter = new Date(tomorrow);
    dayAfter.setDate(dayAfter.getDate() + 1);

    const dueTomorrow = tasks.filter((task) => {
      if (!task.dueDate || task.status === "done") return false;
      const due = new Date(task.dueDate);
      return due >= tomorrow && due < dayAfter;
    });

    if (dueTomorrow.length > 0 && Notification.permission === "granted") {
      new Notification("TaskFlow Reminder", {
        body: `You have ${dueTomorrow.length} task(s) due tomorrow`,
        icon: "/favicon.ico",
      });
    }
  };
  useEffect(() => {
    // Ask for permission when component mounts
    requestNotificationPermission();

    // Check for due tasks after tasks are loaded
    if (tasks.length > 0) {
      checkDueTomorrowTasks();
    }
  }, [tasks]);

  return (
    <>
      <Navbar />
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold dark:text-black">
            Good evening, {user?.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Here's what's on your plate today
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: "Total Tasks", value: totalTasks, color: "indigo" },
            { label: "Completed", value: completed, color: "emerald" },
            { label: "Pending", value: pending, color: "amber" },
            { label: "Due Soon", value: dueSoon, color: "red" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm card"
            >
              <p
                className={`text-4xl font-bold text-${stat.color}-600 dark:text-${stat.color}-400`}
              >
                {stat.value}
              </p>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <input
            type="text"
            placeholder="Search tasks by title, description, priority, status, or due date..."
            className="flex-1 px-5 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl focus:outline-none focus:border-indigo-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-5 py-3 border border-gray-200 dark:border-gray-700 rounded-2xl focus:outline-none focus:border-indigo-500 dark:bg-gray-800 dark:text-white"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="dueDate">Due Date</option>
            <option value="priority">Priority</option>
            <option value="title">Alphabetical</option>
          </select>

          <div className="flex gap-3">
            {["all", "todo", "in-progress", "done"].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-6 py-3 rounded-2xl capitalize transition whitespace-nowrap ${filter === status ? "bg-indigo-600 text-white" : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"}`}
              >
                {status === "all" ? "All" : status.replace("-", " ")}
              </button>
            ))}
          </div>
          <button
            onClick={() => {
              setShowArchived(!showArchived);
              setCurrentPage(1);
            }}
            className={`px-5 py-3 rounded-2xl transition whitespace-nowrap ${
              showArchived
                ? "bg-amber-500 text-white"
                : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          >
            {showArchived ? "Show Active Tasks" : "Show Archived"}
          </button>
          <button
            onClick={handleSummarize}
            disabled={aiLoading}
            className="px-5 py-3 rounded-2xl bg-purple-600 text-white hover:bg-purple-700 transition disabled:opacity-60"
          >
            {aiLoading ? "Summarizing..." : "Summarize Tasks"}
          </button>
        </div>

        <form
          onSubmit={createTask}
          className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-sm mb-10 border border-gray-100 dark:border-gray-700"
        >
          <h2 className="text-2xl font-semibold mb-6 dark:text-white">
            Create New Task
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="What needs to be done?"
              className="px-5 py-4 border border-gray-200 dark:border-gray-700 rounded-2xl focus:outline-none focus:border-indigo-500 dark:bg-gray-900"
              value={newTask.title}
              onChange={(e) =>
                setNewTask({ ...newTask, title: e.target.value })
              }
              required
            />
            <input
              type="date"
              className="px-5 py-4 border border-gray-200 dark:border-gray-700 rounded-2xl focus:outline-none focus:border-indigo-500 dark:bg-gray-900"
              value={newTask.dueDate}
              onChange={(e) =>
                setNewTask({ ...newTask, dueDate: e.target.value })
              }
            />
            <select
              className="px-5 py-4 border border-gray-200 dark:border-gray-700 rounded-2xl focus:outline-none focus:border-indigo-500 dark:bg-gray-900"
              value={newTask.priority}
              onChange={(e) =>
                setNewTask({ ...newTask, priority: e.target.value })
              }
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
            </select>
          </div>
          <textarea
            placeholder="Description (optional)"
            className="w-full mt-4 px-5 py-4 border border-gray-200 dark:border-gray-700 rounded-2xl focus:outline-none focus:border-indigo-500 dark:bg-gray-900"
            value={newTask.description}
            onChange={(e) =>
              setNewTask({ ...newTask, description: e.target.value })
            }
          />
          <button
            type="submit"
            disabled={loading}
            className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-4 rounded-2xl transition font-medium disabled:opacity-70"
          >
            {loading ? "Adding Task..." : "Add Task"}
          </button>
        </form>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {statusColumns.map(({ status, tasks: columnTasks }) => (
            <div
              key={status}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => handleDropOnStatus(status)}
              className="bg-white dark:bg-gray-800 rounded-3xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 min-h-[280px]"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold capitalize dark:text-white">
                  {status.replace("-", " ")}
                </h3>
                <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full text-sm dark:text-gray-200">
                  {columnTasks.length}
                </span>
              </div>

              <div className="space-y-3">
                {columnTasks.length === 0 ? (
                  <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-6 text-center text-sm text-gray-400">
                    Drop task here
                  </div>
                ) : (
                  columnTasks.map((task) => {
                    const reminder = getReminderMeta(task);
                    return (
                      <div
                        key={task._id}
                        draggable
                        onDragStart={() => setDraggedTaskId(task._id)}
                        onDragEnd={() => setDraggedTaskId(null)}
                        className="p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 cursor-grab active:cursor-grabbing"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <h4 className="font-medium dark:text-white">
                              {task.title}
                            </h4>
                            {task.description && (
                              <p className="text-sm text-gray-500 dark:text-gray-300 mt-1">
                                {task.description}
                              </p>
                            )}
                          </div>
                          {showArchived ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() => restoreTask(task._id)}
                                className="text-green-600 hover:text-green-700 px-3 py-1.5 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg text-sm"
                              >
                                Restore
                              </button>
                              <button
                                onClick={() => permanentDeleteTask(task._id)}
                                className="text-red-500 hover:text-red-700 px-3 py-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg text-sm"
                              >
                                Delete Forever
                              </button>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <button
                                onClick={() => archiveTask(task._id)}
                                className="text-gray-500 hover:text-red-600 px-4 py-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition"
                              >
                                Archive
                              </button>
                              <button
                                onClick={() => handleGenerateSubtasks(task)}
                                disabled={aiLoading}
                                className="text-indigo-600 hover:text-indigo-800 px-3 py-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg text-sm"
                              >
                                {aiLoading ? "Generating..." : "AI Subtasks"}
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2 mt-3">
                          <span
                            className={`px-2.5 py-1 text-xs rounded-full ${task.priority === "high" ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" : task.priority === "medium" ? "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"}`}
                          >
                            {task.priority}
                          </span>

                          {task.dueDate && (
                            <span
                              className={`px-2.5 py-1 text-xs rounded-full ${reminder?.tone === "red" ? "bg-red-100 text-red-700" : reminder?.tone === "amber" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"}`}
                            >
                              {new Date(task.dueDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>

                        {reminder && (
                          <div
                            className={`mt-3 text-xs font-medium px-2.5 py-1 rounded-full inline-block ${reminder.tone === "red" ? "bg-red-100 text-red-700" : reminder.tone === "amber" ? "bg-amber-100 text-amber-700" : reminder.tone === "green" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}`}
                          >
                            {reminder.label}
                          </div>
                        )}

                        <select
                          value={task.status}
                          onChange={(e) =>
                            updateTask(task._id, { status: e.target.value })
                          }
                          className="mt-3 w-full text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 dark:bg-gray-900 dark:text-white"
                        >
                          <option value="todo">Todo</option>
                          <option value="in-progress">In Progress</option>
                          <option value="done">Done</option>
                        </select>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ))}
        </div>

        {message.text && (
          <div
            className={`fixed bottom-5 right-5 px-4 py-3 rounded-xl shadow-lg text-sm ${message.type === "success" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}`}
          >
            {message.text}
          </div>
        )}

        {loadingMore && (
          <div className="text-center py-6 text-gray-500 dark:text-gray-400">
            Loading more tasks...
          </div>
        )}

        {!hasMore && filteredTasks.length > 0 && (
          <div className="text-center py-6 text-gray-500 dark:text-gray-400">
            No more tasks to load.
          </div>
        )}
      </div>
      {/* AI Subtasks Modal */}
      {showSubtasksModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-bold dark:text-white">
                AI Generated Subtasks
              </h3>
              <button
                onClick={() => setShowSubtasksModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <ul className="space-y-3 mb-6">
              {subtasks.map((subtask, index) => (
                <li
                  key={index}
                  className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl"
                >
                  <span className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </span>
                  <span className="dark:text-gray-200">{subtask}</span>
                </li>
              ))}
            </ul>

            <div className="flex gap-3">
              <button
                onClick={() => setShowSubtasksModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Close
              </button>
              <button
                onClick={() => {
                  // Optional: You can later add logic to create these as real tasks
                  setShowSubtasksModal(false);
                  showMessage("success", "Subtasks generated successfully");
                }}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Summary Modal */}
      {showSummaryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-lg w-full p-6">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-bold dark:text-white">
                AI Task Summary
              </h3>
              <button
                onClick={() => setShowSummaryModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
              {summary}
            </p>

            <button
              onClick={() => setShowSummaryModal(false)}
              className="w-full py-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Tasks;
