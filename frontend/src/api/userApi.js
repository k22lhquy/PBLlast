import axiosClient from './axiosClient';

export const userApi = {
  getProfile: (userId) => axiosClient.get(`/users/${userId}`),
  getUserPosts: (userId) => axiosClient.get(`/users/${userId}/posts`),
  getUserQuestions: (userId) => axiosClient.get(`/users/${userId}/questions`),
  searchUsers: (query) => axiosClient.get('/users/search/query', { params: { q: query } }),
  likeUser: (userId) => axiosClient.patch(`/users/${userId}/like`),
  searchPosts: (query) => axiosClient.get('/community/search/query', { params: { q: query } }),
  searchQuestions: (query) => axiosClient.get('/qa/search/query', { params: { q: query } }),
};
