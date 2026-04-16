import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

// ------------------ Thunk ------------------
export const fetchAppointments = createAsyncThunk(
  'appointment/fetchAppointments',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/admin/appointments');
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Ошибка загрузки');
    }
  }
);

export const addAppointment = createAsyncThunk(
  'appointment/addAppointment',
  async (appointmentData, { rejectWithValue, dispatch }) => {
    try {
      const response = await api.post('/appointments', appointmentData);
      // После успешного создания обновляем список (для админа)
      dispatch(fetchAppointments());
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Ошибка создания записи');
    }
  }
);

export const updateAppointmentStatus = createAsyncThunk(
  'appointment/updateAppointmentStatus',
  async ({ id, status }, { rejectWithValue, dispatch }) => {
    try {
      await api.put(`/admin/appointments/${id}/status`, { status });
      dispatch(fetchAppointments());
      return { id, status };
    } catch (err) {
      return rejectWithValue(err.response?.data?.error);
    }
  }
);

export const deleteAppointment = createAsyncThunk(
  'appointment/deleteAppointment',
  async (id, { rejectWithValue, dispatch }) => {
    try {
      await api.delete(`/admin/appointments/${id}`);
      dispatch(fetchAppointments());
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error);
    }
  }
);

export const deleteArchivedAppointments = createAsyncThunk(
  'appointment/deleteArchivedAppointments',
  async (_, { rejectWithValue, dispatch }) => {
    try {
      await api.delete('/admin/appointments/archive');
      dispatch(fetchAppointments());
      return true;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error);
    }
  }
);

export const fetchAppointmentByPhone = createAsyncThunk(
  'appointment/fetchAppointmentByPhone',
  async (phone, { rejectWithValue }) => {
    try {
      const response = await api.get(`/appointments/by-phone?phone=${phone}`);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error);
    }
  }
);

// ------------------ Slice ------------------
const initialState = {
  appointments: [],
  currentAppointment: {
    clientName: '',
    date: '',
    master: '',
    service: '',
    phone: '',
    tattooIdea: '',
    tattooSize: '',
    bodyPlacement: ''
  },
  lastAppointment: null,
  bookingError: null,
  masters: [
    { id: 1, name: 'Алексей', specialization: 'Реализм', experience: '5 лет' },
    { id: 2, name: 'Мария', specialization: 'Минимализм', experience: '3 года' },
    { id: 3, name: 'Дмитрий', specialization: 'Традишнл', experience: '7 лет' },
    { id: 4, name: 'Ольга', specialization: 'Акварель', experience: '4 года' }
  ],
  loading: false,
  error: null
};

const appointmentSlice = createSlice({
  name: 'appointment',
  initialState,
  reducers: {
    setAppointmentData: (state, action) => {
      state.currentAppointment = { ...state.currentAppointment, ...action.payload };
    },
    clearBookingError: (state) => {
      state.bookingError = null;
    },
    clearLastAppointment: (state) => {
      state.lastAppointment = null;
    },
    clearCurrentAppointment: (state) => {
      state.currentAppointment = initialState.currentAppointment;
    }
  },
  extraReducers: (builder) => {
    builder
      // fetchAppointments
      .addCase(fetchAppointments.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAppointments.fulfilled, (state, action) => {
        state.loading = false;
        state.appointments = action.payload;
      })
      .addCase(fetchAppointments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // addAppointment
      .addCase(addAppointment.pending, (state) => {
        state.bookingError = null;
      })
      .addCase(addAppointment.fulfilled, (state, action) => {
        state.lastAppointment = action.payload;
        state.currentAppointment = initialState.currentAppointment;
      })
      .addCase(addAppointment.rejected, (state, action) => {
        state.bookingError = action.payload;
      })
      // fetchAppointmentByPhone
      .addCase(fetchAppointmentByPhone.fulfilled, (state, action) => {
        // результат можно сохранить в отдельное поле, но для простоты используем lastAppointment
        state.lastAppointment = action.payload;
      })
      .addCase(fetchAppointmentByPhone.rejected, (state) => {
        state.lastAppointment = null;
      });
  }
});

export const {
  setAppointmentData,
  clearBookingError,
  clearLastAppointment,
  clearCurrentAppointment
} = appointmentSlice.actions;

export default appointmentSlice.reducer;