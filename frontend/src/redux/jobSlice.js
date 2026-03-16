import { createSlice } from '@reduxjs/toolkit';

const jobSlice = createSlice({
  name: 'jobs',
  initialState: {
    jobs: [],
    selectedJob: null,
    loading: false,
    error: null,
    filters: { status: 'all', category: 'all', search: '' },
    currentPage: 1,
    totalPages: 1
  },
  reducers: {
    setJobs: (state, action) => { state.jobs = action.payload; },
    setSelectedJob: (state, action) => { state.selectedJob = action.payload; },
    setFilters: (state, action) => { state.filters = { ...state.filters, ...action.payload }; },
    setPage: (state, action) => { state.currentPage = action.payload; },
    setTotalPages: (state, action) => { state.totalPages = action.payload; },
    setJobLoading: (state, action) => { state.loading = action.payload; },
    setJobError: (state, action) => { state.error = action.payload; },
    clearFilters: (state) => { state.filters = { status: 'all', category: 'all', search: '' }; }
  }
});

export const { setJobs, setSelectedJob, setFilters, setPage, setTotalPages, setJobLoading, setJobError, clearFilters } = jobSlice.actions;
export default jobSlice.reducer;
