import api from './api';

// Sprint management services
export const sprintService = {
    // Get all sprints for a project
    getByProject: async (projectId) => {
        const response = await api.get(`/sprints/project/${projectId}`);
        return response.data;
    },

    // Get active sprint for a project
    getActive: async (projectId) => {
        const response = await api.get(`/sprints/project/${projectId}/active`);
        return response.data;
    },

    // Get single sprint by ID
    getById: async (id) => {
        const response = await api.get(`/sprints/${id}`);
        return response.data;
    },

    // Create new sprint
    create: async (sprintData) => {
        const response = await api.post('/sprints', sprintData);
        return response.data;
    },

    // Update sprint
    update: async (id, sprintData) => {
        const response = await api.put(`/sprints/${id}`, sprintData);
        return response.data;
    },

    // Start sprint
    start: async (id) => {
        const response = await api.patch(`/sprints/${id}/start`);
        return response.data;
    },

    // Complete sprint
    complete: async (id) => {
        const response = await api.patch(`/sprints/${id}/complete`);
        return response.data;
    },

    // Delete sprint
    delete: async (id) => {
        const response = await api.delete(`/sprints/${id}`);
        return response.data;
    },
};

export default sprintService;
