import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import taskService from '../services/taskService';
import projectService from '../services/projectService';
import './Pages.css';
import './KanbanBoard.css';

const COLUMNS = [
    { id: 'todo', title: 'To Do', icon: '📋', color: '#64748b' },
    { id: 'in-progress', title: 'In Progress', icon: '🔄', color: '#3b82f6' },
    { id: 'review', title: 'Review', icon: '👀', color: '#f59e0b' },
    { id: 'done', title: 'Done', icon: '✅', color: '#22c55e' }
];

const STATUS_LABELS = {
    'todo': 'To Do',
    'in-progress': 'In Progress',
    'review': 'Review',
    'done': 'Done'
};

const KanbanBoard = () => {
    const { user } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState('all');
    const [loading, setLoading] = useState(true);
    const [draggingTask, setDraggingTask] = useState(null);
    const [dragOverColumn, setDragOverColumn] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [saving, setSaving] = useState(false);
    const [projectRole, setProjectRole] = useState(null); // 'owner', 'admin', 'member', 'viewer'
    const [projectMembers, setProjectMembers] = useState([]);
    const [pendingCount, setPendingCount] = useState(0);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        project: '',
        priority: 'medium',
        status: 'todo',
        dueDate: '',
        storyPoints: 0,
        assignee: ''
    });

    // Filters state
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        search: '',
        assignees: [],
        priorities: [],
        statuses: [],
        storyPoints: [],
        due: ''
    });

    // Check if user is admin/owner (can create, edit, delete, assign tasks)
    const isProjectAdmin = user?.role === 'admin' || projectRole === 'owner' || projectRole === 'admin';

    useEffect(() => {
        fetchData();
    }, []);

    // Fetch the user's role whenever selected project changes
    useEffect(() => {
        const fetchRole = async () => {
            if (selectedProject && selectedProject !== 'all') {
                try {
                    const roleRes = await projectService.getUserRole(selectedProject);
                    setProjectRole(roleRes.data?.role || 'member');
                } catch (error) {
                    console.error('Error fetching project role:', error);
                    setProjectRole('member');
                }
            } else {
                // For 'all' projects, use system role
                setProjectRole(user?.role === 'admin' ? 'admin' : null);
            }
        };
        fetchRole();
    }, [selectedProject, user]);

    // Count pending approvals for the selected project
    useEffect(() => {
        const fetchPendingCount = async () => {
            if (isProjectAdmin && selectedProject && selectedProject !== 'all') {
                try {
                    const res = await taskService.getPendingApprovals(selectedProject);
                    setPendingCount(res.count || 0);
                } catch {
                    setPendingCount(0);
                }
            } else {
                // Count from local tasks for 'all' projects view
                const pending = tasks.filter(t => t.approvalStatus === 'pending');
                setPendingCount(pending.length);
            }
        };
        if (isProjectAdmin) {
            fetchPendingCount();
        } else {
            setPendingCount(0);
        }
    }, [selectedProject, isProjectAdmin, tasks]);

    // Load project members when the project selection in the modal form changes
    useEffect(() => {
        const loadMembers = async () => {
            if (formData.project) {
                try {
                    const members = await projectService.getMembers(formData.project);
                    setProjectMembers(members);
                } catch {
                    setProjectMembers([]);
                }
            } else {
                setProjectMembers([]);
            }
        };
        loadMembers();
    }, [formData.project]);

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

    // Extract unique assignees from tasks for the filter
    const uniqueAssignees = Array.from(new Map(tasks
        .filter(t => t.assignee)
        .map(t => {
            const id = t.assignee._id || t.assignee;
            const name = t.assignee.name || 'Unknown User';
            return [id, { _id: id, name }];
        })).values());

    const filteredTasks = tasks.filter(task => {
        // Project filter
        if (selectedProject !== 'all' && task.project?._id !== selectedProject) return false;
        
        // Search filter (Task Name)
        if (filters.search && !task.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
        
        // Assignee filter (Multiple)
        if (filters.assignees.length > 0) {
            const assigneeId = task.assignee?._id || task.assignee;
            if (!filters.assignees.includes(assigneeId)) return false;
        }
        
        // Priority filter (Multiple)
        if (filters.priorities.length > 0 && !filters.priorities.includes(task.priority)) return false;
        
        // Status filter (Multiple)
        if (filters.statuses.length > 0 && !filters.statuses.includes(task.status)) return false;
        
        // Story Points filter (Multiple)
        if (filters.storyPoints.length > 0 && !filters.storyPoints.includes(task.storyPoints?.toString())) return false;
        
        // Due Date filter
        if (filters.due && task.dueDate) {
            const now = new Date();
            const taskDate = new Date(task.dueDate);
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const taskDay = new Date(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate());
            
            if (filters.due === 'overdue') {
                if (taskDay >= today || task.status === 'done') return false;
            } else if (filters.due === 'today') {
                if (taskDay.getTime() !== today.getTime()) return false;
            } else if (filters.due === 'thisWeek') {
                const nextWeek = new Date(today);
                nextWeek.setDate(today.getDate() + 7);
                if (taskDay < today || taskDay > nextWeek) return false;
            }
        } else if (filters.due && !task.dueDate) {
            return false;
        }

        return true;
    });

    const getTasksByStatus = useCallback((status) => {
        return filteredTasks
            .filter(task => task.status === status)
            .sort((a, b) => (a.position || 0) - (b.position || 0));
    }, [filteredTasks]);

    const handleDragStart = (e, task) => {
        // Prevent dragging if task has pending approval (for members)
        if (!isProjectAdmin && task.approvalStatus === 'pending') {
            e.preventDefault();
            return;
        }
        setDraggingTask(task);
        e.dataTransfer.effectAllowed = 'move';
        e.target.classList.add('dragging');
    };

    const handleDragEnd = (e) => {
        e.target.classList.remove('dragging');
        setDraggingTask(null);
        setDragOverColumn(null);
    };

    const handleDragOver = (e, columnId) => {
        e.preventDefault();
        setDragOverColumn(columnId);
    };

    const handleDragLeave = () => {
        setDragOverColumn(null);
    };

    const handleDrop = async (e, newStatus) => {
        e.preventDefault();
        setDragOverColumn(null);

        if (!draggingTask || draggingTask.status === newStatus) {
            return;
        }

        if (isProjectAdmin) {
            // Admin: update status directly
            const updatedTasks = tasks.map(task =>
                task._id === draggingTask._id
                    ? { ...task, status: newStatus }
                    : task
            );
            setTasks(updatedTasks);

            try {
                await taskService.updateStatus(draggingTask._id, newStatus);
            } catch (error) {
                console.error('Error updating task:', error);
                fetchData();
            }
        } else {
            // Member: create approval request
            try {
                const res = await taskService.updateStatus(draggingTask._id, newStatus);
                if (res.message) {
                    alert(res.message);
                }
                fetchData();
            } catch (error) {
                console.error('Error requesting stage change:', error);
                alert(error.response?.data?.message || 'Failed to request stage change');
            }
        }
    };

    // Handle approval action (admin only)
    const handleApproval = async (e, taskId, action) => {
        e.stopPropagation();

        // Optimistic update to hide banner immediately
        const taskToUpdate = tasks.find(t => t._id === taskId);
        if (taskToUpdate) {
            const updatedTasks = tasks.map(t => 
                t._id === taskId 
                    ? { 
                        ...t, 
                        approvalStatus: 'none', 
                        status: action === 'approve' ? t.requestedStatus : t.status,
                        requestedStatus: null
                      } 
                    : t
            );
            setTasks(updatedTasks);
        }

        try {
            if (action === 'approve') {
                await taskService.approveStage(taskId);
            } else if (action === 'reject') {
                await taskService.rejectStage(taskId);
            }
            fetchData();
        } catch (error) {
            console.error('Error processing approval:', error);
            alert(error.response?.data?.message || 'Failed to process approval');
            fetchData(); // Rollback on error
        }
    };

    const openCreateModal = (status = 'todo') => {
        setEditingTask(null);
        setFormData({
            title: '',
            description: '',
            project: selectedProject !== 'all' ? selectedProject : (projects.length > 0 ? projects[0]._id : ''),
            priority: 'medium',
            status: status,
            dueDate: '',
            storyPoints: 0,
            assignee: ''
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
            dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
            storyPoints: task.storyPoints || 0,
            assignee: task.assignee?._id || task.assignee || ''
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingTask(null);
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

    const handleDeleteTask = async (taskId) => {
        if (!window.confirm('Are you sure you want to delete this task?')) return;
        try {
            await taskService.delete(taskId);
            fetchData();
        } catch (error) {
            console.error('Error deleting task:', error);
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high': return '#ef4444';
            case 'medium': return '#f59e0b';
            case 'low': return '#22c55e';
            default: return '#64748b';
        }
    };

    const getColumnStats = (status) => {
        const columnTasks = getTasksByStatus(status);
        const totalPoints = columnTasks.reduce((sum, task) => sum + (task.storyPoints || 0), 0);
        return { count: columnTasks.length, points: totalPoints };
    };

    // Get the next possible statuses for a task
    const getNextStatuses = (currentStatus) => {
        const statusOrder = ['todo', 'in-progress', 'review', 'done'];
        return statusOrder.filter(s => s !== currentStatus);
    };

    return (
        <div className="page">
            <Navbar />
            <main className="page-main">
                <div className="container">
                    <div className="kanban-header">
                        <div className="kanban-header-left">
                            <h1>Kanban Board</h1>
                            <p className="kanban-subtitle">Drag and drop tasks to update their status</p>
                        </div>
                        <div className="kanban-header-right">
                            <div className="filter-container-wrapper">
                                <button 
                                    className={`btn btn-secondary filter-btn ${showFilters ? 'active' : ''}`}
                                    onClick={() => setShowFilters(!showFilters)}
                                >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                                        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                                    </svg>
                                    Filters {Object.values(filters).some(f => Array.isArray(f) ? f.length > 0 : f !== '') && <span className="filter-dot"></span>}
                                </button>
                                
                                {showFilters && (
                                    <div className="filter-dropdown-content">
                                        <div className="filter-section">
                                            <label>Search Task</label>
                                            <input 
                                                type="text" 
                                                placeholder="Task name..."
                                                value={filters.search}
                                                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                                className="filter-input"
                                            />
                                        </div>

                                        <div className="filter-section">
                                            <label>Assigned To</label>
                                            <div className="filter-options">
                                                {uniqueAssignees.length > 0 ? (
                                                    uniqueAssignees.map(user => (
                                                        <label key={user._id} className="filter-checkbox">
                                                            <input 
                                                                type="checkbox"
                                                                checked={filters.assignees.includes(user._id)}
                                                                onChange={(e) => {
                                                                    const newAssignees = e.target.checked 
                                                                        ? [...filters.assignees, user._id]
                                                                        : filters.assignees.filter(x => x !== user._id);
                                                                    setFilters({ ...filters, assignees: newAssignees });
                                                                }}
                                                            />
                                                            {user.name}
                                                        </label>
                                                    ))
                                                ) : (
                                                    <span className="no-filter-options">No assignees found</span>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <div className="filter-section">
                                            <label>Priority</label>
                                            <div className="filter-options">
                                                {['high', 'medium', 'low'].map(p => (
                                                    <label key={p} className="filter-checkbox">
                                                        <input 
                                                            type="checkbox"
                                                            checked={filters.priorities.includes(p)}
                                                            onChange={(e) => {
                                                                const newPriorities = e.target.checked 
                                                                    ? [...filters.priorities, p]
                                                                    : filters.priorities.filter(x => x !== p);
                                                                setFilters({ ...filters, priorities: newPriorities });
                                                            }}
                                                        />
                                                        {p.charAt(0).toUpperCase() + p.slice(1)}
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="filter-section">
                                            <label>Status</label>
                                            <div className="filter-options">
                                                {['todo', 'in-progress', 'review', 'done'].map(s => (
                                                    <label key={s} className="filter-checkbox">
                                                        <input 
                                                            type="checkbox"
                                                            checked={filters.statuses.includes(s)}
                                                            onChange={(e) => {
                                                                const newStatuses = e.target.checked 
                                                                    ? [...filters.statuses, s]
                                                                    : filters.statuses.filter(x => x !== s);
                                                                setFilters({ ...filters, statuses: newStatuses });
                                                            }}
                                                        />
                                                        {STATUS_LABELS[s]}
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="filter-section">
                                            <label>Story Points</label>
                                            <div className="filter-options">
                                                {['0', '1', '2', '3', '5', '8', '13'].map(sp => (
                                                    <label key={sp} className="filter-checkbox">
                                                        <input 
                                                            type="checkbox"
                                                            checked={filters.storyPoints.includes(sp)}
                                                            onChange={(e) => {
                                                                const newSP = e.target.checked 
                                                                    ? [...filters.storyPoints, sp]
                                                                    : filters.storyPoints.filter(x => x !== sp);
                                                                setFilters({ ...filters, storyPoints: newSP });
                                                            }}
                                                        />
                                                        {sp}
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="filter-section">
                                            <label>Due Date</label>
                                            <select 
                                                className="filter-input"
                                                value={filters.due}
                                                onChange={(e) => setFilters({ ...filters, due: e.target.value })}
                                            >
                                                <option value="">Any time</option>
                                                <option value="overdue">Overdue</option>
                                                <option value="today">Due Today</option>
                                                <option value="thisWeek">Due this week</option>
                                            </select>
                                        </div>

                                        {projects.length > 0 && (
                                            <div className="filter-footer">
                                                <button 
                                                    className="btn btn-muted btn-sm"
                                                    onClick={() => setFilters({
                                                        search: '',
                                                        assignees: [],
                                                        priorities: [],
                                                        statuses: [],
                                                        storyPoints: [],
                                                        due: ''
                                                    })}
                                                >
                                                    Reset Filters
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <select
                                className="project-filter"
                                value={selectedProject}
                                onChange={(e) => setSelectedProject(e.target.value)}
                            >
                                <option value="all">All Projects</option>
                                {projects.map(project => (
                                    <option key={project._id} value={project._id}>
                                        {project.name}
                                    </option>
                                ))}
                            </select>
                            {selectedProject !== 'all' && projectRole && (
                                <span className={`role-indicator ${isProjectAdmin ? 'role-admin' : 'role-member'}`}>
                                    {isProjectAdmin ? '🛡️ Admin' : '👤 Member'}
                                </span>
                            )}
                            {isProjectAdmin && pendingCount > 0 && (
                                <span className="pending-approvals-badge">
                                    ⏳ {pendingCount} Pending
                                </span>
                            )}
                            {isProjectAdmin && (
                                <button className="btn btn-primary" onClick={() => openCreateModal()}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                                        <line x1="12" y1="5" x2="12" y2="19" />
                                        <line x1="5" y1="12" x2="19" y2="12" />
                                    </svg>
                                    New Task
                                </button>
                            )}
                        </div>
                    </div>

                    {loading ? (
                        <div className="loading-container">
                            <div className="spinner"></div>
                            <p>Loading board...</p>
                        </div>
                    ) : (
                        <div className="kanban-board">
                            {COLUMNS.map(column => {
                                const stats = getColumnStats(column.id);
                                return (
                                    <div
                                        key={column.id}
                                        className={`kanban-column ${dragOverColumn === column.id ? 'drag-over' : ''}`}
                                        onDragOver={(e) => handleDragOver(e, column.id)}
                                        onDragLeave={handleDragLeave}
                                        onDrop={(e) => handleDrop(e, column.id)}
                                    >
                                        <div className="column-header" style={{ '--column-color': column.color }}>
                                            <div className="column-title">
                                                <span className="column-icon">{column.icon}</span>
                                                <h3>{column.title}</h3>
                                                <span className="column-count">{stats.count}</span>
                                            </div>
                                            {stats.points > 0 && (
                                                <span className="column-points">{stats.points} pts</span>
                                            )}
                                        </div>
                                        <div className="column-content">
                                            {getTasksByStatus(column.id).map(task => (
                                                <div
                                                    key={task._id}
                                                    className={`kanban-card ${task.approvalStatus === 'pending' ? 'has-pending-approval' : ''}`}
                                                    draggable={!(task.approvalStatus === 'pending' && !isProjectAdmin)}
                                                    onDragStart={(e) => handleDragStart(e, task)}
                                                    onDragEnd={handleDragEnd}
                                                    onClick={() => isProjectAdmin && openEditModal(task)}
                                                >
                                                    {/* Pending approval badge for this task */}
                                                    {task.approvalStatus === 'pending' && (
                                                        <div className="approval-pending-banner">
                                                            <div className="approval-info">
                                                                <span className="approval-icon">⏳</span>
                                                                <span className="approval-text">
                                                                    {task.approvalRequestedBy?.name || 'Member'} requests move to <strong>{STATUS_LABELS[task.requestedStatus] || task.requestedStatus}</strong>
                                                                </span>
                                                            </div>
                                                            {isProjectAdmin && (
                                                                <div className="approval-actions">
                                                                    <button
                                                                        className="btn-approve"
                                                                        onClick={(e) => handleApproval(e, task._id, 'approve')}
                                                                        title="Approve Move"
                                                                    >
                                                                        Approve
                                                                    </button>
                                                                    <button
                                                                        className="btn-reject"
                                                                        onClick={(e) => handleApproval(e, task._id, 'reject')}
                                                                        title="Reject Move"
                                                                    >
                                                                        Reject
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    <div className="kanban-card-header">
                                                        <span
                                                            className="priority-indicator"
                                                            style={{ backgroundColor: getPriorityColor(task.priority) }}
                                                            title={`${task.priority} priority`}
                                                        ></span>
                                                        {task.storyPoints > 0 && (
                                                            <span className="story-points">{task.storyPoints}</span>
                                                        )}
                                                    </div>
                                                    <h4 className="kanban-card-title">{task.title}</h4>
                                                    {task.description && (
                                                        <p className="kanban-card-desc">{task.description}</p>
                                                    )}
                                                    <div className="kanban-card-footer">
                                                        <div
                                                            className="project-tag"
                                                            style={{ backgroundColor: task.project?.color || '#6366f1' }}
                                                        >
                                                            {task.project?.name || 'No project'}
                                                        </div>
                                                        {task.assignee && (
                                                            <span className="task-assignee" title={`Assigned to ${task.assignee.name}`}>
                                                                {task.assignee.avatar
                                                                    ? <img src={task.assignee.avatar} alt={task.assignee.name} style={{ width: 20, height: 20, borderRadius: '50%', objectFit: 'cover' }} />
                                                                    : <span style={{ width: 20, height: 20, borderRadius: '50%', background: '#6366f1', color: '#fff', fontSize: 10, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{task.assignee.name?.charAt(0).toUpperCase()}</span>
                                                                }
                                                            </span>
                                                        )}
                                                        {task.dueDate && (
                                                            <span className="due-date">
                                                                📅 {new Date(task.dueDate).toLocaleDateString()}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Member: show "Request Move" buttons if no pending approval */}
                                                    {!isProjectAdmin && task.approvalStatus !== 'pending' && (
                                                        <div className="member-move-actions">
                                                            <span className="move-label">Move to:</span>
                                                            <select
                                                                className="member-status-select"
                                                                value={task.status}
                                                                onClick={(e) => e.stopPropagation()}
                                                                onChange={(e) => {
                                                                    e.stopPropagation();
                                                                    const targetStatus = e.target.value;
                                                                    if (targetStatus !== task.status) {
                                                                        taskService.updateStatus(task._id, targetStatus)
                                                                            .then(res => {
                                                                                if (res.message) alert(res.message);
                                                                                fetchData();
                                                                            })
                                                                            .catch(err => {
                                                                                alert(err.response?.data?.message || 'Failed to request');
                                                                            });
                                                                    }
                                                                }}
                                                            >
                                                                <option value={task.status} disabled>{STATUS_LABELS[task.status]}</option>
                                                                {getNextStatuses(task.status).map(targetStatus => (
                                                                    <option key={targetStatus} value={targetStatus}>
                                                                        {STATUS_LABELS[targetStatus]}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    )}

                                                    {/* Member: show waiting message if pending */}
                                                    {!isProjectAdmin && task.approvalStatus === 'pending' && (
                                                        <div className="member-waiting-badge">
                                                            ⏳ Waiting for admin approval
                                                        </div>
                                                    )}

                                                    {isProjectAdmin && (
                                                        <button
                                                            className="delete-card-btn"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeleteTask(task._id);
                                                            }}
                                                        >
                                                            ×
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                            {isProjectAdmin && (
                                                <button
                                                    className="add-task-btn"
                                                    onClick={() => openCreateModal(column.id)}
                                                >
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                                                        <line x1="12" y1="5" x2="12" y2="19" />
                                                        <line x1="5" y1="12" x2="19" y2="12" />
                                                    </svg>
                                                    Add Task
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
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
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Due Date</label>
                                    <input
                                        type="date"
                                        className="input"
                                        value={formData.dueDate}
                                        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Story Points</label>
                                    <select
                                        className="input"
                                        value={formData.storyPoints}
                                        onChange={(e) => setFormData({ ...formData, storyPoints: parseInt(e.target.value) || 0 })}
                                    >
                                        <option value="0">0</option>
                                        <option value="1">1</option>
                                        <option value="2">2</option>
                                        <option value="3">3</option>
                                        <option value="5">5</option>
                                        <option value="8">8</option>
                                        <option value="13">13</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Assign To</label>
                                <select
                                    className="input"
                                    value={formData.assignee}
                                    onChange={(e) => setFormData({ ...formData, assignee: e.target.value })}
                                >
                                    <option value="">— Unassigned —</option>
                                    {projectMembers.map(member => (
                                        <option key={member._id} value={member._id}>
                                            {member.name} {member.role === 'owner' ? '(Owner)' : `(${member.role})`}
                                        </option>
                                    ))}
                                </select>
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

export default KanbanBoard;
