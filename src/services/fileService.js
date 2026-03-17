import api from './api';

// File upload services
export const fileService = {
    // Upload file
    upload: async (file, projectId = null) => {
        const formData = new FormData();
        formData.append('file', file);
        if (projectId) {
            formData.append('projectId', projectId);
        }

        const response = await api.post('/files/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    // Get all files
    getAll: async (projectId = null) => {
        const url = projectId ? `/files?projectId=${projectId}` : '/files';
        const response = await api.get(url);
        return response.data;
    },

    // Get file by ID
    getById: async (id) => {
        const response = await api.get(`/files/${id}`);
        return response.data;
    },

    // Download file
    download: async (id) => {
        const response = await api.get(`/files/${id}/download`, {
            responseType: 'blob',
        });
        return response.data;
    },

    // Delete file
    delete: async (id) => {
        const response = await api.delete(`/files/${id}`);
        return response.data;
    },
};

export default fileService;
