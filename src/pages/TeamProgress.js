import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import taskService from '../services/taskService';
import projectService from '../services/projectService';
import './TeamProgress.css';

const getAvatarColor = (name) => {
    const colors = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6'];
    if (!name) return colors[0];
    const idx = name.charCodeAt(0) % colors.length;
    return colors[idx];
};

const statusConfig = {
    todo: { label: 'To Do', color: '#6b7280', bg: 'rgba(107,114,128,0.15)' },
    'in-progress': { label: 'In Progress', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
    review: { label: 'Review', color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)' },
    done: { label: 'Done', color: '#10b981', bg: 'rgba(16,185,129,0.15)' }
};

const TeamProgress = () => {
    const { projectId } = useParams();
    const { user } = useAuth();
    const [progressData, setProgressData] = useState(null);
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState(projectId || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [memberTasks, setMemberTasks] = useState({});
    const [expandedMember, setExpandedMember] = useState(null);
    const [allTasks, setAllTasks] = useState([]);

    const fetchProgress = useCallback(async (pid) => {
        if (!pid) return;
        setLoading(true);
        setError('');
        try {
            const res = await taskService.getTeamProgress(pid);
            setProgressData(res.data);

            // Fetch all tasks for this project
            const tasksRes = await taskService.getByProject(pid);
            setAllTasks(tasksRes.data || []);

            // Group tasks by assignee id
            const grouped = {};
            (tasksRes.data || []).forEach(task => {
                const key = task.assignee?._id || 'unassigned';
                if (!grouped[key]) grouped[key] = [];
                grouped[key].push(task);
            });
            setMemberTasks(grouped);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load team progress');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const res = await projectService.getAll();
                const list = res.data || [];
                setProjects(list);
                if (!selectedProject && list.length > 0) {
                    setSelectedProject(list[0]._id);
                }
            } catch { }
        };
        fetchProjects();
    }, [selectedProject]);

    useEffect(() => {
        if (selectedProject) fetchProgress(selectedProject);
    }, [selectedProject, fetchProgress]);

    const getMemberTasks = (userId) => memberTasks[userId] || [];

    const totalProjectTasks = allTasks.length;
    const completedProjectTasks = allTasks.filter(t => t.status === 'done').length;
    const projectCompletion = totalProjectTasks > 0 ? Math.round((completedProjectTasks / totalProjectTasks) * 100) : 0;

    return (
        <div className="team-progress-page">
            <Navbar />
            <main className="team-progress-main">
                <div className="container">
                    {/* Header */}
                    <div className="tp-header">
                        <div className="tp-header-left">
                            <h1>📊 Team Progress</h1>
                            <p>Track your team members' task completion and workload</p>
                        </div>
                        <div className="tp-header-right">
                            <select
                                className="tp-project-select"
                                value={selectedProject}
                                onChange={(e) => setSelectedProject(e.target.value)}
                            >
                                <option value="">Select Project...</option>
                                {projects.map(p => (
                                    <option key={p._id} value={p._id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {loading && (
                        <div className="tp-loading">
                            <div className="spinner"></div>
                            <p>Loading team progress...</p>
                        </div>
                    )}

                    {error && (
                        <div className="tp-error">
                            <span>⚠️ {error}</span>
                        </div>
                    )}

                    {progressData && !loading && (
                        <>
                            {/* Project Overview Card */}
                            <div className="tp-project-overview">
                                <div className="tp-project-info">
                                    <div className="tp-project-dot" style={{ backgroundColor: progressData.project.color }}></div>
                                    <h2>{progressData.project.name}</h2>
                                </div>
                                <div className="tp-project-stats">
                                    <div className="tp-stat-item">
                                        <span className="tp-stat-num">{totalProjectTasks}</span>
                                        <span className="tp-stat-label">Total Tasks</span>
                                    </div>
                                    <div className="tp-stat-item">
                                        <span className="tp-stat-num" style={{ color: '#10b981' }}>{completedProjectTasks}</span>
                                        <span className="tp-stat-label">Completed</span>
                                    </div>
                                    <div className="tp-stat-item">
                                        <span className="tp-stat-num" style={{ color: '#f59e0b' }}>{allTasks.filter(t => t.status === 'in-progress').length}</span>
                                        <span className="tp-stat-label">In Progress</span>
                                    </div>
                                    <div className="tp-stat-item">
                                        <span className="tp-stat-num" style={{ color: '#6366f1' }}>{progressData.team.length}</span>
                                        <span className="tp-stat-label">Members</span>
                                    </div>
                                </div>
                                <div className="tp-project-progress-bar">
                                    <div className="tp-progress-label">
                                        <span>Overall Completion</span>
                                        <span>{projectCompletion}%</span>
                                    </div>
                                    <div className="tp-progress-track">
                                        <div
                                            className="tp-progress-fill"
                                            style={{ width: `${projectCompletion}%`, backgroundColor: projectCompletion === 100 ? '#10b981' : '#6366f1' }}
                                        ></div>
                                    </div>
                                </div>
                            </div>

                            {/* Team Members Cards */}
                            <div className="tp-members-grid">
                                {progressData.team.map((member) => {
                                    const tasks = getMemberTasks(member.user._id);
                                    const isExpanded = expandedMember === member.user._id;

                                    return (
                                        <div key={member.user._id} className={`tp-member-card ${isExpanded ? 'expanded' : ''}`}>
                                            <div className="tp-member-header">
                                                <div className="tp-member-info">
                                                    {member.user.avatar ? (
                                                        <img src={member.user.avatar} alt={member.user.name} className="tp-avatar" />
                                                    ) : (
                                                        <div
                                                            className="tp-avatar tp-avatar-initial"
                                                            style={{ background: getAvatarColor(member.user.name) }}
                                                        >
                                                            {member.user.name?.charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <h3 className="tp-member-name">
                                                            {member.user.name}
                                                            {member.user._id === user?.id && <span className="tp-you-badge">You</span>}
                                                        </h3>
                                                        <span className={`tp-role-badge tp-role-${member.role}`}>
                                                            {member.role === 'owner' ? '👑 Team Leader' : member.role === 'admin' ? '🛡️ Admin' : '👤 Member'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="tp-member-rate">
                                                    <div className="tp-rate-circle" style={{
                                                        '--rate': member.completionRate,
                                                        '--color': member.completionRate === 100 ? '#10b981' : member.completionRate >= 60 ? '#6366f1' : member.completionRate >= 30 ? '#f59e0b' : '#ef4444'
                                                    }}>
                                                        <span>{member.completionRate}%</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Task status breakdown */}
                                            <div className="tp-member-stats">
                                                {Object.entries(statusConfig).map(([key, cfg]) => (
                                                    <div key={key} className="tp-status-stat">
                                                        <div className="tp-status-dot" style={{ backgroundColor: cfg.color }}></div>
                                                        <span className="tp-status-label">{cfg.label}</span>
                                                        <span className="tp-status-count" style={{ color: cfg.color }}>
                                                            {key === 'in-progress' ? member.inProgress : member[key]}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Progress bar */}
                                            <div className="tp-mini-progress">
                                                {member.total > 0 && (
                                                    <div className="tp-mini-track">
                                                        <div className="tp-mini-todo" style={{ width: `${(member.todo / member.total) * 100}%` }}></div>
                                                        <div className="tp-mini-inprogress" style={{ width: `${(member.inProgress / member.total) * 100}%` }}></div>
                                                        <div className="tp-mini-review" style={{ width: `${(member.review / member.total) * 100}%` }}></div>
                                                        <div className="tp-mini-done" style={{ width: `${(member.done / member.total) * 100}%` }}></div>
                                                    </div>
                                                )}
                                                <div className="tp-total-tasks">
                                                    {member.total} task{member.total !== 1 ? 's' : ''} total
                                                </div>
                                            </div>

                                            {/* Task list toggle */}
                                            {tasks.length > 0 && (
                                                <button
                                                    className="tp-expand-btn"
                                                    onClick={() => setExpandedMember(isExpanded ? null : member.user._id)}
                                                >
                                                    {isExpanded ? '▲ Hide Tasks' : `▼ See ${tasks.length} Task${tasks.length !== 1 ? 's' : ''}`}
                                                </button>
                                            )}

                                            {isExpanded && (
                                                <div className="tp-task-list">
                                                    {tasks.map(task => {
                                                        const sc = statusConfig[task.status] || statusConfig.todo;
                                                        return (
                                                            <div key={task._id} className="tp-task-item">
                                                                <span
                                                                    className="tp-task-status-dot"
                                                                    style={{ backgroundColor: sc.color }}
                                                                ></span>
                                                                <span className="tp-task-title">{task.title}</span>
                                                                <span
                                                                    className="tp-task-status-label"
                                                                    style={{ color: sc.color, background: sc.bg }}
                                                                >
                                                                    {sc.label}
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}

                                {/* Unassigned tasks */}
                                {progressData.unassigned?.total > 0 && (
                                    <div className="tp-member-card tp-unassigned-card">
                                        <div className="tp-member-header">
                                            <div className="tp-member-info">
                                                <div className="tp-avatar tp-avatar-initial" style={{ background: '#6b7280' }}>?</div>
                                                <div>
                                                    <h3 className="tp-member-name">Unassigned</h3>
                                                    <span className="tp-role-badge" style={{ color: '#6b7280', background: 'rgba(107,114,128,0.15)' }}>⚠️ No Assignee</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="tp-member-stats">
                                            {Object.entries(statusConfig).map(([key, cfg]) => (
                                                <div key={key} className="tp-status-stat">
                                                    <div className="tp-status-dot" style={{ backgroundColor: cfg.color }}></div>
                                                    <span className="tp-status-label">{cfg.label}</span>
                                                    <span className="tp-status-count" style={{ color: cfg.color }}>
                                                        {key === 'in-progress' ? progressData.unassigned.inProgress : progressData.unassigned[key]}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {progressData.team.length === 0 && (
                                <div className="tp-empty">
                                    <div className="tp-empty-icon">👥</div>
                                    <h3>No team members yet</h3>
                                    <p>Invite team members to this project to track their progress.</p>
                                </div>
                            )}
                        </>
                    )}

                    {!selectedProject && !loading && (
                        <div className="tp-empty">
                            <div className="tp-empty-icon">📊</div>
                            <h3>Select a project to view team progress</h3>
                            <p>Choose a project from the dropdown above to see member task statistics.</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default TeamProgress;
