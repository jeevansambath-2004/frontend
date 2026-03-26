import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import productivityService from '../services/productivityService';
import ActivityCalendar from '../components/ActivityCalendar';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './ProductivityDashboard.css';

const ProductivityDashboard = () => {
    const [leaderboard, setLeaderboard] = useState([]);
    const [activityData, setActivityData] = useState([]);
    const [loading, setLoading] = useState(true);

    const todayStr = new Date().toISOString().split('T')[0];
    const defaultEnd = new Date();
    defaultEnd.setDate(defaultEnd.getDate() + 30);
    const defaultEndStr = defaultEnd.toISOString().split('T')[0];

    const [startDate, setStartDate] = useState(todayStr);
    const [endDate, setEndDate] = useState(defaultEndStr);

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

    const generatePDF = () => {
        const doc = new jsPDF();
        
        doc.setFontSize(20);
        doc.text('Productivity Progress Report', 14, 22);
        
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
        
        const totalTasks = leaderboard.reduce((sum, u) => sum + u.tasksCompleted, 0);
        const totalPoints = leaderboard.reduce((sum, u) => sum + u.points, 0);
        const activeMembers = leaderboard.length;

        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.text('Team Progress Summary', 14, 45);

        doc.setFontSize(12);
        doc.text(`Total Tasks Done: ${totalTasks}`, 14, 55);
        doc.text(`Total SP Earned: ${totalPoints}`, 14, 62);
        doc.text(`Active Members: ${activeMembers}`, 14, 69);

        const tableColumn = ["Rank", "Employee", "Tasks Completed", "Story Points", "Last Active"];
        const tableRows = [];

        leaderboard.forEach(user => {
            const userData = [
                user.rank,
                user.user?.name || 'Unknown User',
                user.tasksCompleted,
                user.points,
                user.lastActiveDate ? new Date(user.lastActiveDate).toLocaleDateString() : '-'
            ];
            tableRows.push(userData);
        });

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 80,
            theme: 'grid',
            headStyles: { fillColor: [99, 102, 241] }
        });

        doc.save(`Productivity_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    return (
        <div className="page productivity-dashboard">
            <Navbar />
            <main className="page-main dashboard-main">
                <div className="container">
                    <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h1>Productivity Dashboard</h1>
                            <p className="text-secondary">Track performance and activity across the team.</p>
                        </div>
                        <button className="btn btn-primary" onClick={generatePDF}>
                            📄 Generate Progress Report PDF
                        </button>
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

                            {/* Team Progress Card */}
                            <div className="dashboard-card progress-card fade-in">
                                <div className="card-header">
                                    <h2>Team Progress</h2>
                                    <div className="badge-icon">📊</div>
                                </div>
                                {leaderboard.length === 0 ? (
                                    <div className="empty-state">No progress data yet.</div>
                                ) : (
                                    <div className="team-progress-content">
                                        {/* Overall Stats Summary */}
                                        <div className="progress-stats-row">
                                            <div className="progress-stat-box">
                                                <span className="progress-stat-value">{leaderboard.reduce((sum, u) => sum + u.tasksCompleted, 0)}</span>
                                                <span className="progress-stat-label">Total Tasks Done</span>
                                            </div>
                                            <div className="progress-stat-box">
                                                <span className="progress-stat-value" style={{ color: '#10b981' }}>{leaderboard.reduce((sum, u) => sum + u.points, 0)}</span>
                                                <span className="progress-stat-label">Total SP Earned</span>
                                            </div>
                                            <div className="progress-stat-box">
                                                <span className="progress-stat-value" style={{ color: '#6366f1' }}>{leaderboard.length}</span>
                                                <span className="progress-stat-label">Active Members</span>
                                            </div>
                                        </div>

                                        {/* Per-member progress bars */}
                                        <div className="member-progress-list">
                                            {(() => {
                                                const maxPoints = Math.max(...leaderboard.map(u => u.points), 1);
                                                return leaderboard.map((member, idx) => {
                                                    const pct = Math.round((member.points / maxPoints) * 100);
                                                    return (
                                                        <div key={idx} className="member-progress-row">
                                                            <div className="member-progress-info">
                                                                {member.user?.avatar ? (
                                                                    <img src={member.user.avatar} alt={member.user.name} className="mp-row-avatar" />
                                                                ) : (
                                                                    <div className="mp-row-avatar mp-row-avatar-init">
                                                                        {member.user?.name?.charAt(0).toUpperCase() || 'U'}
                                                                    </div>
                                                                )}
                                                                <span className="mp-row-name">{member.user?.name || 'Unknown'}</span>
                                                            </div>
                                                            <div className="member-progress-bar-wrapper">
                                                                <div className="member-progress-track">
                                                                    <div
                                                                        className="member-progress-fill"
                                                                        style={{
                                                                            width: `${pct}%`,
                                                                            background: idx === 0 ? 'linear-gradient(90deg, #f59e0b, #fbbf24)' :
                                                                                idx === 1 ? 'linear-gradient(90deg, #94a3b8, #cbd5e1)' :
                                                                                    idx === 2 ? 'linear-gradient(90deg, #ea580c, #fb923c)' :
                                                                                        'linear-gradient(90deg, #6366f1, #818cf8)'
                                                                        }}
                                                                    ></div>
                                                                </div>
                                                                <span className="member-progress-pct">{pct}%</span>
                                                            </div>
                                                            <div className="member-progress-stats">
                                                                <span className="mp-tasks">{member.tasksCompleted} tasks</span>
                                                                <span className="mp-points">{member.points} SP</span>
                                                            </div>
                                                        </div>
                                                    );
                                                });
                                            })()}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="dashboard-card calendar-card fade-in">
                                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <h2>Your Activity Heatmap</h2>
                                        <div className="badge-icon" style={{ marginLeft: '4px' }}>📅</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>From:</span>
                                        <input 
                                            type="date" 
                                            className="input" 
                                            value={startDate} 
                                            onChange={(e) => setStartDate(e.target.value)} 
                                            style={{ padding: '6px 10px', fontSize: '13px', minHeight: '32px' }}
                                        />
                                        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>To:</span>
                                        <input 
                                            type="date" 
                                            className="input" 
                                            value={endDate} 
                                            onChange={(e) => setEndDate(e.target.value)} 
                                            min={startDate}
                                            style={{ padding: '6px 10px', fontSize: '13px', minHeight: '32px' }}
                                        />
                                    </div>
                                </div>
                                <ActivityCalendar data={activityData} targetStartDate={startDate} targetEndDate={endDate} />
                            </div>

                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default ProductivityDashboard;
