import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchMe } from './authSlice';
import { authApi } from '../../api/authApi';

export const toggleThemeAsync = createAsyncThunk(
    'theme/toggle',
    async (_, { getState }) => {
        const { theme, auth } = getState();
        const nextDark = !theme.isDark;
        
        // Optimistic UI save
        localStorage.setItem('theme', nextDark ? 'dark' : 'light');
        
        // Fire & Forget to API if logged in
        if (auth.isAuthenticated) {
            authApi.updateTheme(nextDark).catch(err => console.error("Theme sync fail", err));
        }
        
        return nextDark;
    }
);

const storedTheme = localStorage.getItem('theme');
const initialState = {
    isDark: storedTheme === 'dark'
};

const themeSlice = createSlice({
    name: 'theme',
    initialState,
    reducers: {
        setTheme: (state, action) => {
            state.isDark = action.payload;
            localStorage.setItem('theme', action.payload ? 'dark' : 'light');
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(toggleThemeAsync.fulfilled, (state, action) => {
                state.isDark = action.payload;
            })
            .addCase(fetchMe.fulfilled, (state, action) => {
                const userTheme = action.payload.user?.themeIsDark;
                if (userTheme !== undefined) {
                    state.isDark = userTheme;
                    localStorage.setItem('theme', userTheme ? 'dark' : 'light');
                }
            });
    }
});

export const { setTheme } = themeSlice.actions;
export default themeSlice.reducer;
