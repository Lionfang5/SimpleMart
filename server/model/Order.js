import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  category: String,
  expirationDate: Date
}, { _id: false });

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [orderItemSchema],
  totalAmount: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'], 
    default: 'pending' 
  },
  shippingAddress: {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true }
  },
  paymentInfo: {
    method: { 
      type: String, 
      enum: ['card', 'cod'], 
      default: 'card',
      required: true 
    },
    transactionId: { type: String, required: true },
    processingFee: { type: Number, default: 0 },
    // Card-specific fields (only required for card payments)
    cardNumber: { 
      type: String,
      required: function() { return this.method === 'card'; }
    },
    cardName: { 
      type: String,
      required: function() { return this.method === 'card'; }
    },
    expiryDate: { 
      type: String,
      required: function() { return this.method === 'card'; }
    },
    cvv: String // Not stored for security, but keeping for schema completeness
  },
  orderDate: { type: Date, default: Date.now },
  deliveredDate: Date
}, { timestamps: true });

export default mongoose.model("Order", orderSchema);