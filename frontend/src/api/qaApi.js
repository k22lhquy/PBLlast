import axiosClient from './axiosClient';

export const qaApi = {
    // Questions
    getQuestions: () => axiosClient.get('/qa/questions'),
    getQuestion: (id) => axiosClient.get(`/qa/questions/${id}`),
    createQuestion: (body, tags) => axiosClient.post('/qa/questions', { body, tags }),
    getMyQuestions: () => axiosClient.get('/qa/me/questions'),
    deleteQuestion: (questionId) => axiosClient.delete(`/qa/questions/${questionId}`),
    reportQuestion: (questionId, reason) => axiosClient.post(`/qa/questions/${questionId}/report`, { reason }),

    // Answers
    getAnswers: (questionId) => axiosClient.get(`/qa/questions/${questionId}/answers`),
    createAnswer: (questionId, formData) => axiosClient.post(`/qa/questions/${questionId}/answers`, formData),
    likeAnswer: (answerId) => axiosClient.post(`/qa/answers/${answerId}/like`),
};
