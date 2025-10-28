const API_BASE_URL = 'https://duofinder.onrender.com';

export const authService = {
  register: async (userData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 400) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Email already registered');
        }
        throw new Error(`Registration failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },
};