import api from './api';

// User management services
export const userService = {
    // Get all users
    getAll: async () => {
        const response = await api.get('/users');
        return response.data;
    },

    // Get single user by ID
    getById: async (id) => {
        const response = await api.get(`/users/${id}`);
        return response.data;
    },

    // Search users by name or email
    search: async (query) => {
        const response = await api.get(`/users/search?q=${encodeURIComponent(query)}`);
        return response.data;
    },
};

export default userService;
