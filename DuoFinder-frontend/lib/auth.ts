const API_BASE_URL = 'https://duofinder-1.onrender.com';

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface ApiError {
  detail: string;
}

export const authService = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData: ApiError = await response.json();
      throw new Error(errorData.detail || 'Login failed');
    }

    return await response.json();
  },

  getToken: (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('access_token');
    }
    return null;
  },

  isAuthenticated: (): boolean => {
    if (typeof window !== 'undefined') {
      return !!localStorage.getItem('access_token');
    }
    return false;
  },

  logout: (): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('token_type');
    }
  },
};

// Helper function for authenticated API calls
export const authFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const token = authService.getToken();
  
  // Create headers with proper typing
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Token expired or invalid
    authService.logout();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    throw new Error('Authentication required');
  }

  return response;
};

// Add these interfaces to your existing auth.ts
export interface UserProfile {
  username: string;
  email: string;
  bio: string;
  age: number;
  server?: string;
  discord?: string;
  tracker?: string;
  birthdate?: string;
  age_min?: number;
  age_max?: number;
  games?: UserGame[];
}

export interface UserGame {
  game_id: number;
  game_name: string;
  skill_level: string;
  is_ranked: boolean;
  game_rank_local_id?: number;
  rank_name?: string;
}

export interface UpdateProfileRequest {
  username?: string;
  password?: string;
  bio?: string;
  server?: string;
  discord?: string;
  tracker?: string;
  birthdate?: string;
  age_min?: number;
  age_max?: number;
  games?: Array<{
    game_id?: number;
    skill_level?: string;
    is_ranked?: boolean;
    game_rank_local_id?: number;
  }>;
}

export interface UpdateProfileResponse {
  message: string;
  new_profile: {
    username: string;
    email: string;
    bio: string;
    server?: string;
    discord?: string;
    tracker?: string;
    birthdate: string;
  };
}

// Add these functions to your authService
export const profileService = {
  // Get current user's profile
  getProfile: async (): Promise<UserProfile> => {
    const response = await authFetch('/users/me');
    
    if (!response.ok) {
      const errorData: ApiError = await response.json();
      throw new Error(errorData.detail || 'Failed to fetch profile');
    }

    return await response.json();
  },

  // Update user's profile
  updateProfile: async (profileData: UpdateProfileRequest): Promise<UpdateProfileResponse> => {
    const response = await authFetch('/users/me', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });

    if (!response.ok) {
      const errorData: ApiError = await response.json();
      throw new Error(errorData.detail || 'Failed to update profile');
    }

    return await response.json();
  },

  // Delete user account
  deleteAccount: async (): Promise<{ message: string }> => {
    const response = await authFetch('/users/me', {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData: ApiError = await response.json();
      throw new Error(errorData.detail || 'Failed to delete account');
    }

    return await response.json();
  },
};