import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import projectService from '../services/projectService';
import userService from '../services/userService';
import { useAuth } from '../context/AuthContext';
import './Pages.css';


const Projects = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingProject, setEditingProject] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        status: 'planning',
        priority: 'medium',
        color: '#6366f1',
        boardType: 'kanban',
        startDate: new Date().toISOString().split('T')[0],
        endDate: ''
    });
    const [saving, setSaving] = useState(false);

    // Invite link state
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteData, setInviteData] = useState(null);
    const [inviteLoading, setInviteLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    // Join via invite state
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [joinCode, setJoinCode] = useState('');
    const [joinLoading, setJoinLoading] = useState(false);
    const [joinError, setJoinError] = useState('');

    // Team members state
    const [showMembersModal, setShowMembersModal] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [membersLoading, setMembersLoading] = useState(false);



    // Get current user from localStorage
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const isProjectOwner = selectedProject?.owner?._id === currentUser?.id || selectedProject?.owner?._id === currentUser?._id;

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            setLoading(true);
            const response = await projectService.getAll();
            setProjects(response.data || []);
        } catch (error) {
            console.error('Error fetching projects:', error);
        } finally {
            setLoading(false);
        }
    };

    const openCreateModal = () => {
        setEditingProject(null);
        setFormData({
            name: '',
            description: '',
            status: 'planning',
            priority: 'medium',
            color: '#6366f1',
            boardType: 'kanban',
            startDate: new Date().toISOString().split('T')[0],
            endDate: ''
        });
        setShowModal(true);
    };

    const openEditModal = (project) => {
        setEditingProject(project);
        setFormData({
            name: project.name,
            description: project.description || '',
            status: project.status,
            priority: project.priority,
            color: project.color || '#6366f1',
            boardType: project.boardType || 'kanban',
            startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            endDate: project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : ''
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingProject(null);
        setFormData({
            name: '',
            description: '',
            status: 'planning',
            priority: 'medium',
            color: '#6366f1',
            boardType: 'kanban',
            startDate: new Date().toISOString().split('T')[0],
            endDate: ''
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            if (editingProject) {
                await projectService.update(editingProject._id, formData);
            } else {
                await projectService.create(formData);
            }
            closeModal();
            fetchProjects();
        } catch (error) {
            console.error('Error saving project:', error);
            alert(error.response?.data?.message || 'Failed to save project');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteProject = async (id) => {
        if (!window.confirm('Are you sure you want to delete this project?')) return;
        try {
            await projectService.delete(id);
            fetchProjects();
        } catch (error) {
            console.error('Error deleting project:', error);
            alert(error.response?.data?.message || 'Failed to delete project');
        }
    };

    // Invite link functions
    const openInviteModal = async (project) => {
        setShowInviteModal(true);
        setInviteLoading(true);
        setInviteData({ projectName: project.name, projectId: project._id });
        setCopied(false);

        try {
            const response = await projectService.getInviteLink(project._id);
            setInviteData({
                projectName: project.name,
                projectId: project._id,
                inviteLink: response.data.inviteLink,
                inviteCode: response.data.inviteCode
            });
        } catch (error) {
            console.error('Error getting invite link:', error);
            setInviteData({
                projectName: project.name,
                projectId: project._id,
                error: error.response?.data?.message || 'Failed to get invite link'
            });
        } finally {
            setInviteLoading(false);
        }
    };

    const closeInviteModal = () => {
        setShowInviteModal(false);
        setInviteData(null);
        setCopied(false);
    };

    const copyInviteLink = () => {
        if (inviteData?.inviteLink) {
            navigator.clipboard.writeText(inviteData.inviteLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const regenerateInviteLink = async () => {
        if (!inviteData?.projectId) return;
        setInviteLoading(true);
        setCopied(false);

        try {
            const response = await projectService.regenerateInviteCode(inviteData.projectId);
            setInviteData({
                ...inviteData,
                inviteLink: response.data.inviteLink,
                inviteCode: response.data.inviteCode,
                error: null
            });
        } catch (error) {
            console.error('Error regenerating invite link:', error);
        } finally {
            setInviteLoading(false);
        }
    };

    // Team Members functions
    const openMembersModal = async (project) => {
        setSelectedProject(project);
        setShowMembersModal(true);
        setSearchQuery('');
        setSearchResults([]);
    };

    // Join via Invite Link
    const handleJoinViaInvite = async () => {
        if (!joinCode.trim()) {
            setJoinError('Please enter an invite code or link');
            return;
        }

        // Extract invite code from full URL or just use the code directly
        let code = joinCode.trim();
        // Handle full URLs like http://localhost:3000/join/abc123
        const urlMatch = code.match(/\/join\/([a-zA-Z0-9]+)/);
        if (urlMatch) {
            code = urlMatch[1];
        }

        try {
            setJoinLoading(true);
            setJoinError('');
            await projectService.joinProject(code);
            setShowJoinModal(false);
            setJoinCode('');
            fetchProjects();
        } catch (error) {
            setJoinError(error.response?.data?.message || 'Failed to join project. Please check the invite code.');
        } finally {
            setJoinLoading(false);
        }
    };

    const closeMembersModal = () => {
        setShowMembersModal(false);
        setSelectedProject(null);
        setSearchQuery('');
        setSearchResults([]);
    };

    const handleSearchUsers = async (query) => {
        setSearchQuery(query);
        if (query.trim().length < 2) {
            setSearchResults([]);
            return;
        }

        try {
            setSearchLoading(true);
            const response = await userService.search(query);
            // Filter out users who are already members or the owner
            const filteredUsers = (response.data || []).filter(user => {
                const isOwner = selectedProject?.owner?._id === user._id;
                const isMember = selectedProject?.members?.some(m => m.user?._id === user._id);
                return !isOwner && !isMember;
            });
            setSearchResults(filteredUsers);
        } catch (error) {
            console.error('Error searching users:', error);
            setSearchResults([]);
        } finally {
            setSearchLoading(false);
        }
    };

    const handleAddMember = async (userId, role = 'member') => {
        if (!selectedProject) return;

        try {
            setMembersLoading(true);
            const response = await projectService.addMember(selectedProject._id, userId, role);
            // Update selected project with response data
            if (response.data) {
                setSelectedProject(response.data);
            }
            // Refresh projects list
            fetchProjects();
            // Clear search
            setSearchQuery('');
            setSearchResults([]);
        } catch (error) {
            console.error('Error adding member:', error);
            alert(error.response?.data?.message || 'Failed to add member');
        } finally {
            setMembersLoading(false);
        }
    };

    const handleRemoveMember = async (userId) => {
        if (!selectedProject) return;
        if (!window.confirm('Are you sure you want to remove this team member?')) return;

        try {
            setMembersLoading(true);
            await projectService.removeMember(selectedProject._id, userId);
            // Update selected project locally
            setSelectedProject(prev => ({
                ...prev,
                members: prev.members.filter(m => m.user?._id !== userId)
            }));
            // Refresh projects list in background
            fetchProjects();
        } catch (error) {
            console.error('Error removing member:', error);
            alert(error.response?.data?.message || 'Failed to remove member');
        } finally {
            setMembersLoading(false);
        }
    };

    const getRoleColor = (role) => {
        switch (role) {
            case 'admin': return 'badge-warning';
            case 'member': return 'badge-primary';
            case 'viewer': return 'badge-secondary';
            default: return 'badge-primary';
        }
    };

    const handleUpdateRole = async (userId, newRole) => {
        if (!selectedProject) return;

        try {
            setMembersLoading(true);
            const response = await projectService.updateMemberRole(selectedProject._id, userId, newRole);
            // Update selected project with response data
            if (response.data) {
                setSelectedProject(response.data);
            }
            // Refresh projects list in background
            fetchProjects();
        } catch (error) {
            console.error('Error updating role:', error);
            alert(error.response?.data?.message || 'Failed to update role');
        } finally {
            setMembersLoading(false);
        }
    };

    const getInitials = (name) => {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#14b8a6'];

    return (
        <div className="page">
            <Navbar />
            <main className="page-main">
                <div className="container">
                    <div className="page-header">
                        <h1>Projects</h1>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <button className="btn btn-secondary" onClick={() => { setShowJoinModal(true); setJoinCode(''); setJoinError(''); }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                                </svg>
                                + Invite Link
                            </button>
                            {user?.role === 'admin' && (
                                <button className="btn btn-primary" onClick={openCreateModal}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                                        <line x1="12" y1="5" x2="12" y2="19" />
                                        <line x1="5" y1="12" x2="19" y2="12" />
                                    </svg>
                                    New Project
                                </button>
                            )}
                        </div>
                    </div>

                    {loading ? (
                        <div className="loading-container">
                            <div className="spinner"></div>
                            <p>Loading projects...</p>
                        </div>
                    ) : projects.length === 0 ? (
                        <div className="empty-state-large">
                            <div className="empty-icon">📁</div>
                            <h2>No projects yet</h2>
                            {user?.role === 'admin' ? (
                                <>
                                    <p>Create your first project to get started!</p>
                                    <button className="btn btn-primary" onClick={openCreateModal}>
                                        Create Project
                                    </button>
                                </>
                            ) : (
                                <p>Projects are created by administrators. Use an invite link to join a project.</p>
                            )}
                        </div>
                    ) : (
                        <div className="projects-grid">
                            {projects.map((project) => (
                                <div key={project._id} className="card project-card">
                                    <div className="project-card-header">
                                        <div className="project-card-color" style={{ backgroundColor: project.color || '#6366f1' }}></div>
                                        <div className="project-card-actions">
                                            <Link
                                                to={project.boardType === 'scrum' ? '/scrum' : '/kanban'}
                                                className="btn-icon"
                                                title={`Open ${project.boardType === 'scrum' ? 'Scrum' : 'Kanban'} Board`}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                {project.boardType === 'scrum' ? '🏃' : '📋'}
                                            </Link>
                                            <button
                                                className="btn-icon"
                                                onClick={() => openInviteModal(project)}
                                                title="Share Invite Link"
                                            >
                                                🔗
                                            </button>
                                            <Link
                                                to={`/messages?project=${project._id}`}
                                                className="btn-icon"
                                                title="Team Chat"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                💬
                                            </Link>
                                            <button
                                                className="btn-icon"
                                                onClick={() => openMembersModal(project)}
                                                title="Manage Team Members"
                                            >
                                                👥
                                            </button>
                                            <button
                                                className="btn-icon"
                                                onClick={() => openEditModal(project)}
                                                title="Edit"
                                            >
                                                ✏️
                                            </button>
                                            {/* Only show delete button for owner - checking both .id/._id format */}
                                            {user && (project.owner._id === user.id || project.owner._id === user._id) && (
                                                <button
                                                    className="btn-icon btn-icon-danger"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        handleDeleteProject(project._id);
                                                    }}
                                                    title="Delete"
                                                >
                                                    🗑️
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <Link to={`/projects/${project._id}`} className="project-card-content">
                                        <h3>{project.name}</h3>
                                        <p className="project-description">{project.description || 'No description'}</p>
                                        <div className="project-card-footer">
                                            <div className="project-badges">
                                                <span className={`badge badge-${project.status === 'active' ? 'success' : project.status === 'on-hold' ? 'warning' : 'primary'}`}>
                                                    {project.status}
                                                </span>
                                                <span className={`badge badge-board ${project.boardType === 'scrum' ? 'badge-scrum' : 'badge-kanban'}`}>
                                                    {project.boardType === 'scrum' ? '🏃 Scrum' : '📋 Kanban'}
                                                </span>
                                            </div>
                                            <span className="project-members">
                                                {project.members?.length || 0} members
                                            </span>
                                        </div>
                                    </Link>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {/* Create/Edit Project Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingProject ? 'Edit Project' : 'Create New Project'}</h2>
                            <button className="modal-close" onClick={closeModal}>×</button>
                        </div>
                        <form onSubmit={handleSubmit} className="modal-form">
                            <div className="form-group">
                                <label>Project Name *</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Enter project name"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    className="input textarea"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Enter project description"
                                    rows={3}
                                />
                            </div>
                            <div className="form-group">
                                <label>Color</label>
                                <div className="color-picker">
                                    {colors.map((color) => (
                                        <button
                                            type="button"
                                            key={color}
                                            className={`color-option ${formData.color === color ? 'selected' : ''}`}
                                            style={{ backgroundColor: color }}
                                            onClick={() => setFormData({ ...formData, color })}
                                        />
                                    ))}
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Status</label>
                                    <select
                                        className="input"
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    >
                                        <option value="planning">Planning</option>
                                        <option value="active">Active</option>
                                        <option value="on-hold">On Hold</option>
                                        <option value="completed">Completed</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Priority</label>
                                    <select
                                        className="input"
                                        value={formData.priority}
                                        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                    >
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
                                    <input
                                        type="date"
                                        className="input"
                                        value={formData.startDate}
                                        readOnly
                                        disabled
                                        style={{ backgroundColor: 'var(--bg-secondary)', cursor: 'not-allowed' }}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>End Date</label>
                                    <input
                                        type="date"
                                        className="input"
                                        value={formData.endDate}
                                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                        min={formData.startDate}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Board Type *</label>
                                <div className="board-type-selector">
                                    <div
                                        className={`board-type-option ${formData.boardType === 'kanban' ? 'selected' : ''}`}
                                        onClick={() => setFormData({ ...formData, boardType: 'kanban' })}
                                    >
                                        <div className="board-type-icon">📋</div>
                                        <div className="board-type-info">
                                            <h4>Kanban Board</h4>
                                            <p>Visualize workflow with columns. Great for continuous delivery.</p>
                                        </div>
                                        {formData.boardType === 'kanban' && <span className="check-mark">✓</span>}
                                    </div>
                                    <div
                                        className={`board-type-option ${formData.boardType === 'scrum' ? 'selected' : ''}`}
                                        onClick={() => setFormData({ ...formData, boardType: 'scrum' })}
                                    >
                                        <div className="board-type-icon">🏃</div>
                                        <div className="board-type-info">
                                            <h4>Scrum Board</h4>
                                            <p>Work in sprints with backlogs. Great for iterative development.</p>
                                        </div>
                                        {formData.boardType === 'scrum' && <span className="check-mark">✓</span>}
                                    </div>
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving ? 'Saving...' : (editingProject ? 'Save Changes' : 'Create Project')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Invite Link Modal */}
            {showInviteModal && (
                <div className="modal-overlay" onClick={closeInviteModal}>
                    <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Share Project</h2>
                            <button className="modal-close" onClick={closeInviteModal}>×</button>
                        </div>
                        <div className="modal-body">
                            <p className="text-secondary">
                                Share this link to invite people to join <strong>{inviteData?.projectName}</strong>
                            </p>

                            {inviteLoading ? (
                                <div className="loading-container" style={{ padding: '2rem 0' }}>
                                    <div className="spinner"></div>
                                    <p>Getting invite link...</p>
                                </div>
                            ) : inviteData?.error ? (
                                <div className="alert alert-error">
                                    {inviteData.error}
                                </div>
                            ) : (
                                <>
                                    <div className="invite-link-container">
                                        <input
                                            type="text"
                                            className="input"
                                            value={inviteData?.inviteLink || ''}
                                            readOnly
                                        />
                                        <button
                                            className={`btn ${copied ? 'btn-success' : 'btn-primary'}`}
                                            onClick={copyInviteLink}
                                        >
                                            {copied ? '✓ Copied!' : 'Copy'}
                                        </button>
                                    </div>
                                    <div className="invite-actions">
                                        <button
                                            className="btn btn-ghost btn-sm"
                                            onClick={regenerateInviteLink}
                                            disabled={inviteLoading}
                                        >
                                            🔄 Generate New Link
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Team Members Modal */}
            {showMembersModal && selectedProject && (
                <div className="modal-overlay" onClick={closeMembersModal}>
                    <div className="modal modal-members" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Team Members</h2>
                            <button className="modal-close" onClick={closeMembersModal}>×</button>
                        </div>
                        <div className="modal-body">
                            <p className="text-secondary" style={{ marginBottom: '1rem' }}>
                                Manage team members for <strong>{selectedProject.name}</strong>
                            </p>

                            {/* Search Users */}
                            <div className="member-search-container">
                                <div className="search-input-wrapper">
                                    <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                                        <circle cx="11" cy="11" r="8" />
                                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                    </svg>
                                    <input
                                        type="text"
                                        className="input search-input"
                                        placeholder="Search users by name or email..."
                                        value={searchQuery}
                                        onChange={(e) => handleSearchUsers(e.target.value)}
                                    />
                                </div>

                                {/* Search Results Dropdown */}
                                {searchQuery.length >= 2 && (
                                    <div className="search-results-dropdown">
                                        {searchLoading ? (
                                            <div className="search-loading">
                                                <div className="spinner-sm"></div>
                                                Searching...
                                            </div>
                                        ) : searchResults.length === 0 ? (
                                            <div className="search-no-results">
                                                No users found matching "{searchQuery}"
                                            </div>
                                        ) : (
                                            searchResults.map(user => (
                                                <div key={user._id} className="search-result-item">
                                                    <div className="member-avatar" style={{ background: 'linear-gradient(135deg, #8b5cf6, #ec4899)' }}>
                                                        {user.avatar ? (
                                                            <img src={user.avatar} alt={user.name} />
                                                        ) : (
                                                            getInitials(user.name)
                                                        )}
                                                    </div>
                                                    <div className="member-info">
                                                        <span className="member-name">{user.name}</span>
                                                        <span className="member-email">{user.email}</span>
                                                    </div>
                                                    <button
                                                        className="btn btn-primary btn-sm"
                                                        onClick={() => handleAddMember(user._id)}
                                                        disabled={membersLoading}
                                                    >
                                                        + Add
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Current Members */}
                            <div className="members-section">
                                <h4 className="members-section-title">
                                    <span>👑 Owner</span>
                                </h4>
                                <div className="member-card owner-card">
                                    <div className="member-avatar" style={{ background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))' }}>
                                        {selectedProject.owner?.avatar ? (
                                            <img src={selectedProject.owner.avatar} alt={selectedProject.owner.name} />
                                        ) : (
                                            getInitials(selectedProject.owner?.name)
                                        )}
                                    </div>
                                    <div className="member-info">
                                        <span className="member-name">{selectedProject.owner?.name}</span>
                                        <span className="member-email">{selectedProject.owner?.email}</span>
                                    </div>
                                    <span className="badge badge-success">Owner</span>
                                </div>
                            </div>

                            <div className="members-section">
                                <h4 className="members-section-title">
                                    <span>👥 Team Members ({selectedProject.members?.length || 0})</span>
                                </h4>
                                {(!selectedProject.members || selectedProject.members.length === 0) ? (
                                    <div className="no-members">
                                        <p>No team members yet</p>
                                        <span>Search and add team members above</span>
                                    </div>
                                ) : (
                                    <div className="members-list">
                                        {selectedProject.members.map(member => (
                                            <div key={member.user?._id || member._id} className="member-card">
                                                <div className="member-avatar" style={{ background: 'linear-gradient(135deg, #22c55e, #14b8a6)' }}>
                                                    {member.user?.avatar ? (
                                                        <img src={member.user.avatar} alt={member.user.name} />
                                                    ) : (
                                                        getInitials(member.user?.name)
                                                    )}
                                                </div>
                                                <div className="member-info">
                                                    <span className="member-name">{member.user?.name || 'Unknown'}</span>
                                                    <span className="member-email">{member.user?.email || ''}</span>
                                                </div>
                                                {isProjectOwner ? (
                                                    <>
                                                        <select
                                                            className="role-selector"
                                                            value={member.role}
                                                            onChange={(e) => handleUpdateRole(member.user?._id, e.target.value)}
                                                            disabled={membersLoading}
                                                        >
                                                            <option value="viewer">👁️ Viewer</option>
                                                            <option value="member">👤 Member</option>
                                                            <option value="admin">⚡ Admin</option>
                                                        </select>
                                                        <button
                                                            className="btn-icon btn-icon-danger btn-icon-sm"
                                                            onClick={() => handleRemoveMember(member.user?._id)}
                                                            title="Remove member"
                                                            disabled={membersLoading}
                                                        >
                                                            ✕
                                                        </button>
                                                    </>
                                                ) : (
                                                    <span className={`badge ${getRoleColor(member.role)}`}>
                                                        {member.role === 'admin' ? '⚡ ' : member.role === 'viewer' ? '👁️ ' : '👤 '}
                                                        {member.role}
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Join via Invite Link Modal */}
            {showJoinModal && (
                <div className="modal-overlay" onClick={() => setShowJoinModal(false)}>
                    <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>🔗 Join via Invite Link</h2>
                            <button className="modal-close" onClick={() => setShowJoinModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <p className="text-secondary" style={{ marginBottom: '1rem' }}>
                                Paste an invite link or code to join a project
                            </p>
                            <div className="form-group">
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="e.g. http://localhost:3000/join/abc123 or abc123"
                                    value={joinCode}
                                    onChange={(e) => { setJoinCode(e.target.value); setJoinError(''); }}
                                    onKeyDown={(e) => e.key === 'Enter' && handleJoinViaInvite()}
                                    autoFocus
                                />
                            </div>
                            {joinError && (
                                <div className="alert alert-error" style={{ marginBottom: '1rem', padding: '10px 14px', fontSize: '13px', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                                    {joinError}
                                </div>
                            )}
                            <div className="modal-actions">
                                <button className="btn btn-secondary" onClick={() => setShowJoinModal(false)}>
                                    Cancel
                                </button>
                                <button
                                    className="btn btn-primary"
                                    onClick={handleJoinViaInvite}
                                    disabled={joinLoading || !joinCode.trim()}
                                >
                                    {joinLoading ? 'Joining...' : 'Join Project'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Projects;

