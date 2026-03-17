import api from './api';

// Task management services
export const taskService = {
    // Get all tasks
    getAll: async (filters = {}) => {
        const params = new URLSearchParams(filters).toString();
        const response = await api.get(`/tasks?${params}`);
        return response.data;
    },

    // Get tasks by project
    getByProject: async (projectId) => {
        const response = await api.get(`/tasks/project/${projectId}`);
        return response.data;
    },

    // Get single task by ID
    getById: async (id) => {
        const response = await api.get(`/tasks/${id}`);
        return response.data;
    },

    // Create new task
    create: async (taskData) => {
        const response = await api.post('/tasks', taskData);
        return response.data;
    },

    // Update task
    update: async (id, taskData) => {
        const response = await api.put(`/tasks/${id}`, taskData);
        return response.data;
    },

    // Update task status
    updateStatus: async (id, status) => {
        const response = await api.patch(`/tasks/${id}/status`, { status });
        return response.data;
    },

    // Delete task
    delete: async (id) => {
        const response = await api.delete(`/tasks/${id}`);
        return response.data;
    },

    // Assign task to user
    assign: async (taskId, userId) => {
        const response = await api.patch(`/tasks/${taskId}/assign`, { userId });
        return response.data;
    },

    // Reorder tasks (for drag and drop)
    reorder: async (updates) => {
        const response = await api.patch('/tasks/reorder', { updates });
        return response.data;
    },

    // Get backlog tasks (tasks without a sprint)
    getBacklog: async (projectId) => {
        const response = await api.get(`/tasks/backlog/${projectId}`);
        return response.data;
    },

    // Get tasks by sprint
    getBySprint: async (sprintId) => {
        const response = await api.get(`/tasks/sprint/${sprintId}`);
        return response.data;
    },

    // Assign task to sprint
    assignToSprint: async (taskId, sprintId) => {
        const response = await api.patch(`/tasks/${taskId}/sprint`, { sprintId });
        return response.data;
    },

    // Get team progress for a project (admin/owner only)
    getTeamProgress: async (projectId) => {
        const response = await api.get(`/tasks/team-progress/${projectId}`);
        return response.data;
    },
};

export default taskService;

