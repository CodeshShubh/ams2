import { queryClient } from "./queryClient";

// Base API configuration
const API_BASE_URL = '/api';

// Authentication token management
let authToken: string | null = localStorage.getItem('authToken');

export const setAuthToken = (token: string | null) => {
  authToken = token;
  if (token) {
    localStorage.setItem('authToken', token);
  } else {
    localStorage.removeItem('authToken');
    queryClient.clear(); // Clear all cached queries on logout
  }
};

// API request wrapper with authentication
export const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Token expired or invalid, clear auth and redirect to login
    setAuthToken(null);
    window.location.href = '/login';
    throw new Error('Authentication required');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || 'API request failed');
  }

  return response.json();
};

// Authentication API
export const authApi = {
  login: async (email: string, password: string) => {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (response.token) {
      setAuthToken(response.token);
    }
    
    return response;
  },

  register: async (userData: {
    name: string;
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
    role?: 'admin' | 'staff';
  }) => {
    const response = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    
    if (response.token) {
      setAuthToken(response.token);
    }
    
    return response;
  },

  getProfile: async () => {
    return apiRequest('/auth/me');
  },

  logout: () => {
    setAuthToken(null);
    queryClient.clear();
  },
};

// Attendance API
export const attendanceApi = {
  checkIn: async (latitude: number, longitude: number, notes?: string) => {
    return apiRequest('/attendance/check-in', {
      method: 'POST',
      body: JSON.stringify({ latitude, longitude, notes }),
    });
  },

  checkOut: async (latitude?: number, longitude?: number, notes?: string) => {
    return apiRequest('/attendance/check-out', {
      method: 'POST',
      body: JSON.stringify({ latitude, longitude, notes }),
    });
  },

  getStatus: async () => {
    return apiRequest('/attendance/status');
  },

  getHistory: async (limit?: number) => {
    const params = limit ? `?limit=${limit}` : '';
    return apiRequest(`/attendance/history${params}`);
  },
};

// Admin API
export const adminApi = {
  getUsers: async () => {
    return apiRequest('/admin/users');
  },

  getAttendanceRecords: async (limit?: number) => {
    const params = limit ? `?limit=${limit}` : '';
    return apiRequest(`/admin/attendance${params}`);
  },

  getStats: async () => {
    return apiRequest('/admin/stats');
  },

  createGeofence: async (geofenceData: {
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    radius?: number;
    isActive?: boolean;
  }) => {
    return apiRequest('/admin/geofence', {
      method: 'POST',
      body: JSON.stringify(geofenceData),
    });
  },

  updateGeofence: async (id: string, updates: any) => {
    return apiRequest(`/admin/geofence/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },
};

// Geofence API
export const geofenceApi = {
  getActiveSettings: async () => {
    return apiRequest('/geofence');
  },
};

// Helper function to get user's current location
export const getCurrentLocation = (): Promise<GeolocationPosition> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => resolve(position),
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            reject(new Error('Location access denied by user'));
            break;
          case error.POSITION_UNAVAILABLE:
            reject(new Error('Location information is unavailable'));
            break;
          case error.TIMEOUT:
            reject(new Error('Location request timed out'));
            break;
          default:
            reject(new Error('An unknown error occurred while retrieving location'));
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000, // Cache location for 1 minute
      }
    );
  });
};