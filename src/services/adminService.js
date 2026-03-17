import api from './api';

// Admin panel services
export const adminService = {
    // Get dashboard stats
    getStats: async () => {
        const response = await api.get('/admin/stats');
        return response.data;
    },

    // Get all users
    getUsers: async (params = {}) => {
        const queryParams = new URLSearchParams(params).toString();
        const response = await api.get(`/admin/users?${queryParams}`);
        return response.data;
    },

    // Update user role
    updateUserRole: async (userId, role) => {
        const response = await api.put(`/admin/users/${userId}/role`, { role });
        return response.data;
    },

    // Delete user
    deleteUser: async (userId) => {
        const response = await api.delete(`/admin/users/${userId}`);
        return response.data;
    },

    // Get all projects
    getProjects: async (params = {}) => {
        const queryParams = new URLSearchParams(params).toString();
        const response = await api.get(`/admin/projects?${queryParams}`);
        return response.data;
    },

    // Delete project
    deleteProject: async (projectId) => {
        const response = await api.delete(`/admin/projects/${projectId}`);
        return response.data;
    },
};

export default adminService;
