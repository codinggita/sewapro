import { createSlice } from '@reduxjs/toolkit';

const workerSlice = createSlice({
  name: 'workers',
  initialState: {
    workers: [],
    nearbyWorkers: [],
    selectedWorker: null,
    loading: false,
    error: null
  },
  reducers: {
    setWorkers: (state, action) => { state.workers = action.payload; },
    setNearbyWorkers: (state, action) => { state.nearbyWorkers = action.payload; },
    setSelectedWorker: (state, action) => { state.selectedWorker = action.payload; },
    updateWorkerAvailability: (state, action) => {
      const { id, isAvailable } = action.payload;
      const w = state.workers.find(w => w._id === id);
      if (w) w.isAvailable = isAvailable;
    },
    setWorkerLoading: (state, action) => { state.loading = action.payload; },
    setWorkerError: (state, action) => { state.error = action.payload; }
  }
});

export const { setWorkers, setNearbyWorkers, setSelectedWorker, updateWorkerAvailability, setWorkerLoading, setWorkerError } = workerSlice.actions;
export default workerSlice.reducer;
