import axiosClient from './axiosClient';

export const communityApi = {
    getPosts: () => axiosClient.get('/community/'),
    uploadCommunityFile: (formData) => {
        return axiosClient.post('/community/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },
    createPost: (data) => axiosClient.post('/community/', data),
    toggleLike: (postId) => axiosClient.post(`/community/${postId}/like`),
    reportPost: (postId) => axiosClient.post(`/community/${postId}/report`)
};
