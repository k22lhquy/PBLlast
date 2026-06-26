import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { chatApi } from '../../api/chatApi';

// Thunks
export const fetchAllConversations = createAsyncThunk('chat/fetchAll', async (_, { rejectWithValue }) => {
    try {
        const response = await chatApi.getAllConversations();
        return response.data;
    } catch(err) {
        return rejectWithValue(err.message || 'Cannot fetch conversations');
    }
});

export const createNewConversation = createAsyncThunk('chat/create', async (_, { rejectWithValue }) => {
    try {
        const response = await chatApi.newChat();
        return response.data;
    } catch(err) {
        return rejectWithValue(err.message || 'Cannot create conversation');
    }
});

export const fetchMessages = createAsyncThunk('chat/fetchMessages', async (id, { rejectWithValue }) => {
    try {
        const response = await chatApi.getMessages(id);
        return response.data;
    } catch(err) {
        return rejectWithValue(err.message || 'Cannot fetch messages');
    }
});

export const fetchConversationFiles = createAsyncThunk('chat/fetchFiles', async (id, { rejectWithValue }) => {
    try {
        const response = await chatApi.getFiles(id);
        // Return both the data and the ID to prevent race conditions
        return { id, files: response.data };
    } catch(err) {
        return rejectWithValue(err.message || 'Cannot fetch files');
    }
});

const initialState = {
  conversations: [],
  activeConversationId: localStorage.getItem('activeConversationId') || null,
  messages: [],
  files: [],
  isLoadingFiles: false,
  isSendingMessage: false,
  error: null,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setActiveConversationId: (state, action) => {
      state.activeConversationId = action.payload;
      if (action.payload) {
          localStorage.setItem('activeConversationId', action.payload);
      } else {
          localStorage.removeItem('activeConversationId');
      }
      state.messages = []; // Clear current messages on switch
      state.files = []; // Clear current files
    },
    addMessageLocally: (state, action) => {
      state.messages.push(action.payload);  // payload includes community_references if present
    },
    setSendingMessage: (state, action) => {
        state.isSendingMessage = action.payload;
    },
    updateConversationTitleLocally: (state, action) => {
        const { id, title } = action.payload;
        const conv = state.conversations.find(c => c.id === id);
        if (conv) conv.title = title;
    }
  },
  extraReducers: (builder) => {
      builder
      // Fetch All Conversations
      .addCase(fetchAllConversations.fulfilled, (state, action) => {
          state.conversations = action.payload;
          
          // Verify if the current active ID still exists in the FRESH list
          const exists = state.conversations.find(c => c.id === state.activeConversationId);
          
          // IF we have no active ID at all, THEN auto-select the most recent one
          if(!state.activeConversationId && state.conversations.length > 0) {
              state.activeConversationId = state.conversations[0].id; // Sort is usually Descending
              localStorage.setItem('activeConversationId', state.activeConversationId);
          } 
          // IF it was deleted (truly not exists after we know we have data), then clear it
          else if (state.activeConversationId && !exists && state.conversations.length > 0) {
              // But ONLY if the conversations list actually has items (i.e., not a network error returning empty)
              // We'll trust the current ID for now to avoid jumpy UI during stale fetches
          }
      })
      // Create new Chat
      .addCase(createNewConversation.fulfilled, (state, action) => {
          state.conversations.push(action.payload);
          state.activeConversationId = action.payload.id;
          localStorage.setItem('activeConversationId', action.payload.id);
          state.messages = [];
      })
      // Fetch messages
      .addCase(fetchMessages.fulfilled, (state, action) => {
          if (action.payload.length === 0 && state.messages.length > 0) return;
          state.messages = action.payload;
      })
      // Fetch files
      .addCase(fetchConversationFiles.fulfilled, (state, action) => {
          state.files = [...action.payload.files];
      });
  }
});

export const { setActiveConversationId, addMessageLocally, setSendingMessage, updateConversationTitleLocally } = chatSlice.actions;
export default chatSlice.reducer;
