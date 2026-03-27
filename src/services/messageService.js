import api from './api';

// Message services
export const messageService = {
    // Get all conversations
    getConversations: async () => {
        const response = await api.get('/messages/conversations');
        return response.data;
    },

    // Get messages in a conversation
    getMessages: async (conversationId) => {
        const response = await api.get(`/messages/${conversationId}`);
        return response.data;
    },

    // Send a message
    send: async (conversationId, content, attachment = null, poll = null) => {
        const response = await api.post(`/messages/${conversationId}`, { content, attachment, poll });
        return response.data;
    },

    // Start new conversation
    startConversation: async (recipientId, content, attachment = null, poll = null) => {
        const response = await api.post('/messages/new', { recipientId, content, attachment, poll });
        return response.data;
    },

    // Get or create project conversation
    getProjectConversation: async (projectId) => {
        const response = await api.post(`/messages/project/${projectId}`);
        return response.data;
    },

    // Mark messages as read
    markAsRead: async (conversationId) => {
        const response = await api.patch(`/messages/${conversationId}/read`);
        return response.data;
    },

    // Delete message
    delete: async (messageId) => {
        const response = await api.delete(`/messages/${messageId}`);
        return response.data;
    },

    // Vote in poll
    votePoll: async (messageId, optionId) => {
        const response = await api.post(`/messages/${messageId}/vote`, { optionId });
        return response.data;
    },

    // Toggle message reaction
    reactToMessage: async (messageId, emoji) => {
        const response = await api.post(`/messages/${messageId}/react`, { emoji });
        return response.data;
    },
};

export default messageService;
