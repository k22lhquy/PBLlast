import axiosClient from './axiosClient';

export const adminApi = {
    getStats: () => axiosClient.get('/admin/stats'),
    getUsers: () => axiosClient.get('/admin/users'),
    deleteUser: (userId) => axiosClient.delete(`/admin/users/${userId}`),
    updateTokenLimit: (userId, limit) => axiosClient.patch(`/admin/users/${userId}/token-limit`, { limit }),
    deletePost: (postId) => axiosClient.delete(`/admin/posts/${postId}`),
    deleteQuestion: (questionId) => axiosClient.delete(`/admin/questions/${questionId}`),
    getUserPosts: (userId) => axiosClient.get(`/admin/users/${userId}/posts`),
    getUserQuestions: (userId) => axiosClient.get(`/admin/users/${userId}/questions`),
    getReportedContent: () => axiosClient.get('/admin/reports')
};
