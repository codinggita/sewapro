import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import themeReducer from './themeSlice';
import langReducer from './langSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    theme: themeReducer,
    lang: langReducer,
  }
});

export default store;
