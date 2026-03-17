import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import taskService from '../services/taskService';
import projectService from '../services/projectService';
import './Pages.css';
import './Tasks.css';

const Tasks = () => {
    const [tasks, setTasks] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [filter, setFilter] = useState('all');
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        project: '',
        priority: 'medium',
        status: 'todo',
        dueDate: ''
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [tasksRes, projectsRes] = await Promise.all([
                taskService.getAll(),
                projectService.getAll()
            ]);
            setTasks(tasksRes.data || []);
            setProjects(projectsRes.data || []);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const openCreateModal = () => {
        setEditingTask(null);
        setFormData({
            title: '',
            description: '',
            project: '',
            priority: 'medium',
            status: 'todo',
            dueDate: ''
        });
        setShowModal(true);
    };

    const openEditModal = (task) => {
        setEditingTask(task);
        setFormData({
            title: task.title,
            description: task.description || '',
            project: task.project?._id || task.project || '',
            priority: task.priority,
            status: task.status,
            dueDate: task.dueDate ? task.dueDate.split('T')[0] : ''
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingTask(null);
        setFormData({
            title: '',
            description: '',
            project: '',
            priority: 'medium',
            status: 'todo',
            dueDate: ''
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.project) {
            alert('Please select a project');
            return;
        }
        try {
            setSaving(true);
            if (editingTask) {
                await taskService.update(editingTask._id, formData);
            } else {
                await taskService.create(formData);
            }
            closeModal();
            fetchData();
        } catch (error) {
            console.error('Error saving task:', error);
            alert(error.response?.data?.message || 'Failed to save task');
        } finally {
            setSaving(false);
        }
    };

    const handleStatusChange = async (taskId, newStatus) => {
        try {
            await taskService.updateStatus(taskId, newStatus);
            fetchData();
        } catch (error) {
            console.error('Error updating task:', error);
        }
    };

    const handleDeleteTask = async (taskId) => {
        if (!window.confirm('Are you sure you want to delete this task?')) return;
        try {
            await taskService.delete(taskId);
            fetchData();
        } catch (error) {
            console.error('Error deleting task:', error);
        }
    };

    const filteredTasks = filter === 'all'
        ? tasks
        : tasks.filter(task => task.status === filter);

    const taskCounts = {
        all: tasks.length,
        todo: tasks.filter(t => t.status === 'todo').length,
        'in-progress': tasks.filter(t => t.status === 'in-progress').length,
        review: tasks.filter(t => t.status === 'review').length,
        done: tasks.filter(t => t.status === 'done').length
    };

    return (
        <div className="page">
            <Navbar />
            <main className="page-main">
                <div className="container">
                    <div className="page-header">
                        <h1>Tasks</h1>
                        <button className="btn btn-primary" onClick={openCreateModal}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                            New Task
                        </button>
                    </div>

                    {/* Filter Tabs */}
                    <div className="task-filters">
                        {['all', 'todo', 'in-progress', 'review', 'done'].map((status) => (
                            <button
                                key={status}
                                className={`filter-tab ${filter === status ? 'active' : ''}`}
                                onClick={() => setFilter(status)}
                            >
                                {status === 'in-progress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1)}
                                <span className="filter-count">{taskCounts[status]}</span>
                            </button>
                        ))}
                    </div>

                    {loading ? (
                        <div className="loading-container">
                            <div className="spinner"></div>
                            <p>Loading tasks...</p>
                        </div>
                    ) : projects.length === 0 ? (
                        <div className="empty-state-large">
                            <div className="empty-icon">📋</div>
                            <h2>Create a project first</h2>
                            <p>You need at least one project to create tasks.</p>
                        </div>
                    ) : filteredTasks.length === 0 ? (
                        <div className="empty-state-large">
                            <div className="empty-icon">✅</div>
                            <h2>No tasks {filter !== 'all' ? `in "${filter}"` : 'yet'}</h2>
                            <p>Create your first task to get started!</p>
                            <button className="btn btn-primary" onClick={openCreateModal}>
                                Create Task
                            </button>
                        </div>
                    ) : (
                        <div className="tasks-grid">
                            {filteredTasks.map((task) => (
                                <div key={task._id} className="task-card-large">
                                    <div className="task-card-header">
                                        <span className={`task-priority-badge priority-${task.priority}`}>
                                            {task.priority}
                                        </span>
                                        <div className="task-card-actions">
                                            <button
                                                className="btn-icon-sm edit"
                                                onClick={() => openEditModal(task)}
                                                title="Edit"
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                className="btn-icon-sm delete"
                                                onClick={() => handleDeleteTask(task._id)}
                                                title="Delete"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    </div>
                                    <h3 className="task-title">{task.title}</h3>
                                    {task.description && (
                                        <p className="task-description">{task.description}</p>
                                    )}
                                    <div className="task-project">
                                        <span
                                            className="project-dot"
                                            style={{ backgroundColor: task.project?.color || '#6366f1' }}
                                        ></span>
                                        {task.project?.name || 'No project'}
                                    </div>
                                    <div className="task-card-footer">
                                        <select
                                            className="status-select"
                                            value={task.status}
                                            onChange={(e) => handleStatusChange(task._id, e.target.value)}
                                        >
                                            <option value="todo">To Do</option>
                                            <option value="in-progress">In Progress</option>
                                            <option value="review">Review</option>
                                            <option value="done">Done</option>
                                        </select>
                                        {task.dueDate && (
                                            <span className="task-due">
                                                📅 {new Date(task.dueDate).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {/* Create/Edit Task Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingTask ? 'Edit Task' : 'Create New Task'}</h2>
                            <button className="modal-close" onClick={closeModal}>×</button>
                        </div>
                        <form onSubmit={handleSubmit} className="modal-form">
                            <div className="form-group">
                                <label>Task Title *</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="Enter task title"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    className="input textarea"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Enter task description"
                                    rows={3}
                                />
                            </div>
                            <div className="form-group">
                                <label>Project *</label>
                                <select
                                    className="input"
                                    value={formData.project}
                                    onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                                    required
                                >
                                    <option value="">Select a project</option>
                                    {projects.map((project) => (
                                        <option key={project._id} value={project._id}>
                                            {project.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-row">
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
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Status</label>
                                    <select
                                        className="input"
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    >
                                        <option value="todo">To Do</option>
                                        <option value="in-progress">In Progress</option>
                                        <option value="review">Review</option>
                                        <option value="done">Done</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Due Date</label>
                                <input
                                    type="date"
                                    className="input"
                                    value={formData.dueDate}
                                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving ? 'Saving...' : (editingTask ? 'Save Changes' : 'Create Task')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Tasks;
