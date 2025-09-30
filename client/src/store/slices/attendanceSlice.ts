import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { apiRequest } from '@/lib/queryClient';

// Types for attendance state
export interface AttendanceRecord {
  id: string;
  userId: string;
  checkInTime: string;
  checkOutTime?: string | null;
  checkInLatitude?: number | null;
  checkInLongitude?: number | null;
  checkOutLatitude?: number | null;
  checkOutLongitude?: number | null;
  totalHours?: string | null;
  status: 'checked_in' | 'checked_out' | 'break';
  notes?: string | null;
  checkInPhoto?: string | null;
  checkOutPhoto?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceState {
  currentRecord: AttendanceRecord | null;
  history: AttendanceRecord[];
  isCheckedIn: boolean;
  isLoading: boolean;
  error: string | null;
  checkInLoading: boolean;
  checkOutLoading: boolean;
}

// Initial state
const initialState: AttendanceState = {
  currentRecord: null,
  history: [],
  isCheckedIn: false,
  isLoading: false,
  error: null,
  checkInLoading: false,
  checkOutLoading: false,
};

// Async thunks for attendance actions
export const checkIn = createAsyncThunk(
  'attendance/checkIn',
  async (data: {
    latitude: number;
    longitude: number;
    notes?: string;
    photo?: string;
  }, { rejectWithValue }) => {
    try {
      const response = await apiRequest('POST', '/api/attendance/check-in', data);
      const result = await response.json();
      return result;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Check-in failed');
    }
  }
);

export const checkOut = createAsyncThunk(
  'attendance/checkOut',
  async (data: {
    latitude?: number;
    longitude?: number;
    notes?: string;
    photo?: string;
  }, { rejectWithValue }) => {
    try {
      const response = await apiRequest('POST', '/api/attendance/check-out', data);
      const result = await response.json();
      return result;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Check-out failed');
    }
  }
);

export const getAttendanceStatus = createAsyncThunk(
  'attendance/getStatus',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiRequest('GET', '/api/attendance/status');
      const data = await response.json();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to get attendance status');
    }
  }
);

export const getAttendanceHistory = createAsyncThunk(
  'attendance/getHistory',
  async (limit: number | undefined, { rejectWithValue }) => {
    try {
      const url = limit ? `/api/attendance/history?limit=${limit}` : '/api/attendance/history';
      const response = await apiRequest('GET', url);
      const data = await response.json();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to get attendance history');
    }
  }
);

// Attendance slice
const attendanceSlice = createSlice({
  name: 'attendance',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentRecord: (state, action: PayloadAction<AttendanceRecord | null>) => {
      state.currentRecord = action.payload;
      state.isCheckedIn = !!action.payload && action.payload.status === 'checked_in';
    },
  },
  extraReducers: (builder) => {
    builder
      // Check-in cases
      .addCase(checkIn.pending, (state) => {
        state.checkInLoading = true;
        state.error = null;
      })
      .addCase(checkIn.fulfilled, (state, action) => {
        state.checkInLoading = false;
        state.currentRecord = action.payload.record;
        state.isCheckedIn = true;
        state.error = null;
      })
      .addCase(checkIn.rejected, (state, action) => {
        state.checkInLoading = false;
        state.error = action.payload as string;
      })
      
      // Check-out cases
      .addCase(checkOut.pending, (state) => {
        state.checkOutLoading = true;
        state.error = null;
      })
      .addCase(checkOut.fulfilled, (state, action) => {
        state.checkOutLoading = false;
        state.currentRecord = action.payload.record;
        state.isCheckedIn = false;
        // Add the completed record to history
        if (action.payload.record) {
          state.history.unshift(action.payload.record);
        }
        state.error = null;
      })
      .addCase(checkOut.rejected, (state, action) => {
        state.checkOutLoading = false;
        state.error = action.payload as string;
      })
      
      // Get status cases
      .addCase(getAttendanceStatus.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getAttendanceStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isCheckedIn = action.payload.isCheckedIn;
        state.currentRecord = action.payload.activeRecord;
        state.error = null;
      })
      .addCase(getAttendanceStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Get history cases
      .addCase(getAttendanceHistory.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getAttendanceHistory.fulfilled, (state, action) => {
        state.isLoading = false;
        state.history = action.payload.records || [];
        state.error = null;
      })
      .addCase(getAttendanceHistory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

// Export actions
export const { clearError, setCurrentRecord } = attendanceSlice.actions;

// Export selectors
export const selectAttendance = (state: { attendance: AttendanceState }) => state.attendance;
export const selectCurrentRecord = (state: { attendance: AttendanceState }) => state.attendance.currentRecord;
export const selectIsCheckedIn = (state: { attendance: AttendanceState }) => state.attendance.isCheckedIn;
export const selectAttendanceHistory = (state: { attendance: AttendanceState }) => state.attendance.history;
export const selectAttendanceLoading = (state: { attendance: AttendanceState }) => state.attendance.isLoading;
export const selectCheckInLoading = (state: { attendance: AttendanceState }) => state.attendance.checkInLoading;
export const selectCheckOutLoading = (state: { attendance: AttendanceState }) => state.attendance.checkOutLoading;
export const selectAttendanceError = (state: { attendance: AttendanceState }) => state.attendance.error;

// Export reducer
export default attendanceSlice.reducer;