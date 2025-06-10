export const login = async (credentials) => {
  try {
    const response = await fetch('/smlekha/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });
    
    if (!response.ok) {
      throw new Error('Login failed');
    }
    
    const data = await response.json();
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    
    return data;
  } catch (error) {
    console.error('Error logging in:', error);
    throw error;
  }
};

export const logout = async () => {
  // Remove tokens immediately
  localStorage.removeItem('token');
  localStorage.removeItem('user');

  try {
    const token = localStorage.getItem('token');
    const response = await fetch('/smlekha/auth/logout', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      console.warn('Server logout failed with:', response.status);
    }
  } catch (err) {
    console.error('Logout request error:', err);
  } finally {
    window.location.href = '/login';
  }
};


export const register = async (userData) => {
  try {
    const response = await fetch('/smlekha/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    
    if (!response.ok) {
      throw new Error('Registration failed');
    }
    
    const data = await response.json();
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    
    return data;
  } catch (error) {
    console.error('Error registering:', error);
    throw error;
  }
};

export const forgotPassword = async (email) => {
  try {
    const response = await fetch('/smlekha/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });
    
    if (!response.ok) {
      throw new Error('Password reset request failed');
    }
  } catch (error) {
    console.error('Error requesting password reset:', error);
    throw error;
  }
};

export const resetPassword = async (token, password) => {
  try {
    const response = await fetch('/smlekha/auth/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token, password }),
    });
    
    if (!response.ok) {
      throw new Error('Password reset failed');
    }
  } catch (error) {
    console.error('Error resetting password:', error);
    throw error;
  }
};

export const verifyEmail = async (token) => {
  try {
    const response = await fetch('/smlekha/auth/verify-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });
    
    if (!response.ok) {
      throw new Error('Email verification failed');
    }
  } catch (error) {
    console.error('Error verifying email:', error);
    throw error;
  }
};

export const refreshToken = async () => {
  try {
    const response = await fetch('/smlekha/auth/refresh-token', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Token refresh failed');
    }
    
    const data = await response.json();
    localStorage.setItem('token', data.token);
    
    return data;
  } catch (error) {
    console.error('Error refreshing token:', error);
    throw error;
  }
}; 