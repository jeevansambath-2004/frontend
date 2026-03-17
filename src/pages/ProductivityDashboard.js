import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import productivityService from '../services/productivityService';
import ActivityCalendar from '../components/ActivityCalendar';
import './ProductivityDashboard.css';

const ProductivityDashboard = () => {
    const [leaderboard, setLeaderboard] = useState([]);
    const [activityData, setActivityData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();

        // Setup polling to automatically update the dashboard
        const intervalId = setInterval(() => {
            fetchData(false); // pass false to avoid loading spinner flash
        }, 15000); // 15 seconds

        return () => clearInterval(intervalId);
    }, []);

    const fetchData = async (showLoader = true) => {
        try {
            if (showLoader) setLoading(true);
            const [leaderboardRes, activityRes] = await Promise.all([
                productivityService.getLeaderboard(),
                productivityService.getUserActivity('', 'all')
            ]);
            setLeaderboard(leaderboardRes.data.data || []);
            setActivityData(activityRes.data.data || []);
        } catch (error) {
            console.error('Error fetching productivity data:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page productivity-dashboard">
            <Navbar />
            <main className="page-main dashboard-main">
                <div className="container">
                    <div className="page-header">
                        <div>
                            <h1>Productivity Dashboard</h1>
                            <p className="text-secondary">Track performance and activity across the team.</p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="loading-container">
                            <div className="spinner"></div>
                            <p>Loading productivity data...</p>
                        </div>
                    ) : (
                        <div className="productivity-grid">

                            <div className="dashboard-card leaderboard-card fade-in">
                                <div className="card-header">
                                    <h2>Top Performers</h2>
                                    <div className="badge-icon">🏆</div>
                                </div>
                                <div className="leaderboard-list">
                                    {leaderboard.length === 0 ? (
                                        <div className="empty-state">No tasks completed yet.</div>
                                    ) : (
                                        <table className="leaderboard-table">
                                            <thead>
                                                <tr>
                                                    <th>Rank</th>
                                                    <th>Employee</th>
                                                    <th>Tasks</th>
                                                    <th>Story Points</th>
                                                    <th>Last Active</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {leaderboard.map((user, index) => (
                                                    <tr key={index} className="leaderboard-item">
                                                        <td>
                                                            <span className={`rank-badge rank-${user.rank}`}>{user.rank}</span>
                                                        </td>
                                                        <td>
                                                            <div className="user-info">
                                                                {user.user?.avatar ? (
                                                                    <img src={user.user.avatar} alt="avatar" className="avatar-img" />
                                                                ) : (
                                                                    <div className="avatar-placeholder">
                                                                        {user.user?.name ? user.user.name.charAt(0).toUpperCase() : 'U'}
                                                                    </div>
                                                                )}
                                                                <span className="user-name">{user.user?.name || 'Unknown User'}</span>
                                                            </div>
                                                        </td>
                                                        <td>{user.tasksCompleted}</td>
                                                        <td className="points-col">{user.points}</td>
                                                        <td>
                                                            {user.lastActiveDate ? new Date(user.lastActiveDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '-'}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </div>

                            <div className="dashboard-card calendar-card fade-in">
                                <div className="card-header">
                                    <h2>Your Activity Heatmap</h2>
                                    <div className="badge-icon">📅</div>
                                </div>
                                <ActivityCalendar data={activityData} />
                            </div>

                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default ProductivityDashboard;
