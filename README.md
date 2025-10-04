# FoodShare - MERN Stack Food Sharing Application

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-16+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-5+-brightgreen.svg)](https://www.mongodb.com/)

A production-ready MERN (MongoDB, Express.js, React, Node.js) stack application with Role-Based Access Control (RBAC) for sharing surplus food and reducing waste while helping the community.

## 🌟 Features

### Authentication & Authorization
- ✅ User registration with role assignment (user/admin)
- ✅ Secure login with JWT token storage
- ✅ Protected routes and automatic redirects
- ✅ Profile management and password changes
- ✅ Role-Based Access Control (RBAC)

### Food Sharing Features
- ✅ Post food with images, location, and pickup timing
- ✅ Browse available food with advanced filters
- ✅ Search food by location (city, state)
- ✅ Claim food posts from other users
- ✅ Manage your own food listings
- ✅ Track donations and claims
- ✅ Dietary information (Vegetarian, Vegan, Gluten-Free, etc.)
- ✅ Real-time status updates (available, claimed, completed, expired)

### Technical Features
- ✅ RESTful API with consistent error handling
- ✅ JWT authentication with role-based middleware
- ✅ Input validation and sanitization
- ✅ Secure image upload with size/type limits (5MB, JPEG/PNG/GIF/WebP)
- ✅ MongoDB indexing for optimized queries
- ✅ Password hashing with bcrypt
- ✅ CORS configuration
- ✅ Responsive, modern UI with CSS
- ✅ Loading states and error handling
- ✅ Context API for global state management

## 🏗️ Architecture

```
foodshare-mern-app/
├── backend/
│   ├── config/
│   │   ├── db.js                 # MongoDB connection
│   │   └── ErrorResponse.js       # Custom error handler
│   ├── controllers/
│   │   ├── authController.js      # Authentication logic
│   │   └── foodController.js      # Food CRUD operations
│   ├── middleware/
│   │   ├── auth.js                # JWT & RBAC middleware
│   │   ├── error.js               # Error handling middleware
│   │   └── upload.js              # File upload middleware
│   ├── models/
│   │   ├── User.js                # User schema with roles
│   │   └── Food.js                # Food schema with indexes
│   ├── routes/
│   │   ├── auth.js                # Auth routes
│   │   └── food.js                # Food routes
│   ├── uploads/                   # Uploaded images directory
│   ├── server.js                  # Express server setup
│   └── package.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth/              # Authentication components
│   │   │   ├── Food/              # Food-related components
│   │   │   └── Common/            # Reusable components
│   │   ├── context/
│   │   │   └── AuthContext.js     # Global auth state
│   │   ├── services/
│   │   │   └── api.js             # API integration
│   │   ├── App.js                 # Main app with routing
│   │   └── index.js               # Entry point
│   └── package.json
└── package.json                   # Root package.json

```

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (v5 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/foodshare-mern-app.git
   cd foodshare-mern-app
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```
   This will install dependencies for both backend and frontend.

3. **Environment Setup**

   **Backend (.env)**
   Create a `.env` file in the `backend` directory:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGO_URI=mongodb+srv://your-username:your-password@cluster.mongodb.net/foodshare?retryWrites=true&w=majority
   JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_complex
   JWT_EXPIRE=30d
   CLIENT_URL=http://localhost:3000
   ```

   **Frontend (.env)**
   Create a `.env` file in the `frontend` directory:
   ```env
   REACT_APP_API_URL=http://localhost:5000/api
   REACT_APP_NAME=FoodShare
   REACT_APP_VERSION=1.0.0
   ```

4. **Start the application**
   
   **Development mode (both servers):**
   ```bash
   npm run dev
   ```

   **Or start separately:**
   
   Backend:
   ```bash
   npm run server
   ```
   
   Frontend:
   ```bash
   npm run client
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000/api
   - Health Check: http://localhost:5000/api/health

## 📚 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "user",
  "phone": "1234567890",
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001"
  }
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Get Profile
```http
GET /api/auth/me
Authorization: Bearer <token>
```

#### Update Profile
```http
PUT /api/auth/updatedetails
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Updated",
  "email": "john.updated@example.com",
  "phone": "9876543210"
}
```

#### Change Password
```http
PUT /api/auth/updatepassword
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword123"
}
```

### Food Endpoints

#### Get All Food
```http
GET /api/food?category=Cooked Food&claimStatus=available&city=NewYork&page=1&limit=10
```

#### Get Single Food
```http
GET /api/food/:id
```

#### Create Food Post
```http
POST /api/food
Authorization: Bearer <token>
Content-Type: multipart/form-data

