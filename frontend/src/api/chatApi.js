import axiosClient from './axiosClient';

export const chatApi = {
  getAllConversations: () => axiosClient.get('/chat-box/all-conversations'),
  newChat: () => axiosClient.get('/chat-box/new-chat'),
  deleteConversation: (id) => axiosClient.delete(`/chat-box/delete-conversations/${id}`),
  uploadFile: (formData) => {
      // Must use FormData since FastAPI expects File
      return axiosClient.post('/chat-box/upload-file', formData, {
          headers: {
              'Content-Type': 'multipart/form-data',
          }
      });
  },
  deleteFile: (fileId) => axiosClient.delete(`/chat-box/delete-file/${fileId}`),
  getFiles: (conversationId) => axiosClient.get(`/chat-box/files/${conversationId}`),
  renameConversation: (conversationId, title) => axiosClient.put(`/chat-box/rename/${conversationId}`, { title }),
  getMessages: (conversationId) => axiosClient.get(`/messages/all_messages/${conversationId}`),
  sendMessage: (conversationId, message) => axiosClient.post('/messages/send_message', {
      conversationId: conversationId,
      message: message
  }),
  importCommunityFile: (conversationId, fileId) => axiosClient.post(`/chat-box/import-file/${conversationId}`, { file_id: fileId })
};
