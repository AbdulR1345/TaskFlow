import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {/* Navbar */}
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-indigo-600">TaskFlow</h1>
            
            <div className="flex items-center gap-6">
              <a href="#" className="text-gray-600 hover:text-gray-900">Home</a>
              <a href="#" className="text-gray-600 hover:text-gray-900">Tasks</a>
              <button className="bg-indigo-600 text-white px-5 py-2 rounded-lg hover:bg-indigo-700 transition">
                Login
              </button>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <Routes>
          <Route path="/" element={
            <div className="max-w-7xl mx-auto px-6 py-12">
              <div className="text-center">
                <h2 className="text-5xl font-bold text-gray-900 mb-6">
                  Manage Your Tasks Efficiently
                </h2>
                <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                  A beautiful and powerful task management application built with React and Node.js
                </p>
                <button className="bg-indigo-600 text-white px-8 py-3 rounded-xl text-lg font-medium hover:bg-indigo-700 transition">
                  Get Started
                </button>
              </div>
            </div>
          } />
        </Routes>
      </div>
    </Router>
  )
}

export default App