{
  "title": "Fresh Homemade Pasta",
  "description": "Delicious pasta made today",
  "category": "Cooked Food",
  "quantity": "5 servings",
  "location": {
    "address": "123 Main St",
    "city": "New York",
    "state": "NY"
  },
  "pickupTiming": {
    "startTime": "2025-10-05T10:00:00",
    "endTime": "2025-10-05T18:00:00"
  },
  "expiryDate": "2025-10-06",
  "images": [file1, file2]
}
```

#### Update Food Post
```http
PUT /api/food/:id
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

#### Delete Food Post
```http
DELETE /api/food/:id
Authorization: Bearer <token>
```

#### Claim Food
```http
PUT /api/food/:id/claim
Authorization: Bearer <token>
```

#### Complete Food
```http
PUT /api/food/:id/complete
Authorization: Bearer <token>
```

#### Get My Donations
```http
GET /api/food/my/donations
Authorization: Bearer <token>
```

#### Get My Claims
```http
GET /api/food/my/claims
Authorization: Bearer <token>
```

#### Search by Location
```http
GET /api/food/search/location?city=NewYork&state=NY
```

## 🗄️ Database Schema

### User Model
```javascript
{
  name: String (required, max: 50),
  email: String (required, unique, lowercase),
  password: String (required, min: 6, hashed),
  role: String (enum: ['user', 'admin'], default: 'user'),
  phone: String (10 digits),
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String (default: 'India')
  },
  profilePicture: String,
  isActive: Boolean (default: true),
  timestamps: true
}

Indexes: email, role, isActive
```

### Food Model
```javascript
{
  title: String (required, max: 100),
  description: String (required, max: 500),
  category: String (enum: categories, required),
  quantity: String (required),
  images: [String],
  location: {
    address: String (required),
    city: String (required),
    state: String,
    zipCode: String,
    coordinates: { latitude: Number, longitude: Number }
  },
  pickupTiming: {
    startTime: Date (required),
    endTime: Date (required)
  },
  expiryDate: Date (required),
  dietaryInfo: {
    isVegetarian: Boolean,
    isVegan: Boolean,
    isGlutenFree: Boolean,
    containsNuts: Boolean
  },
  claimStatus: String (enum: ['available', 'claimed', 'completed', 'expired']),
  donor: ObjectId (ref: 'User', required),
  claimedBy: ObjectId (ref: 'User'),
  claimedAt: Date,
  isActive: Boolean (default: true),
  views: Number (default: 0),
  timestamps: true
}

Indexes: donor, claimedBy, claimStatus, category, location.city, 
         isActive, createdAt, expiryDate
Compound Indexes: claimStatus + isActive + createdAt, 
                  donor + claimStatus,
                  location.city + claimStatus
```

## 🔐 Security Features

- **Password Hashing**: Bcrypt with salt rounds of 10
- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access Control**: Admin and user roles
- **Input Validation**: Server-side validation for all inputs
- **File Upload Security**: 
  - File type restrictions (JPEG, PNG, GIF, WebP)
  - File size limit (5MB per file)
  - Max 5 images per post
- **CORS Configuration**: Controlled cross-origin requests
- **Error Handling**: Consistent error responses

## 🎨 Frontend Components

### Authentication Components
- **Login**: User login form
- **Register**: User registration with role selection
- **Profile**: Profile management
- **ChangePassword**: Password update form

### Food Components
- **FoodList**: Browse and filter food posts
- **FoodCard**: Individual food item card
- **FoodForm**: Create/edit food posts
- **FoodDetail**: Detailed food post view
- **MyDonations**: User's donated food
- **MyClaims**: User's claimed food

### Common Components
- **Navbar**: Navigation with authentication state
- **ProtectedRoute**: Route protection wrapper
- **Loading**: Loading spinner
- **ErrorMessage**: Error display component
- **Home**: Landing page

## 🧪 Testing

### Backend API Testing
You can test the API using Postman or curl:

```bash
# Health check
curl http://localhost:5000/api/health

# Register user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"test123"}'
```

## 📦 Production Deployment

### Build Frontend
```bash
npm run build
```

### Environment Variables for Production
Update the environment variables for production:
- Set `NODE_ENV=production`
- Use production MongoDB URI
- Generate a strong JWT secret
- Update CLIENT_URL to production domain
- Configure HTTPS

### Deployment Platforms
- **Backend**: Heroku, AWS, DigitalOcean, Railway
- **Frontend**: Vercel, Netlify, AWS Amplify
- **Database**: MongoDB Atlas

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Authors

- **Your Name** - Initial work

## 🙏 Acknowledgments

- Food waste reduction initiatives
- Open source community
- MERN stack documentation

## 📧 Support

For support, email support@foodshare.com or create an issue in the repository.

## 🗺️ Roadmap

- [ ] Email notifications for claims
- [ ] Real-time chat between donor and claimer
- [ ] Mobile app (React Native)
- [ ] Geolocation-based search
- [ ] Food analytics dashboard (Admin)
- [ ] Rating and review system
- [ ] Social media sharing
- [ ] Multi-language support

---

Made with ❤️ for reducing food waste and helping communities
