const supabase = require('../config/database');
const { hashPassword, comparePassword } = require('../utils/passwordHelper');
const { generateToken } = require('../utils/jwtHelper');

const cookieOptions = {
  httpOnly: true,
  secure: true,        // Required for HTTPS (Render)
  sameSite: 'none',    // Required for cross-domain cookies
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

const authController = {
  // -------------------- REGISTER --------------------
  register: async (req, res, next) => {
    try {
      const { email, password, full_name, role } = req.body;

      // Validate role
      const validRoles = ['admin', 'ss_secretary', 'viewer'];
      if (role && !validRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          message: `Invalid role. Must be one of: ${validRoles.join(', ')}`,
        });
      }

      // Check if user exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'User already exists',
        });
      }

      // Hash password
      const password_hash = await hashPassword(password);

      // Insert new user
      const { data: newUser, error } = await supabase
        .from('users')
        .insert([{ email, password_hash, full_name, role: role || 'viewer' }])
        .select()
        .single();

      if (error) {
        console.error('Supabase insert error:', error);
        return res.status(400).json({
          success: false,
          message: error.message || 'Failed to create user',
        });
      }

      // Generate JWT token
      const token = generateToken(newUser.id, newUser.email, newUser.role);

      // Set cookie
      res.cookie('token', token, cookieOptions);

      res.status(201).json({
        success: true,
        message: 'Registration successful',
        data: {
          user: {
            id: newUser.id,
            email: newUser.email,
            full_name: newUser.full_name,
            role: newUser.role,
          },
        },
      });
    } catch (err) {
      console.error('Registration error:', err);
      next(err);
    }
  },

  // -------------------- LOGIN --------------------
  login: async (req, res, next) => {
    try {
      const { email, password } = req.body;

      // Get user from Supabase
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('is_active', true)
        .single();

      if (error || !user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
      }

      // Verify password
      const valid = await comparePassword(password, user.password_hash);
      if (!valid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
      }

      // Generate token
      const token = generateToken(user.id, user.email, user.role);
      res.cookie('token', token, cookieOptions);

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            email: user.email,
            full_name: user.full_name,
            role: user.role,
          },
        },
      });
    } catch (err) {
      console.error('Login error:', err);
      next(err);
    }
  },

  // -------------------- LOGOUT --------------------
  logout: (req, res) => {
    res.clearCookie('token', cookieOptions);
    res.json({ success: true, message: 'Logged out successfully' });
  },

  // -------------------- GET PROFILE --------------------
  getProfile: async (req, res, next) => {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('id, email, full_name, role, created_at')
        .eq('id', req.user.userId)
        .single();

      if (error || !user) throw new Error('User not found');

      res.json({ success: true, data: user });
    } catch (err) {
      console.error('Get profile error:', err);
      next(err);
    }
  },

  // -------------------- CHANGE PASSWORD --------------------
  changePassword: async (req, res, next) => {
    try {
      const { current_password, new_password } = req.body;
      const userId = req.user.userId;

      const { data: user, error } = await supabase
        .from('users')
        .select('password_hash')
        .eq('id', userId)
        .single();

      if (error || !user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const valid = await comparePassword(current_password, user.password_hash);
      if (!valid) {
        return res.status(400).json({ success: false, message: 'Current password incorrect' });
      }

      const new_hash = await hashPassword(new_password);

      await supabase
        .from('users')
        .update({ password_hash: new_hash })
        .eq('id', userId);

      res.json({ success: true, message: 'Password changed successfully' });
    } catch (err) {
      console.error('Change password error:', err);
      next(err);
    }
  },
};

module.exports = authController;