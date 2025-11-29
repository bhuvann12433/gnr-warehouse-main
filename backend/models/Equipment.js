import mongoose from 'mongoose';

const equipmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },

  category: {
    type: String,
    required: true,
    enum: ['Instruments', 'Consumables', 'Diagnostic', 'Furniture', 'Electronics'],
    trim: true
  },

  quantity: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },

  costPerUnit: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },

  // ⭐ NEW FIELD - HSN CODE
  hsnCode: {
    type: String,
    trim: true,
    default: ""
  },

  // ⭐ NEW FIELD - UNIT (UNT / PCS / BOX)
  unit: {
    type: String,
    trim: true,
    default: "UNT"
  },

  statusCounts: {
    available: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    in_use: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    maintenance: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    }
  },

  notes: {
    type: String,
    trim: true,
    default: ''
  }

}, {
  timestamps: true
});

// Pre-save middleware to ensure status counts match quantity
equipmentSchema.pre('save', function(next) {
  const totalStatus = this.statusCounts.available + this.statusCounts.in_use + this.statusCounts.maintenance;
  if (totalStatus !== this.quantity) {
    const error = new Error(`Status counts (${totalStatus}) must equal total quantity (${this.quantity})`);
    error.name = 'ValidationError';
    return next(error);
  }
  next();
});

// Virtual for total cost
equipmentSchema.virtual('totalCost').get(function() {
  return this.quantity * this.costPerUnit;
});

// Ensure virtual fields are included in JSON output
equipmentSchema.set('toJSON', { virtuals: true });

const Equipment = mongoose.model('Equipment', equipmentSchema);

export default Equipment;
