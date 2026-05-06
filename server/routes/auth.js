import express from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const router = express.Router();

// POST /api/auth/login  — Env-based admin login (no DB needed)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      return res.status(500).json({ message: 'Server admin credentials not configured.' });
    }

    // Validate credentials
    const emailMatch = email.toLowerCase() === adminEmail.toLowerCase();
    const passwordMatch = password === adminPassword;

    if (!emailMatch || !passwordMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // Issue JWT token
    const token = jwt.sign(
      { id: 'admin', email: adminEmail, name: 'Admin', role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: { id: 'admin', name: 'Admin', email: adminEmail, role: 'admin' }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login.' });
  }
});

// GET /api/auth/me — Returns the authenticated user info from JWT
router.get('/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided.' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ user: decoded });
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token.' });
  }
});

export default router;
