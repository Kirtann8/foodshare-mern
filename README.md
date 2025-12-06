# FoodShare MERN App

A full-stack food sharing application built with the MERN stack (MongoDB, Express.js, React, Node.js) featuring AI-powered food quality assessment.

## Features

- 🔐 JWT Authentication & Authorization
- 🍎 AI-Powered Food Quality Scanner
- 💬 Real-time Chat System
- 📱 Responsive Design with Tailwind CSS
- 🔔 Real-time Notifications
- 👥 Volunteer Management System
- 📊 Admin Dashboard
- 🌍 Location-based Food Sharing

## Tech Stack

### Backend
- Node.js & Express.js
- MongoDB with Mongoose
- JWT Authentication
- Socket.io for real-time features
- Cloudinary for image storage
- Python CV service for AI analysis

### Frontend
- React 18
- Tailwind CSS
- Socket.io Client
- Axios for API calls
- React Router for navigation

## Quick Start

### Prerequisites
- Node.js (v16+)
- MongoDB
- Python 3.8+

### Installation

1. Clone the repository
```bash
git clone https://github.com/Kirtann8/foodshare-mern-app.git
cd foodshare-mern-app
```

2. Install dependencies
```bash
npm run install-all
```

3. Set up environment variables
```bash
# Backend (.env in backend folder)
cp backend/.env.example backend/.env

# Frontend (.env in frontend folder)  
cp frontend/.env.example frontend/.env
```

4. Start the application
```bash
npm run dev
```

## Scripts

- `npm run dev` - Start both frontend and backend
- `npm run server` - Start backend only
- `npm run client` - Start frontend only
- `npm run build` - Build frontend for production

## Project Structure

```
foodshare-mern-app/
├── backend/           # Node.js backend
├── frontend/          # React frontend
├── docs/             # Documentation
├── scripts/          # Utility scripts
├── tests/            # Test files
└── README.md
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - see LICENSE file for details