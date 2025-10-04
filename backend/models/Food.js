const mongoose = require('mongoose');

const FoodSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a food title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  category: {
    type: String,
    required: [true, 'Please add a category'],
    enum: ['Cooked Food', 'Raw Ingredients', 'Packaged Food', 'Baked Items', 'Beverages', 'Other'],
    default: 'Other'
  },
  quantity: {
    type: String,
    required: [true, 'Please add quantity information'],
    trim: true
  },
  images: [{
    type: String
  }],
  location: {
    address: {
      type: String,
      required: [true, 'Please add an address'],
      trim: true
    },
    city: {
      type: String,
      required: [true, 'Please add a city'],
      trim: true
    },
    state: {
      type: String,
      trim: true
    },
    zipCode: {
      type: String,
      trim: true
    },
    coordinates: {
      latitude: { type: Number },
      longitude: { type: Number }
    }
  },
  pickupTiming: {
    startTime: {
      type: Date,
      required: [true, 'Please add pickup start time']
    },
    endTime: {
      type: Date,
      required: [true, 'Please add pickup end time']
    }
  },
  expiryDate: {
    type: Date,
    required: [true, 'Please add expiry date']
  },
  dietaryInfo: {
    isVegetarian: { type: Boolean, default: false },
    isVegan: { type: Boolean, default: false },
    isGlutenFree: { type: Boolean, default: false },
    containsNuts: { type: Boolean, default: false }
  },
  claimStatus: {
    type: String,
    enum: ['available', 'claimed', 'completed', 'expired'],
    default: 'available'
  },
  donor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  claimedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  claimedAt: {
    type: Date,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  views: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Create indexes for optimized queries
FoodSchema.index({ donor: 1 });
FoodSchema.index({ claimedBy: 1 });
FoodSchema.index({ claimStatus: 1 });
FoodSchema.index({ category: 1 });
FoodSchema.index({ 'location.city': 1 });
FoodSchema.index({ isActive: 1 });
FoodSchema.index({ createdAt: -1 });
FoodSchema.index({ expiryDate: 1 });

// Compound indexes for common queries
FoodSchema.index({ claimStatus: 1, isActive: 1, createdAt: -1 });
FoodSchema.index({ donor: 1, claimStatus: 1 });
FoodSchema.index({ 'location.city': 1, claimStatus: 1 });

// Update claim status to expired if expiry date has passed
FoodSchema.pre('save', function(next) {
  if (this.expiryDate < new Date() && this.claimStatus === 'available') {
    this.claimStatus = 'expired';
  }
  next();
});

module.exports = mongoose.model('Food', FoodSchema);
