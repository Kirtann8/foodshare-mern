import mongoose from 'mongoose';

const VolunteerAssignmentSchema = new mongoose.Schema({
  volunteer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  foodPost: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Food',
    required: true
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['assigned', 'accepted', 'collected', 'distributed', 'completed', 'cancelled', 'rejected'],
    default: 'assigned'
  },
  acceptedAt: Date,
  collectedAt: Date,
  distributedAt: Date,
  completedAt: Date,
  cancelledAt: Date,
  cancellationReason: String,
  rejectedAt: Date,
  rejectionReason: String,
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  // Distribution details
  distributionDetails: {
    recipientCount: {
      type: Number,
      min: 0
    },
    distributionLocation: String,
    distributionNotes: String
  },
  // Auto-assignment metadata
  assignmentType: {
    type: String,
    enum: ['manual', 'auto'],
    default: 'manual'
  },
  assignmentScore: {
    type: Number,
    default: 0 // Used for auto-assignment ranking
  }
}, {
  timestamps: true
});

// Indexes for optimized queries
VolunteerAssignmentSchema.index({ volunteer: 1, status: 1 });
VolunteerAssignmentSchema.index({ foodPost: 1 });
VolunteerAssignmentSchema.index({ assignedBy: 1 });
VolunteerAssignmentSchema.index({ status: 1, createdAt: -1 });
VolunteerAssignmentSchema.index({ assignedAt: -1 });

export default mongoose.model('VolunteerAssignment', VolunteerAssignmentSchema);