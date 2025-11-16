const supabase = require('../config/database');
const { hashPassword, comparePassword } = require('../utils/passwordHelper');
const { generateToken } = require('../utils/jwtHelper');

const authController = {
  // Register new user
  register: async (req, res, next) => {
    try {
      const { email, password, full_name, role } = req.body;

      // Check if user exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      if (existingUser) {
        return res.status(409).json({ 
          success: false, 
          message: 'User already exists with this email' 
        });
      }

      // Hash password
      const password_hash = await hashPassword(password);

      // Create user
      const { data: newUser, error } = await supabase
        .from('users')
        .insert([{ 
          email, 
          password_hash, 
          full_name, 
          role: role || 'viewer' 
        }])
        .select()
        .single();

      if (error) throw error;

      // Generate token
      const token = generateToken(newUser.id, newUser.email, newUser.role);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: {
            id: newUser.id,
            email: newUser.email,
            full_name: newUser.full_name,
            role: newUser.role
          },
          token
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Login user
  login: async (req, res, next) => {
    try {
      const { email, password } = req.body;

      // Get user
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('is_active', true)
        .single();

      if (error || !user) {
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid email or password' 
        });
      }

      // Check password
      const isPasswordValid = await comparePassword(password, user.password_hash);

      if (!isPasswordValid) {
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid email or password' 
        });
      }

      // Generate token
      const token = generateToken(user.id, user.email, user.role);

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            email: user.email,
            full_name: user.full_name,
            role: user.role
          },
          token
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Get current user profile
  getProfile: async (req, res, next) => {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('id, email, full_name, role, created_at')
        .eq('id', req.user.userId)
        .single();

      if (error) throw error;

      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  },

  // Change password
  changePassword: async (req, res, next) => {
    try {
      const { current_password, new_password } = req.body;
      const userId = req.user.userId;

      // Get current user
      const { data: user } = await supabase
        .from('users')
        .select('password_hash')
        .eq('id', userId)
        .single();

      // Verify current password
      const isValid = await comparePassword(current_password, user.password_hash);
      if (!isValid) {
        return res.status(400).json({ 
          success: false, 
          message: 'Current password is incorrect' 
        });
      }

      // Hash new password
      const new_password_hash = await hashPassword(new_password);

      // Update password
      const { error } = await supabase
        .from('users')
        .update({ password_hash: new_password_hash })
        .eq('id', userId);

      if (error) throw error;

      res.json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = authController;