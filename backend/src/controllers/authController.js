const supabase = require('../config/database');
const { hashPassword, comparePassword } = require('../utils/passwordHelper');
const { generateToken } = require('../utils/jwtHelper');

const cookieOptions = {
  httpOnly: true,
  secure: true,       // 🔥 REQUIRED for HTTPS
  sameSite: 'none',   // 🔥 REQUIRED for cross-domain
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const authController = {
  register: async (req, res, next) => {
    try {
      const { email, password, full_name, role } = req.body;

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

      const password_hash = await hashPassword(password);

      const { data: newUser, error } = await supabase
        .from('users')
        .insert([
          {
            email,
            password_hash,
            full_name,
            role: role || 'viewer',
          },
        ])
        .select()
        .single();

      if (error) throw error;

      const token = generateToken(newUser.id, newUser.email, newUser.role);
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
      next(err);
    }
  },

  login: async (req, res, next) => {
    try {
      const { email, password } = req.body;

      const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('is_active', true)
        .single();

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
      }

      const valid = await comparePassword(password, user.password_hash);
      if (!valid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
      }

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
      next(err);
    }
  },

  logout: (req, res) => {
    res.clearCookie('token', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
    });

    res.json({ success: true, message: 'Logged out successfully' });
  },

  getProfile: async (req, res, next) => {
    try {
      const { data: user } = await supabase
        .from('users')
        .select('id, email, full_name, role, created_at')
        .eq('id', req.user.userId)
        .single();

      res.json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  },

  changePassword: async (req, res, next) => {
    try {
      const { current_password, new_password } = req.body;

      const { data: user } = await supabase
        .from('users')
        .select('password_hash')
        .eq('id', req.user.userId)
        .single();

      const valid = await comparePassword(current_password, user.password_hash);
      if (!valid) {
        return res.status(400).json({
          success: false,
          message: 'Current password incorrect',
        });
      }

      const new_hash = await hashPassword(new_password);

      await supabase
        .from('users')
        .update({ password_hash: new_hash })
        .eq('id', req.user.userId);

      res.json({ success: true, message: 'Password changed successfully' });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = authController;
