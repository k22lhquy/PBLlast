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
    reportPost: (postId, reason) => axiosClient.post(`/community/${postId}/report`, { reason }),
    getMyPosts: () => axiosClient.get('/community/me/posts'),
    deletePost: (postId) => axiosClient.delete(`/community/posts/${postId}`),
    previewFile: (url) => axiosClient.post('/community/posts/preview', { url }),
    previewFileByChunks: (file_id) => axiosClient.post('/community/posts/preview-chunks', { file_id })
};
