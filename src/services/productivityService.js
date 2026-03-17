import axios from 'axios';

const API_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5000/api') + '/productivity/';

const getLeaderboard = () => {
    return axios.get(API_URL + 'leaderboard', {
        headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
        }
    });
};

const getUserActivity = (userId = '', scope = '') => {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (scope) params.append('scope', scope);
    const queryString = params.toString();
    return axios.get(API_URL + 'activity' + (queryString ? `?${queryString}` : ''), {
        headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
        }
    });
};

const productivityService = {
    getLeaderboard,
    getUserActivity,
};

export default productivityService;
