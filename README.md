# TaskFlow

A full-stack task management application built with the MERN stack.

**Live Demo:** [https://task-flow-six-inky.vercel.app](https://task-flow-six-inky.vercel.app)  
**Backend API:** [https://taskflow-rs2o.onrender.com](https://taskflow-rs2o.onrender.com)

---

## Features

### Authentication

- Email / Password registration & login
- Google OAuth login
- JWT-based authentication
- Password reset flow
- Email verification (implemented)

### Task Management

- Create, read, update, and delete tasks
- Task status: To Do, In Progress, Done
- Priority levels
- Due dates
- Filtering and sorting
- Infinite scroll / pagination
- Archive and Trash (soft delete + restore + permanent delete)

### User Profile

- View and update profile
- Profile picture upload (Cloudinary)
- Change password
- Dark mode

### Premium Features

- Razorpay payment integration
- Premium subscription
- Premium badge in UI

### AI Features

- Task summarization
- Subtask generation (Groq AI)

### Other

- Responsive design
- Dark / Light theme
- Toast notifications
- Protected routes

---

## Tech Stack

| Layer      | Technologies                                       |
| ---------- | -------------------------------------------------- |
| Frontend   | React (Vite), Tailwind CSS, React Router, Axios    |
| Backend    | Node.js, Express.js, MongoDB, Mongoose             |
| Auth       | JWT, Passport.js (Google OAuth)                    |
| Storage    | Cloudinary (profile images)                        |
| Payments   | Razorpay                                           |
| AI         | Groq API                                           |
| Deployment | Vercel (Frontend), Render (Backend), MongoDB Atlas |

---

## Project Structure

```text
taskflow/
├── taskflow-frontend/     # React + Vite frontend
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── utils/
│   │   └── App.jsx
│   └── ...
│
└── taskflow-backend/      # Express backend
    ├── src/
    │   ├── config/
    │   ├── controllers/
    │   ├── middleware/
    │   ├── models/
    │   ├── routes/
    │   ├── jobs/
    │   └── server.js
    └── ...


Getting Started (Local Development)

Prerequisites

Node.js 18+
MongoDB (local or Atlas)
Cloudinary account
Google Cloud OAuth credentials
Razorpay test keys (optional)
Groq API key (optional)

1. Clone the repository

git clone https://github.com/AbdulR1345/TaskFlow.git
cd TaskFlow

2. Backend Setup

cd taskflow-backend
npm install

Create a .env file:

PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:5173

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret

GROQ_API_KEY=your_groq_api_key

EMAIL_USER=your_email
EMAIL_PASSWORD=your_email_app_password

Start the backend:

npm run dev

3. Frontend Setup

cd ../taskflow-frontend
npm install

Create a .env file:

VITE_API_URL=http://localhost:5000/api

Start the frontend:

npm run dev

Open http://localhost:5173

Environment Variables (Production)

Backend (Render)

MONGO_URI
JWT_SECRET
CLIENT_URL
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GOOGLE_CALLBACK_URL
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET
GROQ_API_KEY
EMAIL_USER
EMAIL_PASSWORD
NODE_ENV=production

Frontend (Vercel)

VITE_API_URL=https://your-backend-url.onrender.com/api


API Overview

Method,Endpoint,Description
POST,/api/auth/register,Register user
POST,/api/auth/login,Login
GET,/api/auth/me,Get current user
GET,/api/auth/google,Google OAuth
PUT,/api/auth/avatar,Upload profile picture
GET,/api/tasks,Get tasks (paginated)
POST,/api/tasks,Create task
PUT,/api/tasks/:id,Update task
DELETE,/api/tasks/:id,Delete task
POST,/api/payment/create-order,Create Razorpay order
POST,/api/ai/summarize,Summarize tasks

Future Improvements:

Re-enable reliable email verification (Resend / Brevo)
Real-time notifications with Socket.io
Task collaboration / sharing
Mobile app (React Native)
Better analytics dashboard

Author

Abdul Rahaman G

GitHub: https://github.com/AbdulR1345
LinkedIn: https://www.linkedin.com/in/abdulrahaman13/


License:

This project is open source and available under the MIT License [blocked].
```
