import { createContext, useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toggleTheme } from '../redux/themeSlice';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const dispatch = useDispatch();
  const theme = useSelector(state => state.theme.mode);
  const toggle = () => dispatch(toggleTheme());
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme: toggle }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
