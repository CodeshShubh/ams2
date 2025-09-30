import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { apiRequest } from '@/lib/queryClient';
import type { User } from './authSlice';
import type { AttendanceRecord } from './attendanceSlice';

// Types for admin state
export interface GeofenceSettings {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  radius: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminStats {
  totalEmployees: number;
  checkedInToday: number;
  pendingApprovals: number;
  avgHoursThisWeek: number;
}

export interface AdminState {
  users: User[];
  attendanceRecords: AttendanceRecord[];
  geofenceSettings: GeofenceSettings[];
  stats: AdminStats | null;
  isLoading: boolean;
  usersLoading: boolean;
  recordsLoading: boolean;
  statsLoading: boolean;
  geofenceLoading: boolean;
  error: string | null;
}

// Initial state
const initialState: AdminState = {
  users: [],
  attendanceRecords: [],
  geofenceSettings: [],
  stats: null,
  isLoading: false,
  usersLoading: false,
  recordsLoading: false,
  statsLoading: false,
  geofenceLoading: false,
  error: null,
};

// Async thunks for admin actions
export const getAllUsers = createAsyncThunk(
  'admin/getAllUsers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiRequest('GET', '/api/admin/users');
      const data = await response.json();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to get users');
    }
  }
);

export const getAllAttendanceRecords = createAsyncThunk(
  'admin/getAllAttendanceRecords',
  async (limit: number | undefined, { rejectWithValue }) => {
    try {
      const url = limit ? `/api/admin/attendance?limit=${limit}` : '/api/admin/attendance';
      const response = await apiRequest('GET', url);
      const data = await response.json();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to get attendance records');
    }
  }
);

export const getAdminStats = createAsyncThunk(
  'admin/getStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiRequest('GET', '/api/admin/stats');
      const data = await response.json();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to get admin stats');
    }
  }
);

export const getGeofenceSettings = createAsyncThunk(
  'admin/getGeofenceSettings',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiRequest('GET', '/api/geofence');
      const data = await response.json();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to get geofence settings');
    }
  }
);

export const createGeofenceSettings = createAsyncThunk(
  'admin/createGeofenceSettings',
  async (settings: {
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    radius?: number;
    isActive?: boolean;
  }, { rejectWithValue }) => {
    try {
      const response = await apiRequest('POST', '/api/admin/geofence', settings);
      const data = await response.json();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create geofence settings');
    }
  }
);

export const updateGeofenceSettings = createAsyncThunk(
  'admin/updateGeofenceSettings',
  async ({ id, updates }: { id: string; updates: Partial<GeofenceSettings> }, { rejectWithValue }) => {
    try {
      const response = await apiRequest('PUT', `/api/admin/geofence/${id}`, updates);
      const data = await response.json();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update geofence settings');
    }
  }
);

// Admin slice
const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setUsers: (state, action: PayloadAction<User[]>) => {
      state.users = action.payload;
    },
    setGeofenceSettings: (state, action: PayloadAction<GeofenceSettings[]>) => {
      state.geofenceSettings = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get all users cases
      .addCase(getAllUsers.pending, (state) => {
        state.usersLoading = true;
        state.error = null;
      })
      .addCase(getAllUsers.fulfilled, (state, action) => {
        state.usersLoading = false;
        state.users = action.payload.users || [];
        state.error = null;
      })
      .addCase(getAllUsers.rejected, (state, action) => {
        state.usersLoading = false;
        state.error = action.payload as string;
      })
      
      // Get all attendance records cases
      .addCase(getAllAttendanceRecords.pending, (state) => {
        state.recordsLoading = true;
        state.error = null;
      })
      .addCase(getAllAttendanceRecords.fulfilled, (state, action) => {
        state.recordsLoading = false;
        state.attendanceRecords = action.payload.records || [];
        state.error = null;
      })
      .addCase(getAllAttendanceRecords.rejected, (state, action) => {
        state.recordsLoading = false;
        state.error = action.payload as string;
      })
      
      // Get admin stats cases
      .addCase(getAdminStats.pending, (state) => {
        state.statsLoading = true;
        state.error = null;
      })
      .addCase(getAdminStats.fulfilled, (state, action) => {
        state.statsLoading = false;
        state.stats = action.payload.stats;
        state.error = null;
      })
      .addCase(getAdminStats.rejected, (state, action) => {
        state.statsLoading = false;
        state.error = action.payload as string;
      })
      
      // Get geofence settings cases
      .addCase(getGeofenceSettings.pending, (state) => {
        state.geofenceLoading = true;
        state.error = null;
      })
      .addCase(getGeofenceSettings.fulfilled, (state, action) => {
        state.geofenceLoading = false;
        state.geofenceSettings = action.payload.geofenceSettings || [];
        state.error = null;
      })
      .addCase(getGeofenceSettings.rejected, (state, action) => {
        state.geofenceLoading = false;
        state.error = action.payload as string;
      })
      
      // Create geofence settings cases
      .addCase(createGeofenceSettings.fulfilled, (state, action) => {
        if (action.payload.geofenceSettings) {
          state.geofenceSettings.push(action.payload.geofenceSettings);
        }
      })
      
      // Update geofence settings cases
      .addCase(updateGeofenceSettings.fulfilled, (state, action) => {
        const index = state.geofenceSettings.findIndex(g => g.id === action.payload.geofenceSettings.id);
        if (index !== -1) {
          state.geofenceSettings[index] = action.payload.geofenceSettings;
        }
      });
  },
});

// Export actions
export const { clearError, setUsers, setGeofenceSettings } = adminSlice.actions;

// Export selectors
export const selectAdmin = (state: { admin: AdminState }) => state.admin;
export const selectUsers = (state: { admin: AdminState }) => state.admin.users;
export const selectAttendanceRecords = (state: { admin: AdminState }) => state.admin.attendanceRecords;
export const selectGeofenceSettings = (state: { admin: AdminState }) => state.admin.geofenceSettings;
export const selectAdminStats = (state: { admin: AdminState }) => state.admin.stats;
export const selectAdminLoading = (state: { admin: AdminState }) => state.admin.isLoading;
export const selectUsersLoading = (state: { admin: AdminState }) => state.admin.usersLoading;
export const selectRecordsLoading = (state: { admin: AdminState }) => state.admin.recordsLoading;
export const selectStatsLoading = (state: { admin: AdminState }) => state.admin.statsLoading;
export const selectGeofenceLoading = (state: { admin: AdminState }) => state.admin.geofenceLoading;
export const selectAdminError = (state: { admin: AdminState }) => state.admin.error;

// Export reducer
export default adminSlice.reducer;