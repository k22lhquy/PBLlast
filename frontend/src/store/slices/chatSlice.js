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
        return response.data;
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
          const exists = state.conversations.find(c => c.id === state.activeConversationId);
          
          if(!exists && state.conversations.length > 0) {
              state.activeConversationId = state.conversations[state.conversations.length - 1].id;
              localStorage.setItem('activeConversationId', state.activeConversationId);
          } else if (!exists) {
              state.activeConversationId = null;
              localStorage.removeItem('activeConversationId');
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
          state.files = action.payload;
      });
  }
});

export const { setActiveConversationId, addMessageLocally, setSendingMessage, updateConversationTitleLocally } = chatSlice.actions;
export default chatSlice.reducer;
