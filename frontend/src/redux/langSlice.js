import { createSlice } from '@reduxjs/toolkit';
const langSlice = createSlice({
  name: 'lang',
  initialState: { lang: localStorage.getItem('lang') || 'en' },
  reducers: {
    setLang: (state, action) => {
      state.lang = action.payload;
      localStorage.setItem('lang', action.payload);
    }
  }
});
export const { setLang } = langSlice.actions;
export default langSlice.reducer;
