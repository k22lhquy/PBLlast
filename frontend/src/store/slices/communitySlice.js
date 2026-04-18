import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { communityApi } from '../../api/communityApi';
import { toast } from 'react-toastify';

export const fetchPosts = createAsyncThunk('community/fetchPosts', async (_, thunkAPI) => {
    try {
        const response = await communityApi.getPosts();
        return response.data;
    } catch (err) {
        return thunkAPI.rejectWithValue(err.response?.data?.message || "Failed to fetch posts");
    }
});

const initialState = {
    posts: [],
    isLoading: false,
};

const communitySlice = createSlice({
    name: 'community',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchPosts.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(fetchPosts.fulfilled, (state, action) => {
                state.isLoading = false;
                state.posts = action.payload;
            })
            .addCase(fetchPosts.rejected, (state) => {
                state.isLoading = false;
            });
    }
});

export default communitySlice.reducer;
