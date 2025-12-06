# 🍽️ FoodShare - Community Food Sharing Platform

**Share Food, Reduce Waste, Build Community**

A full-stack MERN (MongoDB, Express.js, React, Node.js) application that connects food donors with people in need, helping reduce food waste while building stronger communities.

![FoodShare Banner](https://via.placeholder.com/800x200/10b981/ffffff?text=FoodShare+-+Share+Food%2C+Reduce+Waste)

## 🌟 Features

### 🍎 **Food Management**
- **Post Food Items** - Share surplus food with detailed descriptions, photos, and pickup information
- **Browse Available Food** - Search and filter food posts by category, location, and availability
- **One-Click Claiming** - Instantly claim available food items without payment barriers
- **Smart Categories** - Organize food by type: Cooked Food, Raw Ingredients, Packaged Food, Baked Items, Beverages
- **Expiry Tracking** - Automatic status updates based on expiry dates and pickup times

### 👥 **User Experience**
- **Secure Authentication** - JWT-based login system with email verification
- **User Profiles** - Manage personal information and view donation/claim history
- **Real-time Notifications** - Instant updates via Socket.IO when food is claimed or completed
- **Responsive Design** - Mobile-friendly interface built with Tailwind CSS

### 💬 **Communication**
- **Real-time Chat** - Direct messaging between food donors and recipients
- **Socket.IO Integration** - Instant message delivery and online status
- **Conversation History** - Persistent chat records for coordination

### 🖼️ **Media Management**
- **Image Uploads** - Cloudinary integration for high-quality food photos
- **Multiple Images** - Support for multiple photos per food post
- **Optimized Storage** - Automatic image compression and optimization

### 🔒 **Security & Performance**
- **Data Protection** - Input sanitization, XSS protection, and rate limiting
- **Secure Headers** - Helmet.js for security headers
- **Password Security** - Bcrypt hashing with salt rounds
- **Environment Variables** - Secure configuration management

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)   
- MongoDB (local or MongoDB Atlas)
- Cloudinary account (for image uploads)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Kirtann8/foodshare-mern.git
   cd foodshare-mern
   ```

2. **Install Backend Dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install Frontend Dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Environment Setup**
   
   Create `.env` files in both backend and frontend directories:

   **Backend `.env`:**
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development

   # Database
   MONGO_URI=mongodb+srv://your_username:password@cluster.mongodb.net/foodshare

   # JWT
   JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_secure
   JWT_EXPIRE=30d

   # CORS
   CLIENT_URL=http://localhost:3000
   FRONTEND_URL=http://localhost:3000

   # Cloudinary (for image uploads)
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret

   # Google OAuth (optional)
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret

   # Email Configuration
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASSWORD=your_app_password
   EMAIL_FROM=noreply@foodshare.com
   EMAIL_FROM_NAME=FoodShare
   ```

   **Frontend `.env`:**
   ```env
   # API Configuration
   REACT_APP_API_URL=http://localhost:5000/api

   # Google OAuth
   REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id

   # App Configuration
   REACT_APP_NAME=FoodShare
   REACT_APP_VERSION=1.0.0

   # Socket.IO server
   REACT_APP_SOCKET_URL=http://localhost:5000
   ```

5. **Start the Application**

   **Backend Server:**
   ```bash
   cd backend
   npm run dev
   # or
   npm start
   ```

   **Frontend Development Server:**
   ```bash
   cd frontend
   npm start
   ```

6. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - API Health Check: http://localhost:5000/api/health

## 📁 Project Structure

```
foodshare-mern/
├── backend/                    # Node.js + Express backend
│   ├── config/                # Database and service configurations
│   │   ├── cloudinary.js     # Cloudinary setup
│   │   ├── db.js             # MongoDB connection
│   │   └── ErrorResponse.js  # Custom error handler
│   ├── controllers/           # Business logic controllers
│   │   ├── authController.js  # Authentication logic
│   │   ├── foodController.js  # Food post management
│   │   ├── messageController.js # Chat functionality
│   │   └── uploadController.js # File upload handling
│   ├── middleware/           # Express middlewares
│   │   ├── auth.js          # JWT authentication
│   │   ├── error.js         # Error handling
│   │   ├── upload.js        # File upload middleware
│   │   └── validation.js    # Input validation
│   ├── models/              # MongoDB schemas
│   │   ├── User.js          # User data model
│   │   ├── Food.js          # Food post model
│   │   ├── Message.js       # Chat message model
│   │   └── Conversation.js  # Chat conversation model
│   ├── routes/              # API route definitions
│   │   ├── auth.js          # Authentication routes
│   │   ├── food.js          # Food management routes
│   │   ├── messages.js      # Chat routes
│   │   └── uploadRoute.js   # File upload routes
│   ├── utils/               # Utility functions
│   │   └── emailService.js  # Email notification service
│   ├── validators/          # Input validation schemas
│   ├── .env                 # Environment variables
│   ├── server.js           # Express server setup
│   └── package.json        # Backend dependencies
│
├── frontend/               # React frontend
│   ├── public/            # Static files
│   ├── src/
│   │   ├── components/    # React components
│   │   │   ├── Auth/      # Authentication components
│   │   │   ├── Food/      # Food-related components
│   │   │   ├── Chat/      # Messaging components
│   │   │   ├── Common/    # Shared components
│   │   │   └── Admin/     # Admin panel components
│   │   ├── context/       # React context providers
│   │   │   └── AuthContext.js # Authentication state
│   │   ├── services/      # API service functions
│   │   │   └── api.js     # Axios configuration
│   │   ├── App.js         # Main app component
│   │   └── index.js       # React DOM rendering
│   ├── .env               # Frontend environment variables
│   └── package.json       # Frontend dependencies
│
├── .gitignore             # Git ignore rules
├── README.md              # Project documentation
└── package.json           # Root package configuration
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/updatedetails` - Update user profile
- `PUT /api/auth/updatepassword` - Change password
- `POST /api/auth/logout` - User logout

