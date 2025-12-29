

// Login user
export const login = async (email, password) => {
  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // important for cookies
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Login failed');

    console.log('✅ Login success:', data);
    return data;
  } catch (err) {
    console.error('❌ Login failed:', err.message);
    throw err;
  }
};

// Register user
export const register = async (full_name, email, password, role) => {
  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // important for cookies
      body: JSON.stringify({ full_name, email, password, role }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Registration failed');

    console.log('✅ Registration success:', data);
    return data;
  } catch (err) {
    console.error('❌ Registration failed:', err.message);
    throw err;
  }
};

// Logout user
export const logout = async () => {
  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/logout`, {
      method: 'POST',
      credentials: 'include', // sends cookie to backend to clear token
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Logout failed');

    console.log('✅ Logout success:', data);
    return data;
  } catch (err) {
    console.error('❌ Logout failed:', err.message);
    throw err;
  }
};

// Get current user profile
export const getProfile = async () => {
  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/profile`, {
      method: 'GET',
      credentials: 'include', // ensures token cookie is sent
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch profile');

    console.log('📄 Profile data:', data);
    return data;
  } catch (err) {
    console.error('❌ Get profile failed:', err.message);
    throw err;
  }
};
