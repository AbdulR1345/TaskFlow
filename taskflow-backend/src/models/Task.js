import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import API from '../utils/api';
import { useNavigate } from 'react-router-dom';

const Tasks = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('all');
  const [newTask, setNewTask] = useState({ title: '', description: '', status: 'todo', priority: 'medium', dueDate: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const fetchTasks = async () => {
    try {
      const res = await API.get('/tasks');
      setTasks(res.data);
    } catch (error) {
      showMessage('error', 'Failed to load tasks');
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true;
    return task.status === filter;
  });

  const createTask = async (e) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;

    setLoading(true);
    try {
      await API.post('/tasks', newTask);
      setNewTask({ title: '', description: '', status: 'todo', priority: 'medium', dueDate: '' });
      fetchTasks();
      showMessage('success', 'Task added successfully!');
    } catch (error) {
      showMessage('error', 'Failed to create task');
    }
    setLoading(false);
  };

  const updateTask = async (id, updates) => {
    try {
      await API.put(`/tasks/${id}`, updates);
      fetchTasks();
      showMessage('success', 'Task updated');
    } catch (error) {
      showMessage('error', 'Failed to update task');
    }
  };

  const deleteTask = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await API.delete(`/tasks/${id}`);
      fetchTasks();
      showMessage('success', 'Task deleted');
    } catch (error) {
      showMessage('error', 'Failed to delete task');
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">My Tasks</h1>
          <p className="text-gray-600 mt-1">Welcome back, {user?.name}</p>
        </div>
        <button
          onClick={() => { logout(); navigate('/login'); }}
          className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
        >
          Logout
        </button>
      </div>

      {/* Message Toast */}
      {message.text && (
        <div className={`mb-4 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message.text}
        </div>
      )}

      {/* Create Task Form */}
      <form onSubmit={createTask} className="bg-white p-6 rounded-2xl shadow mb-10">
        <h2 className="text-xl font-semibold mb-4">Create New Task</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="What needs to be done?"
            className="px-5 py-3 border rounded-xl focus:outline-none focus:border-indigo-500"
            value={newTask.title}
            onChange={(e) => setNewTask({...newTask, title: e.target.value})}
            required
          />
          <input
            type="date"
            className="px-5 py-3 border rounded-xl focus:outline-none focus:border-indigo-500"
            value={newTask.dueDate}
            onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
          />
          <select
            className="px-5 py-3 border rounded-xl focus:outline-none focus:border-indigo-500"
            value={newTask.priority}
            onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
          >
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
          </select>
        </div>
        <textarea
          placeholder="Description (optional)"
          className="w-full mt-4 px-5 py-3 border rounded-xl focus:outline-none focus:border-indigo-500"
          value={newTask.description}
          onChange={(e) => setNewTask({...newTask, description: e.target.value})}
        />
        <button
          type="submit"
          disabled={loading}
          className="mt-4 bg-indigo-600 text-white px-10 py-3 rounded-xl hover:bg-indigo-700 disabled:opacity-70 transition font-medium"
        >
          {loading ? 'Adding Task...' : 'Add Task'}
        </button>
      </form>

      {/* Filter Buttons */}
      <div className="flex gap-3 mb-6">
        {['all', 'todo', 'in-progress', 'done'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-5 py-2 rounded-full capitalize transition ${filter === status ? 'bg-indigo-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
          >
            {status === 'all' ? 'All Tasks' : status.replace('-', ' ')}
          </button>
        ))}
      </div>

      {/* Tasks List */}
      <div className="space-y-4">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow">
            <p className="text-gray-500 text-xl">No tasks found</p>
          </div>
        ) : (
          filteredTasks.map(task => (
            <div key={task._id} className="bg-white p-6 rounded-2xl shadow flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{task.title}</h3>
                {task.description && <p className="text-gray-600 mt-1">{task.description}</p>}
                
                <div className="flex flex-wrap gap-3 mt-4">
                  <select
                    value={task.status}
                    onChange={(e) => updateTask(task._id, { status: e.target.value })}
                    className="text-sm border rounded-lg px-4 py-1.5"
                  >
                    <option value="todo">Todo</option>
                    <option value="in-progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>

                  <span className={`px-4 py-1.5 text-sm rounded-full ${task.priority === 'high' ? 'bg-red-100 text-red-700' : task.priority === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {task.priority}
                  </span>

                  {task.dueDate && (
                    <span className="text-sm text-gray-500">
                      Due: {new Date(task.dueDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={() => deleteTask(task._id)}
                className="text-red-500 hover:text-red-700 px-4 py-2 hover:bg-red-50 rounded-lg transition self-start md:self-center"
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Tasks;