const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const User = require('./models/User');
const Order = require('./models/Order');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err));

// JWT Auth Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Access denied. No token provided.' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid or expired token.' });

    req.user = user;
    next();
  });
};

// Test route
app.get('/', (req, res) => {
  res.send('Backend is working! 🔧');
});

// ✅ Corrected Signup Route
app.post('/api/signup', async (req, res) => {
  try {
    const { email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: 'User registered successfully!' });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ message: 'Signup failed', error: err.message });
  }
});

// ✅ Login route
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    res.status(200).json({ message: 'Login successful!', token });
  } catch (err) {
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
});

// Order History
app.get('/api/orders', authenticateToken, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.email }).sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (err) {
    console.error('Order fetch error:', err);
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
});
// ✅ Protected Checkout route
app.post('/api/checkout', authenticateToken, async (req, res) => {
  try {
    const { items } = req.body;

    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const order = new Order({ items, total, user: req.user.email });
    await order.save();

    res.status(200).json({ message: 'Order placed successfully!' });
  } catch (err) {
    res.status(500).json({ message: 'Checkout failed', error: err.message });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
