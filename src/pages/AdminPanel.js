import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import adminService from '../services/adminService';
import projectService from '../services/projectService';
import ActivityCalendar from '../components/ActivityCalendar';
import './AdminPanel.css';
import './ProductivityDashboard.css'; // Reuse some dashboard styles for the heatmap card

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6'];

const AdminPanel = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);
    const [confirmModal, setConfirmModal] = useState(null);

    // Manage Members State
    const [showManageMembers, setShowManageMembers] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);
    const [membersLoading, setMembersLoading] = useState(false);

    // Users tab state
    const [userSearch, setUserSearch] = useState('');
    const [userRoleFilter, setUserRoleFilter] = useState('');
    const [userPage, setUserPage] = useState(1);
    const [userPagination, setUserPagination] = useState(null);

    // Projects tab state
    const [projectSearch, setProjectSearch] = useState('');
    const [projectStatusFilter, setProjectStatusFilter] = useState('');
    const [projectPage, setProjectPage] = useState(1);
    const [projectPagination, setProjectPagination] = useState(null);

    // Create project state (admin only)
    const [showCreateProject, setShowCreateProject] = useState(false);
    const [creatingProject, setCreatingProject] = useState(false);
    const [createProjectForm, setCreateProjectForm] = useState({
        name: '', description: '', status: 'planning', priority: 'medium', color: '#6366f1', boardType: 'kanban', startDate: new Date().toISOString().split('T')[0], endDate: ''
    });
    const PROJECT_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#14b8a6'];

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchStats = useCallback(async () => {
        try {
            const res = await adminService.getStats();
            setStats(res.data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    }, []);

    const fetchUsers = useCallback(async () => {
        try {
            const res = await adminService.getUsers({
                page: userPage,
                limit: 15,
                search: userSearch,
                role: userRoleFilter
            });
            setUsers(res.data);
            setUserPagination(res.pagination);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    }, [userPage, userSearch, userRoleFilter]);

    const fetchProjects = useCallback(async () => {
        try {
            const res = await adminService.getProjects({
                page: projectPage,
                limit: 15,
                search: projectSearch,
                status: projectStatusFilter
            });
            setProjects(res.data);
            setProjectPagination(res.pagination);
        } catch (error) {
            console.error('Error fetching projects:', error);
        }
    }, [projectPage, projectSearch, projectStatusFilter]);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            await fetchStats();
            setLoading(false);
        };
        loadData();
    }, [fetchStats]);

    useEffect(() => {
        if (activeTab === 'users') fetchUsers();
    }, [activeTab, fetchUsers]);

    useEffect(() => {
        if (activeTab === 'projects') fetchProjects();
    }, [activeTab, fetchProjects]);

    // Debounced search for users
    useEffect(() => {
        const timer = setTimeout(() => {
            if (activeTab === 'users') {
                setUserPage(1);
                fetchUsers();
            }
        }, 400);
        return () => clearTimeout(timer);
    }, [userSearch, userRoleFilter]); // eslint-disable-line

    // Debounced search for projects
    useEffect(() => {
        const timer = setTimeout(() => {
            if (activeTab === 'projects') {
                setProjectPage(1);
                fetchProjects();
            }
        }, 400);
        return () => clearTimeout(timer);
    }, [projectSearch, projectStatusFilter]); // eslint-disable-line

    const handleUpdateRole = async (userId, newRole) => {
        try {
            await adminService.updateUserRole(userId, newRole);
            showToast(`User role updated to ${newRole}`);
            fetchUsers();
            fetchStats();
        } catch (error) {
            showToast(error.response?.data?.message || 'Failed to update role', 'error');
        }
    };

    const handleDeleteUser = (userId, userName) => {
        setConfirmModal({
            title: 'Delete User',
            message: `Are you sure you want to delete "${userName}"? This will also remove them from all projects and delete projects they own. This action cannot be undone.`,
            onConfirm: async () => {
                try {
                    await adminService.deleteUser(userId);
                    showToast('User deleted successfully');
                    setConfirmModal(null);
                    fetchUsers();
                    fetchStats();
                } catch (error) {
                    showToast(error.response?.data?.message || 'Failed to delete user', 'error');
                    setConfirmModal(null);
                }
            }
        });
    };

    const handleDeleteProject = (projectId, projectName) => {
        setConfirmModal({
            title: 'Delete Project',
            message: `Are you sure you want to delete "${projectName}"? All tasks in this project will also be deleted. This action cannot be undone.`,
            onConfirm: async () => {
                try {
                    await adminService.deleteProject(projectId);
                    showToast('Project deleted successfully');
                    setConfirmModal(null);
                    fetchProjects();
                    fetchStats();
                } catch (error) {
                    showToast(error.response?.data?.message || 'Failed to delete project', 'error');
                    setConfirmModal(null);
                }
            }
        });
    };

    const handleCreateProject = async (e) => {
        e.preventDefault();
        try {
            setCreatingProject(true);
            await projectService.create(createProjectForm);
            showToast('Project created successfully! You are now the Team Leader.');
            setShowCreateProject(false);
            setCreateProjectForm({ name: '', description: '', status: 'planning', priority: 'medium', color: '#6366f1', boardType: 'kanban', startDate: new Date().toISOString().split('T')[0], endDate: '' });
            fetchProjects();
            fetchStats();
        } catch (error) {
            showToast(error.response?.data?.message || 'Failed to create project', 'error');
        } finally {
            setCreatingProject(false);
        }
    };

    const openManageMembers = (project) => {
        setSelectedProject(project);
        setShowManageMembers(true);
    };

    const handleRemoveMemberFromProject = async (projectId, userId) => {
        if (!window.confirm('Are you sure you want to remove this member from the project?')) return;
        try {
            setMembersLoading(true);
            await projectService.removeMember(projectId, userId);

            // Update selected project locally
            setSelectedProject(prev => ({
                ...prev,
                members: prev.members.filter(m => m.user?._id !== userId)
            }));

            showToast('Member removed successfully');
            fetchProjects();
        } catch (error) {
            console.error('Error removing member:', error);
            showToast(error.response?.data?.message || 'Failed to remove member', 'error');
        } finally {
            setMembersLoading(false);
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const getAvatarColor = (name) => {
        let hash = 0;
        for (let i = 0; i < (name || '').length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return COLORS[Math.abs(hash) % COLORS.length];
    };

    const getStatusBarColor = (status) => {
        const map = {
            'planning': 'bar-primary',
            'active': 'bar-success',
            'on-hold': 'bar-warning',
            'completed': 'bar-info',
            'cancelled': 'bar-error',
            'todo': 'bar-muted',
            'in-progress': 'bar-primary',
            'review': 'bar-warning',
            'done': 'bar-success'
        };
        return map[status] || 'bar-muted';
    };

    const renderOverview = () => {
        if (!stats) return null;

        const tasksByStatusMap = {};
        stats.tasksByStatus.forEach(t => { tasksByStatusMap[t._id] = t.count; });
        const maxTaskCount = Math.max(...stats.tasksByStatus.map(t => t.count), 1);
        const totalTasks = stats.tasksByStatus.reduce((sum, t) => sum + t.count, 0);

        const projectsByStatusMap = {};
        stats.projectsByStatus.forEach(p => { projectsByStatusMap[p._id] = p.count; });
        const maxProjectCount = Math.max(...stats.projectsByStatus.map(p => p.count), 1);
        const totalProjects = stats.projectsByStatus.reduce((sum, p) => sum + p.count, 0);

        return (
            <>
                <div className="admin-overview-grid">
                    {/* Task Distribution */}
                    <div className="admin-overview-card">
                        <div className="admin-overview-card-header">
                            <h3>📊 Tasks by Status</h3>
                        </div>
                        <div className="admin-chart-bars">
                            {stats.tasksByStatus.length === 0 ? (
                                <div className="admin-empty">
                                    <p>No tasks yet</p>
                                </div>
                            ) : (
                                stats.tasksByStatus.map(item => (
                                    <div key={item._id} className="admin-chart-bar">
                                        <span className="admin-chart-bar-label">{item._id || 'Unknown'}</span>
                                        <div className="admin-chart-bar-track">
                                            <div
                                                className={`admin-chart-bar-fill ${getStatusBarColor(item._id)}`}
                                                style={{ width: `${(item.count / maxTaskCount) * 100}%` }}
                                            >
                                                {item.count}
                                            </div>
                                        </div>
                                        <span className="admin-chart-bar-percent">{totalTasks > 0 ? Math.round((item.count / totalTasks) * 100) : 0}%</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Project Distribution */}
                    <div className="admin-overview-card">
                        <div className="admin-overview-card-header">
                            <h3>📁 Projects by Status</h3>
                        </div>
                        <div className="admin-chart-bars">
                            {stats.projectsByStatus.length === 0 ? (
                                <div className="admin-empty">
                                    <p>No projects yet</p>
                                </div>
                            ) : (
                                stats.projectsByStatus.map(item => (
                                    <div key={item._id} className="admin-chart-bar">
                                        <span className="admin-chart-bar-label">{item._id || 'Unknown'}</span>
                                        <div className="admin-chart-bar-track">
                                            <div
                                                className={`admin-chart-bar-fill ${getStatusBarColor(item._id)}`}
                                                style={{ width: `${(item.count / maxProjectCount) * 100}%` }}
                                            >
                                                {item.count}
                                            </div>
                                        </div>
                                        <span className="admin-chart-bar-percent">{totalProjects > 0 ? Math.round((item.count / totalProjects) * 100) : 0}%</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Recent Users */}
                    <div className="admin-overview-card">
                        <div className="admin-overview-card-header">
                            <h3>👥 Recent Users</h3>
                        </div>
                        <div className="admin-recent-list">
                            {stats.recentUsers.length === 0 ? (
                                <div className="admin-empty">
                                    <p>No users yet</p>
                                </div>
                            ) : (
                                stats.recentUsers.map(u => (
                                    <div key={u._id} className="admin-recent-item">
                                        <div
                                            className="admin-recent-avatar"
                                            style={{ background: getAvatarColor(u.name) }}
                                        >
                                            {u.avatar ? (
                                                <img src={u.avatar} alt={u.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                                            ) : (
                                                u.name?.charAt(0).toUpperCase()
                                            )}
                                        </div>
                                        <div className="admin-recent-info">
                                            <h4>{u.name}</h4>
                                            <p>{u.email}</p>
                                        </div>
                                        <span className="admin-recent-meta">
                                            {formatDate(u.createdAt)}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Recent Projects */}
                    <div className="admin-overview-card">
                        <div className="admin-overview-card-header">
                            <h3>🚀 Recent Projects</h3>
                        </div>
                        <div className="admin-recent-list">
                            {stats.recentProjects.length === 0 ? (
                                <div className="admin-empty">
                                    <p>No projects yet</p>
                                </div>
                            ) : (
                                stats.recentProjects.map(p => (
                                    <div key={p._id} className="admin-recent-item">
                                        <div
                                            className="project-color-dot"
                                            style={{ backgroundColor: p.color || '#6366f1', width: 12, height: 12 }}
                                        />
                                        <div className="admin-recent-info">
                                            <h4>{p.name}</h4>
                                            <p>by {p.owner?.name || 'Unknown'} • {p.members?.length || 0} members</p>
                                        </div>
                                        <span className={`status-badge status-${p.status}`}>{p.status}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* System Activity Heatmap */}
                    <div className="dashboard-card calendar-card fade-in" style={{ gridColumn: '1 / -1', marginTop: '24px' }}>
                        <div className="card-header">
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>System Activity Heatmap</h2>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Overview of task completion across the entire platform</p>
                            </div>
                            <div className="badge-icon">📅</div>
                        </div>
                        <div style={{ padding: '20px 0' }}>
                            <ActivityCalendar data={stats.systemActivity || []} daysToRender={365} />
                        </div>
                    </div>
                </div>
            </>
        );
    };

    const renderUsersTable = () => (
        <div className="admin-section">
            <div className="admin-section-header">
                <h2>👥 User Management</h2>
                <div className="admin-section-actions">
                    <div className="admin-search">
                        <span className="admin-search-icon">🔍</span>
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={userSearch}
                            onChange={(e) => setUserSearch(e.target.value)}
                        />
                    </div>
                    <div className="admin-filter">
                        <select
                            value={userRoleFilter}
                            onChange={(e) => setUserRoleFilter(e.target.value)}
                        >
                            <option value="">All Roles</option>
                            <option value="user">Users</option>
                            <option value="admin">Admins</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="admin-table-wrapper">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Role</th>
                            <th>Provider</th>
                            <th>Joined</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.length === 0 ? (
                            <tr>
                                <td colSpan="5">
                                    <div className="admin-empty">
                                        <div className="empty-icon">👥</div>
                                        <p>No users found</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            users.map(u => (
                                <tr key={u._id}>
                                    <td>
                                        <div className="user-cell">
                                            <div className="user-cell-avatar" style={{ background: u.avatar ? 'transparent' : getAvatarColor(u.name) }}>
                                                {u.avatar ? (
                                                    <img src={u.avatar} alt={u.name} />
                                                ) : (
                                                    u.name?.charAt(0).toUpperCase()
                                                )}
                                            </div>
                                            <div>
                                                <div className="user-cell-name">{u.name}</div>
                                                <div className="user-cell-email">{u.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`role-badge role-${u.role}`}>
                                            {u.role === 'admin' ? '⚡' : '👤'} {u.role}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`provider-badge provider-${u.authProvider}`}>
                                            {u.authProvider === 'google' ? '🔵' : '🟢'} {u.authProvider}
                                        </span>
                                    </td>
                                    <td style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                                        {formatDate(u.createdAt)}
                                    </td>
                                    <td>
                                        {u._id !== user?.id ? (
                                            <div className="admin-actions">
                                                {u.role === 'user' ? (
                                                    <button
                                                        className="admin-action-btn promote-btn"
                                                        title="Promote to Admin"
                                                        onClick={() => handleUpdateRole(u._id, 'admin')}
                                                    >
                                                        ⬆️
                                                    </button>
                                                ) : (
                                                    <button
                                                        className="admin-action-btn demote-btn"
                                                        title="Demote to User"
                                                        onClick={() => handleUpdateRole(u._id, 'user')}
                                                    >
                                                        ⬇️
                                                    </button>
                                                )}
                                                <button
                                                    className="admin-action-btn delete-btn"
                                                    title="Delete User"
                                                    onClick={() => handleDeleteUser(u._id, u.name)}
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        ) : (
                                            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                                                (You)
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {userPagination && userPagination.pages > 1 && (
                <div className="admin-pagination">
                    <span className="pagination-info">
                        Showing {((userPagination.page - 1) * userPagination.limit) + 1} to{' '}
                        {Math.min(userPagination.page * userPagination.limit, userPagination.total)} of{' '}
                        {userPagination.total} users
                    </span>
                    <div className="pagination-buttons">
                        <button
                            className="pagination-btn"
                            disabled={userPagination.page <= 1}
                            onClick={() => setUserPage(p => p - 1)}
                        >
                            ← Prev
                        </button>
                        {Array.from({ length: Math.min(userPagination.pages, 5) }, (_, i) => {
                            const page = i + 1;
                            return (
                                <button
                                    key={page}
                                    className={`pagination-btn ${page === userPagination.page ? 'active' : ''}`}
                                    onClick={() => setUserPage(page)}
                                >
                                    {page}
                                </button>
                            );
                        })}
                        <button
                            className="pagination-btn"
                            disabled={userPagination.page >= userPagination.pages}
                            onClick={() => setUserPage(p => p + 1)}
                        >
                            Next →
                        </button>
                    </div>
                </div>
            )}
        </div>
    );

    const renderProjectsTable = () => {
        return (
            <>
                <div className="admin-section">
                    <div className="admin-section-header">
                        <h2>📁 Project Management</h2>
                        <div className="admin-section-actions">
                            <button
                                className="btn btn-primary btn-sm"
                                onClick={() => setShowCreateProject(true)}
                                style={{ marginRight: '12px' }}
                            >
                                + Create Project
                            </button>
                            <div className="admin-search">
                                <span className="admin-search-icon">🔍</span>
                                <input
                                    type="text"
                                    placeholder="Search projects..."
                                    value={projectSearch}
                                    onChange={(e) => setProjectSearch(e.target.value)}
                                />
                            </div>
                            <div className="admin-filter">
                                <select
                                    value={projectStatusFilter}
                                    onChange={(e) => setProjectStatusFilter(e.target.value)}
                                >
                                    <option value="">All Status</option>
                                    <option value="planning">Planning</option>
                                    <option value="active">Active</option>
                                    <option value="on-hold">On Hold</option>
                                    <option value="completed">Completed</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="admin-table-wrapper">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Project</th>
                                    <th>Owner</th>
                                    <th>Status</th>
                                    <th>Priority</th>
                                    <th>Members</th>
                                    <th>Created</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {projects.length === 0 ? (
                                    <tr>
                                        <td colSpan="7">
                                            <div className="admin-empty">
                                                <div className="empty-icon">📁</div>
                                                <p>No projects found</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    projects.map(p => (
                                        <tr key={p._id}>
                                            <td>
                                                <div className="project-name-cell">
                                                    <div
                                                        className="project-color-dot"
                                                        style={{ backgroundColor: p.color || '#6366f1' }}
                                                    />
                                                    <span>{p.name}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="user-cell">
                                                    <div
                                                        className="user-cell-avatar"
                                                        style={{
                                                            background: p.owner?.avatar ? 'transparent' : getAvatarColor(p.owner?.name),
                                                            width: 28,
                                                            height: 28,
                                                            fontSize: '11px'
                                                        }}
                                                    >
                                                        {p.owner?.avatar ? (
                                                            <img src={p.owner.avatar} alt={p.owner.name} />
                                                        ) : (
                                                            p.owner?.name?.charAt(0).toUpperCase()
                                                        )}
                                                    </div>
                                                    <span style={{ fontSize: 'var(--text-sm)' }}>{p.owner?.name || 'Unknown'}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`status-badge status-${p.status}`}>
                                                    {p.status}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`priority-badge priority-${p.priority}`}>
                                                    {p.priority}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="members-avatars">
                                                    {(p.members || []).slice(0, 3).map((m, i) => (
                                                        <div
                                                            key={i}
                                                            className="member-avatar-mini"
                                                            style={{ background: getAvatarColor(m.user?.name), zIndex: 3 - i }}
                                                            title={m.user?.name}
                                                        >
                                                            {m.user?.name?.charAt(0).toUpperCase() || '?'}
                                                        </div>
                                                    ))}
                                                    {(p.members || []).length > 3 && (
                                                        <div className="member-avatar-mini more">
                                                            +{p.members.length - 3}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                                                {formatDate(p.createdAt)}
                                            </td>
                                            <td>
                                                <div className="admin-actions">
                                                    <button
                                                        className="admin-action-btn edit-btn"
                                                        title="Manage Members"
                                                        onClick={() => openManageMembers(p)}
                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', marginRight: '8px' }}
                                                    >
                                                        👥
                                                    </button>
                                                    <button
                                                        className="admin-action-btn delete-btn"
                                                        title="Delete Project"
                                                        onClick={() => handleDeleteProject(p._id, p.name)}
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {projectPagination && projectPagination.pages > 1 && (
                        <div className="admin-pagination">
                            <span className="pagination-info">
                                Showing {((projectPagination.page - 1) * projectPagination.limit) + 1} to{' '}
                                {Math.min(projectPagination.page * projectPagination.limit, projectPagination.total)} of{' '}
                                {projectPagination.total} projects
                            </span>
                            <div className="pagination-buttons">
                                <button
                                    className="pagination-btn"
                                    disabled={projectPagination.page <= 1}
                                    onClick={() => setProjectPage(p => p - 1)}
                                >
                                    ← Prev
                                </button>
                                {Array.from({ length: Math.min(projectPagination.pages, 5) }, (_, i) => {
                                    const page = i + 1;
                                    return (
                                        <button
                                            key={page}
                                            className={`pagination-btn ${page === projectPagination.page ? 'active' : ''}`}
                                            onClick={() => setProjectPage(page)}
                                        >
                                            {page}
                                        </button>
                                    );
                                })}
                                <button
                                    className="pagination-btn"
                                    disabled={projectPagination.page >= projectPagination.pages}
                                    onClick={() => setProjectPage(p => p + 1)}
                                >
                                    Next →
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Create Project Modal */}
                {showCreateProject && (
                    <div className="modal-overlay" onClick={() => setShowCreateProject(false)}>
                        <div className="modal" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>🏗️ Create New Project</h2>
                                <button className="modal-close" onClick={() => setShowCreateProject(false)}>×</button>
                            </div>
                            <div style={{ padding: '4px 0 8px', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', paddingLeft: '1.5rem' }}>
                                👑 You will be automatically assigned as the <strong>Team Leader</strong> of this project.
                            </div>
                            <form onSubmit={handleCreateProject} className="modal-form">
                                <div className="form-group">
                                    <label>Project Name *</label>
                                    <input type="text" className="input" value={createProjectForm.name} onChange={(e) => setCreateProjectForm({ ...createProjectForm, name: e.target.value })} placeholder="Enter project name" required />
                                </div>
                                <div className="form-group">
                                    <label>Description</label>
                                    <textarea className="input textarea" value={createProjectForm.description} onChange={(e) => setCreateProjectForm({ ...createProjectForm, description: e.target.value })} placeholder="Enter project description" rows={3} />
                                </div>
                                <div className="form-group">
                                    <label>Color</label>
                                    <div className="color-picker">
                                        {PROJECT_COLORS.map((color) => (
                                            <button type="button" key={color} className={`color-option ${createProjectForm.color === color ? 'selected' : ''}`} style={{ backgroundColor: color }} onClick={() => setCreateProjectForm({ ...createProjectForm, color })} />
                                        ))}
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Status</label>
                                        <select className="input" value={createProjectForm.status} onChange={(e) => setCreateProjectForm({ ...createProjectForm, status: e.target.value })}>
                                            <option value="planning">Planning</option>
                                            <option value="active">Active</option>
                                            <option value="on-hold">On Hold</option>
                                            <option value="completed">Completed</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Priority</label>
                                        <select className="input" value={createProjectForm.priority} onChange={(e) => setCreateProjectForm({ ...createProjectForm, priority: e.target.value })}>
                                            <option value="low">Low</option>
                                            <option value="medium">Medium</option>
                                            <option value="high">High</option>
                                            <option value="critical">Critical</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Start Date</label>
                                        <input type="date" className="input" value={createProjectForm.startDate} readOnly disabled style={{ backgroundColor: 'var(--bg-secondary)', cursor: 'not-allowed' }} />
                                    </div>
                                    <div className="form-group">
                                        <label>End Date</label>
                                        <input type="date" className="input" value={createProjectForm.endDate} min={createProjectForm.startDate} onChange={(e) => setCreateProjectForm({ ...createProjectForm, endDate: e.target.value })} required />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Board Type *</label>
                                    <div className="board-type-selector">
                                        <div className={`board-type-option ${createProjectForm.boardType === 'kanban' ? 'selected' : ''}`} onClick={() => setCreateProjectForm({ ...createProjectForm, boardType: 'kanban' })}>
                                            <div className="board-type-icon">📋</div>
                                            <div className="board-type-info"><h4>Kanban Board</h4><p>Visualize workflow with columns.</p></div>
                                            {createProjectForm.boardType === 'kanban' && <span className="check-mark">✓</span>}
                                        </div>
                                        <div className={`board-type-option ${createProjectForm.boardType === 'scrum' ? 'selected' : ''}`} onClick={() => setCreateProjectForm({ ...createProjectForm, boardType: 'scrum' })}>
                                            <div className="board-type-icon">🏃</div>
                                            <div className="board-type-info"><h4>Scrum Board</h4><p>Work in sprints with backlogs.</p></div>
                                            {createProjectForm.boardType === 'scrum' && <span className="check-mark">✓</span>}
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-actions">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowCreateProject(false)}>Cancel</button>
                                    <button type="submit" className="btn btn-primary" disabled={creatingProject}>
                                        {creatingProject ? 'Creating...' : '🏗️ Create Project'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Manage Members Modal */}
                {showManageMembers && selectedProject && (
                    <div className="modal-overlay" onClick={() => setShowManageMembers(false)}>
                        <div className="modal modal-members" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>Manage Team Members</h2>
                                <button className="modal-close" onClick={() => setShowManageMembers(false)}>×</button>
                            </div>
                            <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto', padding: '1rem 0' }}>
                                <p className="text-secondary" style={{ marginBottom: '1rem', padding: '0 1.5rem' }}>
                                    Manage members for <strong>{selectedProject.name}</strong>
                                </p>

                                <div className="members-section" style={{ padding: '0 1.5rem' }}>
                                    <h4 className="members-section-title">
                                        <span>👑 Owner</span>
                                    </h4>
                                    <div className="member-card owner-card" style={{ display: 'flex', alignItems: 'center', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px', marginBottom: '1rem' }}>
                                        <div className="member-avatar" style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', marginRight: '1rem' }}>
                                            {selectedProject.owner?.avatar ? (
                                                <img src={selectedProject.owner.avatar} alt={selectedProject.owner.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                                            ) : (
                                                selectedProject.owner?.name?.charAt(0).toUpperCase() || '?'
                                            )}
                                        </div>
                                        <div className="member-info" style={{ flex: 1 }}>
                                            <div className="member-name" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{selectedProject.owner?.name}</div>
                                            <div className="member-email" style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{selectedProject.owner?.email}</div>
                                        </div>
                                        <span className="badge badge-success">Owner</span>
                                    </div>
                                </div>

                                <div className="members-section" style={{ padding: '0 1.5rem' }}>
                                    <h4 className="members-section-title">
                                        <span>👥 Team Members ({selectedProject.members?.length || 0})</span>
                                    </h4>
                                    {(!selectedProject.members || selectedProject.members.length === 0) ? (
                                        <div className="admin-empty" style={{ padding: '2rem 1rem' }}>
                                            <p>No team members yet</p>
                                        </div>
                                    ) : (
                                        <div className="members-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {selectedProject.members.map(member => (
                                                <div key={member.user?._id || member._id} className="member-card" style={{ display: 'flex', alignItems: 'center', padding: '10px 12px', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                                                    <div className="member-avatar" style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #22c55e, #14b8a6)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', marginRight: '1rem' }}>
                                                        {member.user?.avatar ? (
                                                            <img src={member.user.avatar} alt={member.user?.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                                                        ) : (
                                                            member.user?.name?.charAt(0).toUpperCase() || '?'
                                                        )}
                                                    </div>
                                                    <div className="member-info" style={{ flex: 1 }}>
                                                        <div className="member-name" style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{member.user?.name || 'Unknown User'}</div>
                                                        <div className="member-email" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{member.user?.email || ''}</div>
                                                    </div>
                                                    <span className={`badge badge-primary`} style={{ marginRight: '12px' }}>
                                                        {member.role || 'Member'}
                                                    </span>
                                                    <button
                                                        className="btn-icon btn-icon-danger btn-icon-sm"
                                                        onClick={() => handleRemoveMemberFromProject(selectedProject._id, member.user?._id)}
                                                        title="Remove member"
                                                        disabled={membersLoading}
                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '4px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </>
        );
    };

    return (
        <div className="admin-panel">
            <Navbar />
            <main className="admin-main">
                <div className="container">
                    {/* Header */}
                    <div className="admin-header">
                        <div className="admin-header-left">
                            <h1>
                                <span className="admin-crown">👑</span>
                                Admin Panel
                            </h1>
                            <p className="admin-subtitle">
                                Manage users, projects, and monitor system activity
                            </p>
                        </div>
                        <div className="admin-badge">
                            🛡️ Super Admin — {user?.name}
                        </div>
                    </div>

                    {loading ? (
                        <div className="admin-loading">
                            <div className="spinner"></div>
                            <p>Loading admin data...</p>
                        </div>
                    ) : (
                        <>
                            {/* Stats */}
                            <div className="admin-stats-grid">
                                <div className="admin-stat-card stat-users">
                                    <div className="admin-stat-icon users-icon">👥</div>
                                    <div className="admin-stat-info">
                                        <div className="admin-stat-value">{stats?.totalUsers || 0}</div>
                                        <div className="admin-stat-label">Total Users</div>
                                    </div>
                                </div>
                                <div className="admin-stat-card stat-projects">
                                    <div className="admin-stat-icon projects-icon">📁</div>
                                    <div className="admin-stat-info">
                                        <div className="admin-stat-value">{stats?.totalProjects || 0}</div>
                                        <div className="admin-stat-label">Total Projects</div>
                                    </div>
                                </div>
                                <div className="admin-stat-card stat-tasks">
                                    <div className="admin-stat-icon tasks-icon">✅</div>
                                    <div className="admin-stat-info">
                                        <div className="admin-stat-value">{stats?.totalTasks || 0}</div>
                                        <div className="admin-stat-label">Total Tasks</div>
                                    </div>
                                </div>
                                <div className="admin-stat-card stat-admins">
                                    <div className="admin-stat-icon admins-icon">🛡️</div>
                                    <div className="admin-stat-info">
                                        <div className="admin-stat-value">{stats?.adminCount || 0}</div>
                                        <div className="admin-stat-label">Admins</div>
                                    </div>
                                </div>
                            </div>

                            {/* Tabs */}
                            <div className="admin-tabs">
                                <button
                                    className={`admin-tab ${activeTab === 'overview' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('overview')}
                                >
                                    <span className="tab-icon">📊</span> Overview
                                </button>
                                <button
                                    className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('users')}
                                >
                                    <span className="tab-icon">👥</span> Users
                                </button>
                                <button
                                    className={`admin-tab ${activeTab === 'projects' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('projects')}
                                >
                                    <span className="tab-icon">📁</span> Projects
                                </button>
                            </div>

                            {/* Tab Content */}
                            {activeTab === 'overview' && renderOverview()}
                            {activeTab === 'users' && renderUsersTable()}
                            {activeTab === 'projects' && renderProjectsTable()}
                        </>
                    )}
                </div>
            </main>

            {/* Confirm Modal */}
            {confirmModal && (
                <div className="confirm-overlay" onClick={() => setConfirmModal(null)}>
                    <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="confirm-icon danger">⚠️</div>
                        <h3>{confirmModal.title}</h3>
                        <p>{confirmModal.message}</p>
                        <div className="confirm-actions">
                            <button
                                className="btn btn-secondary"
                                onClick={() => setConfirmModal(null)}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-danger"
                                onClick={confirmModal.onConfirm}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast Notification */}
            {toast && (
                <div className={`admin-toast toast-${toast.type}`}>
                    {toast.type === 'success' ? '✅' : '❌'} {toast.message}
                </div>
            )}
        </div>
    );
};

export default AdminPanel;