### Food Management
- `GET /api/food` - Get all food posts (with filters)
- `POST /api/food` - Create new food post
- `GET /api/food/:id` - Get single food post
- `PUT /api/food/:id` - Update food post (owner only)
- `DELETE /api/food/:id` - Delete food post (owner only)
- `PUT /api/food/:id/claim` - Claim available food
- `PUT /api/food/:id/complete` - Mark food as completed

### Messaging
- `GET /api/messages/conversations` - Get user's conversations
- `GET /api/messages/:conversationId` - Get conversation messages
- `POST /api/messages` - Send new message

### File Upload
- `POST /api/upload/single` - Upload single image
- `POST /api/upload/multiple` - Upload multiple images

## 🎨 Frontend Components

### Key Components
- **FoodCard** - Display food post in grid/list view
- **FoodDetail** - Detailed food post view with claiming
- **FoodForm** - Create/edit food posts
- **ChatWindow** - Real-time messaging interface
- **Navbar** - Navigation with authentication
- **ProtectedRoute** - Route protection wrapper

### Styling
- **Tailwind CSS** - Utility-first CSS framework
- **Responsive Design** - Mobile-first approach
- **Component Library** - Reusable UI components
- **Loading States** - Skeleton loaders for better UX

## 🗄️ Database Schema

### User Schema
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  phone: String,
  location: {
    address: String,
    city: String,
    state: String,
    zipCode: String
  },
  role: String (user/admin),
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Food Schema
```javascript
{
  title: String,
  description: String,
  category: String,
  quantity: String,
  images: [String],
  location: {
    address: String,
    city: String,
    coordinates: { latitude, longitude }
  },
  expiryDate: Date,
  pickupTiming: {
    startTime: Date,
    endTime: Date
  },
  allergens: {
    isVegetarian: Boolean,
    isVegan: Boolean,
    isGlutenFree: Boolean,
    containsNuts: Boolean
  },
  claimStatus: String (available/claimed/completed/expired),
  donor: ObjectId (User),
  claimedBy: ObjectId (User),
  claimedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## 🚀 Deployment

### Environment Setup
- Update environment variables for production
- Use production MongoDB database
- Configure production Cloudinary settings
- Set secure JWT secrets

### Platform Recommendations

#### **Vercel (Recommended for Frontend)**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy frontend
cd frontend
vercel --prod
```

#### **Heroku (Backend)**
```bash
# Install Heroku CLI and login
heroku login

# Create new app
heroku create your-foodshare-backend

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set MONGO_URI=your_production_mongo_uri
heroku config:set JWT_SECRET=your_production_jwt_secret

# Deploy
git subtree push --prefix backend heroku main
```

#### **Railway (Full Stack)**
- Connect GitHub repository
- Set environment variables in dashboard
- Automatic deployments on git push

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the Repository**
2. **Create Feature Branch** (`git checkout -b feature/amazing-feature`)
3. **Commit Changes** (`git commit -m 'Add amazing feature'`)
4. **Push to Branch** (`git push origin feature/amazing-feature`)
5. **Open Pull Request**

### Contribution Guidelines
- Follow existing code style and formatting
- Add comments for complex logic
- Update documentation for new features
- Test thoroughly before submitting
- Write meaningful commit messages

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙋‍♂️ Support

### Getting Help
- 📧 Email: support@foodshare.com
- 🐛 Issues: [GitHub Issues](https://github.com/Kirtann8/foodshare-mern/issues)
- 📖 Documentation: [Wiki](https://github.com/Kirtann8/foodshare-mern/wiki)

### FAQ

**Q: How do I reset my password?**
A: Use the "Forgot Password" link on the login page to receive a reset email.

**Q: Can I edit food posts after posting?**
A: Yes, you can edit your own food posts before they are claimed.

**Q: How do I delete my account?**
A: Contact support for account deletion requests.

**Q: Is there a mobile app?**
A: Currently, FoodShare is a responsive web application that works great on mobile devices.

## 🔮 Roadmap

### Upcoming Features
- [ ] **Mobile App** - React Native version
- [ ] **Advanced Search** - Location-based filtering with maps
- [ ] **Rating System** - User ratings and reviews
- [ ] **Push Notifications** - Mobile notifications for claims
- [ ] **Analytics Dashboard** - Food waste reduction statistics
- [ ] **Multi-language Support** - Internationalization
- [ ] **API Rate Limiting** - Enhanced security measures
- [ ] **Advanced Admin Panel** - Comprehensive management tools

### Long-term Goals
- Integration with local food banks
- Partnership with grocery stores
- Carbon footprint tracking
- Community impact metrics

## 👏 Acknowledgments

- **MongoDB** - Database solution
- **Express.js** - Backend framework
- **React** - Frontend library
- **Node.js** - Runtime environment
- **Tailwind CSS** - Styling framework
- **Cloudinary** - Image management
- **Socket.IO** - Real-time communication

## 📊 Project Stats

- **Language**: JavaScript (ES6+)
- **Frontend**: React 18+
- **Backend**: Node.js + Express
- **Database**: MongoDB
- **Real-time**: Socket.IO
- **Styling**: Tailwind CSS
- **Authentication**: JWT
- **File Storage**: Cloudinary

---

**Made with ❤️ for the community**

*Reducing food waste, one shared meal at a time* 🌱
