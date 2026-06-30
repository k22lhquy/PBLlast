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

export const deleteConversation = createAsyncThunk('chat/delete', async (id, { rejectWithValue, dispatch, getState }) => {
    try {
        await chatApi.deleteConversation(id);
        const state = getState().chat;
        
        // If the deleted conversation is the active one, find a new one to select
        if (String(state.activeConversationId) == String(id)) {
            const remaining = state.conversations.filter(c => String(c.id) !== String(id));
            const nextId = remaining.length > 0 ? remaining[0].id : null;
            dispatch(setActiveConversationId(nextId));
        }
        
        return id;
    } catch(err) {
        return rejectWithValue(err.message || 'Cannot delete conversation');
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
          const freshConversations = action.payload;
          
          // CRITICAL: If our current activeConversationId is NOT in the fresh list, 
          // it might be a brand new one that the server hasn't listed yet.
          // We MUST NOT lose it!
          const activeExists = freshConversations.find(c => String(c.id) === String(state.activeConversationId));
          const currentActiveObj = state.conversations.find(c => String(c.id) === String(state.activeConversationId));
          
          if (state.activeConversationId && !activeExists && currentActiveObj) {
              // Keep the current active one at the top of the new list
              state.conversations = [currentActiveObj, ...freshConversations];
          } else {
              state.conversations = freshConversations;
          }
          
          // Auto-select first if none active
          if(!state.activeConversationId && state.conversations.length > 0) {
              state.activeConversationId = state.conversations[0].id; 
              localStorage.setItem('activeConversationId', state.activeConversationId);
          }
      })
      // Create new Chat
      .addCase(createNewConversation.fulfilled, (state, action) => {
          state.conversations.unshift(action.payload);
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
          // Use loose comparison or string cast to avoid ID type mismatches
          if (String(action.payload.id) == String(state.activeConversationId)) {
              state.files = [...action.payload.files];
          }
      })
      // Delete Conversation
      .addCase(deleteConversation.fulfilled, (state, action) => {
          state.conversations = state.conversations.filter(c => String(c.id) !== String(action.payload));
      });
  }
});

export const { setActiveConversationId, addMessageLocally, setSendingMessage, updateConversationTitleLocally } = chatSlice.actions;
export default chatSlice.reducer;
