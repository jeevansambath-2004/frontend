import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import projectService from '../services/projectService';
import taskService from '../services/taskService';
import './Dashboard.css';

const Dashboard = () => {
    const { user } = useAuth();
    const [projects, setProjects] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newProject, setNewProject] = useState({
        name: '',
        description: '',
        status: 'planning',
        priority: 'medium',
        boardType: 'kanban'
    });
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [projectsRes, tasksRes] = await Promise.all([
                projectService.getAll(),
                taskService.getAll()
            ]);
            setProjects(projectsRes.data || []);
            setTasks(tasksRes.data || []);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateProject = async (e) => {
        e.preventDefault();
        try {
            setCreating(true);
            await projectService.create(newProject);
            setShowModal(false);
            setNewProject({ name: '', description: '', status: 'planning', priority: 'medium', boardType: 'kanban' });
            fetchData();
        } catch (error) {
            console.error('Error creating project:', error);
            alert(error.response?.data?.message || 'Failed to create project');
        } finally {
            setCreating(false);
        }
    };

    const stats = [
        { label: 'Total Projects', value: projects.length, icon: '📁' },
        { label: 'Active Tasks', value: tasks.filter(t => t.status !== 'done').length, icon: '✅' },
        { label: 'Completed', value: tasks.filter(t => t.status === 'done').length, icon: '🎉' },
        { label: 'In Progress', value: tasks.filter(t => t.status === 'in-progress').length, icon: '🔄' },
    ];

    return (
        <div className="dashboard">
            <Navbar />
            <main className="dashboard-main">
                <div className="container">
                    <div className="dashboard-header">
                        <div>
                            <h1>Welcome back, {user?.name?.split(' ')[0] || 'User'}!</h1>
                            <p className="dashboard-subtitle">Here's what's happening with your projects.</p>
                        </div>
                        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                            New Project
                        </button>
                    </div>

                    {loading ? (
                        <div className="loading-container">
                            <div className="spinner"></div>
                            <p>Loading...</p>
                        </div>
                    ) : (
                        <>
                            <div className="stats-grid">
                                {stats.map((stat, index) => (
                                    <div key={index} className="stat-card">
                                        <span className="stat-icon">{stat.icon}</span>
                                        <div className="stat-content">
                                            <span className="stat-value">{stat.value}</span>
                                            <span className="stat-label">{stat.label}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="dashboard-grid">
                                <div className="dashboard-card">
                                    <div className="card-header">
                                        <h2>Recent Projects</h2>
                                        <Link to="/projects" className="card-link">View all</Link>
                                    </div>
                                    {projects.length === 0 ? (
                                        <div className="empty-state">
                                            <p>No projects yet. Create your first project!</p>
                                        </div>
                                    ) : (
                                        <div className="projects-list">
                                            {projects.slice(0, 5).map((project) => (
                                                <Link to={`/projects/${project._id}`} key={project._id} className="project-item">
                                                    <div className="project-color" style={{ backgroundColor: project.color || '#6366f1' }}></div>
                                                    <div className="project-info">
                                                        <h3>{project.name}</h3>
                                                        <div className="project-meta">
                                                            <span className={`project-status status-${project.status}`}>
                                                                {project.status}
                                                            </span>
                                                            <span className={`board-type-badge ${project.boardType === 'scrum' ? 'scrum' : 'kanban'}`}>
                                                                {project.boardType === 'scrum' ? '🏃' : '📋'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="dashboard-card">
                                    <div className="card-header">
                                        <h2>Recent Tasks</h2>
                                        <Link to="/tasks" className="card-link">View all</Link>
                                    </div>
                                    {tasks.length === 0 ? (
                                        <div className="empty-state">
                                            <p>No tasks yet. Create a project first!</p>
                                        </div>
                                    ) : (
                                        <div className="tasks-list">
                                            {tasks.slice(0, 5).map((task) => (
                                                <div key={task._id} className="task-item">
                                                    <div className={`task-status-dot status-${task.status}`}></div>
                                                    <div className="task-info">
                                                        <h3>{task.title}</h3>
                                                        <span className={`task-priority priority-${task.priority}`}>
                                                            {task.priority}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </main>

            {/* Create Project Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Create New Project</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleCreateProject} className="modal-form">
                            <div className="form-group">
                                <label>Project Name</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={newProject.name}
                                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                                    placeholder="Enter project name"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    className="input textarea"
                                    value={newProject.description}
                                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                                    placeholder="Enter project description"
                                    rows={3}
                                />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Status</label>
                                    <select
                                        className="input"
                                        value={newProject.status}
                                        onChange={(e) => setNewProject({ ...newProject, status: e.target.value })}
                                    >
                                        <option value="planning">Planning</option>
                                        <option value="active">Active</option>
                                        <option value="on-hold">On Hold</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Priority</label>
                                    <select
                                        className="input"
                                        value={newProject.priority}
                                        onChange={(e) => setNewProject({ ...newProject, priority: e.target.value })}
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="critical">Critical</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Board Type *</label>
                                <div className="board-type-selector">
                                    <div 
                                        className={`board-type-option ${newProject.boardType === 'kanban' ? 'selected' : ''}`}
                                        onClick={() => setNewProject({ ...newProject, boardType: 'kanban' })}
                                    >
                                        <div className="board-type-icon">📋</div>
                                        <div className="board-type-info">
                                            <h4>Kanban Board</h4>
                                            <p>Visualize workflow with columns.</p>
                                        </div>
                                        {newProject.boardType === 'kanban' && <span className="check-mark">✓</span>}
                                    </div>
                                    <div 
                                        className={`board-type-option ${newProject.boardType === 'scrum' ? 'selected' : ''}`}
                                        onClick={() => setNewProject({ ...newProject, boardType: 'scrum' })}
                                    >
                                        <div className="board-type-icon">🏃</div>
                                        <div className="board-type-info">
                                            <h4>Scrum Board</h4>
                                            <p>Work in sprints with backlogs.</p>
                                        </div>
                                        {newProject.boardType === 'scrum' && <span className="check-mark">✓</span>}
                                    </div>
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={creating}>
                                    {creating ? 'Creating...' : 'Create Project'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
