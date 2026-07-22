import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import API from '../utils/api';
import { useNavigate } from 'react-router-dom';

const Tasks = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState({ title: '', description: '', status: 'todo', priority: 'medium', dueDate: '' });
  const [loading, setLoading] = useState(false);

  const fetchTasks = async () => {
    try {
      const res = await API.get('/tasks');
      setTasks(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const createTask = async (e) => {
    e.preventDefault();
    if (!newTask.title) return;
    
    setLoading(true);
    try {
      await API.post('/tasks', newTask);
      setNewTask({ title: '', description: '', status: 'todo', priority: 'medium', dueDate: '' });
      fetchTasks();
    } catch (error) {
      alert('Failed to create task');
    }
    setLoading(false);
  };

  const updateTask = async (id, updates) => {
    try {
      await API.put(`/tasks/${id}`, updates);
      fetchTasks();
    } catch (error) {
      alert('Failed to update');
    }
  };

  const deleteTask = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await API.delete(`/tasks/${id}`);
      fetchTasks();
    } catch (error) {
      alert('Failed to delete');
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold">My Tasks</h1>
          <p className="text-gray-600">Welcome back, {user?.name}</p>
        </div>
        <button
          onClick={() => { logout(); navigate('/login'); }}
          className="bg-red-500 text-white px-5 py-2 rounded-lg hover:bg-red-600"
        >
          Logout
        </button>
      </div>

      {/* Create Task Form */}
      <form onSubmit={createTask} className="bg-white p-6 rounded-2xl shadow mb-8">
        <h2 className="text-xl font-semibold mb-4">New Task</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Task Title"
            className="px-4 py-3 border rounded-lg"
            value={newTask.title}
            onChange={(e) => setNewTask({...newTask, title: e.target.value})}
            required
          />
          <input
            type="date"
            className="px-4 py-3 border rounded-lg"
            value={newTask.dueDate}
            onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
          />
        </div>
        <textarea
          placeholder="Description (optional)"
          className="w-full mt-4 px-4 py-3 border rounded-lg"
          value={newTask.description}
          onChange={(e) => setNewTask({...newTask, description: e.target.value})}
        />
        <button
          type="submit"
          disabled={loading}
          className="mt-4 bg-indigo-600 text-white px-8 py-3 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? 'Adding...' : 'Add Task'}
        </button>
      </form>

      {/* Tasks List */}
      <div className="space-y-4">
        {tasks.map(task => (
          <div key={task._id} className="bg-white p-6 rounded-2xl shadow flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-lg">{task.title}</h3>
              {task.description && <p className="text-gray-600 mt-1">{task.description}</p>}
              <div className="flex gap-3 mt-3">
                <select
                  value={task.status}
                  onChange={(e) => updateTask(task._id, { status: e.target.value })}
                  className="text-sm border rounded px-3 py-1"
                >
                  <option value="todo">Todo</option>
                  <option value="in-progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
                <span className={`text-sm px-3 py-1 rounded-full ${task.priority === 'high' ? 'bg-red-100 text-red-700' : task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                  {task.priority}
                </span>
              </div>
            </div>
            <button
              onClick={() => deleteTask(task._id)}
              className="text-red-500 hover:text-red-700"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Tasks;