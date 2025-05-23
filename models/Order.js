const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    items: [
      {
        name: String,
        price: Number,
        quantity: Number
      }
    ],
    total: Number,
    user: String
  },
  {
    timestamps: true // ✅ Put it here, as schema options
  }
);

module.exports = mongoose.model('Order', orderSchema);
