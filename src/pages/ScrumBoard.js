import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import taskService from '../services/taskService';
import projectService from '../services/projectService';
import sprintService from '../services/sprintService';
import './Pages.css';
import './ScrumBoard.css';

const STATUSES = [
    { id: 'todo', title: 'To Do', icon: '📋' },
    { id: 'in-progress', title: 'In Progress', icon: '🔄' },
    { id: 'review', title: 'Review', icon: '👀' },
    { id: 'done', title: 'Done', icon: '✅' }
];

const STATUS_LABELS = {
    'todo': 'To Do',
    'in-progress': 'In Progress',
    'review': 'Review',
    'done': 'Done'
};

const ScrumBoard = () => {
    const { user } = useAuth();
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState(null);
    const [sprints, setSprints] = useState([]);
    const [activeSprint, setActiveSprint] = useState(null);
    const [sprintTasks, setSprintTasks] = useState([]);
    const [backlogTasks, setBacklogTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('sprint'); // 'sprint' or 'backlog'

    // Modals
    const [showSprintModal, setShowSprintModal] = useState(false);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [editingSprint, setEditingSprint] = useState(null);
    const [editingTask, setEditingTask] = useState(null);
    const [saving, setSaving] = useState(false);
    const [projectRole, setProjectRole] = useState(null);
    const [pendingCount, setPendingCount] = useState(0);

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

    // Check if user is admin/owner
    const isProjectAdmin = user?.role === 'admin' || projectRole === 'owner' || projectRole === 'admin';

    // Form data
    const [sprintForm, setSprintForm] = useState({
        name: '',
        goal: '',
        startDate: '',
        endDate: ''
    });

    const [projectMembers, setProjectMembers] = useState([]);

    const [taskForm, setTaskForm] = useState({
        title: '',
        description: '',
        priority: 'medium',
        status: 'todo',
        dueDate: '',
        storyPoints: 0,
        assignee: ''
    });

    useEffect(() => {
        fetchProjects();
    }, []);

    useEffect(() => {
        if (selectedProject) {
            fetchProjectData();
            // Fetch role
            const fetchRole = async () => {
                try {
                    const roleRes = await projectService.getUserRole(selectedProject);
                    setProjectRole(roleRes.data?.role || 'member');
                } catch (error) {
                    console.error('Error fetching project role:', error);
                    setProjectRole('member');
                }
            };
            fetchRole();
            // Load project members for assignee dropdown
            const loadMembers = async () => {
                try {
                    const members = await projectService.getMembers(selectedProject);
                    setProjectMembers(members);
                } catch {
                    setProjectMembers([]);
                }
            };
            loadMembers();
        }
    }, [selectedProject]);

    // Count pending approvals
    useEffect(() => {
        const fetchPendingCount = async () => {
            if (isProjectAdmin && selectedProject) {
                try {
                    const res = await taskService.getPendingApprovals(selectedProject);
                    setPendingCount(res.count || 0);
                } catch {
                    setPendingCount(0);
                }
            } else {
                setPendingCount(0);
            }
        };
        if (isProjectAdmin) {
            fetchPendingCount();
        }
    }, [selectedProject, isProjectAdmin, sprintTasks, backlogTasks]);

    const fetchProjects = async () => {
        try {
            const response = await projectService.getAll();
            setProjects(response.data || []);
            if (response.data && response.data.length > 0) {
                setSelectedProject(response.data[0]._id);
            }
        } catch (error) {
            console.error('Error fetching projects:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchProjectData = async () => {
        try {
            setLoading(true);
            const [sprintsRes, activeSprintRes, backlogRes] = await Promise.all([
                sprintService.getByProject(selectedProject),
                sprintService.getActive(selectedProject),
                taskService.getBacklog(selectedProject)
            ]);

            setSprints(sprintsRes.data || []);
            setActiveSprint(activeSprintRes.data);
            setBacklogTasks(backlogRes.data || []);

            if (activeSprintRes.data) {
                const tasksRes = await taskService.getBySprint(activeSprintRes.data._id);
                setSprintTasks(tasksRes.data || []);
            } else {
                setSprintTasks([]);
            }
        } catch (error) {
            console.error('Error fetching project data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Filter logic helper
    const applyFilters = (task) => {
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
    };

    const filteredSprintTasks = sprintTasks.filter(applyFilters);
    const filteredBacklogTasks = backlogTasks.filter(applyFilters);

    // Filter uniquely by current projects tasks assignees
    const uniqueAssignees = Array.from(new Map([...sprintTasks, ...backlogTasks]
        .filter(t => t.assignee)
        .map(t => {
            const id = t.assignee._id || t.assignee;
            const name = t.assignee.name || 'Unknown User';
            return [id, { _id: id, name }];
        })).values());

    const getTasksByStatus = useCallback((status) => {
        return filteredSprintTasks.filter(task => task.status === status);
    }, [filteredSprintTasks]);

    const handleDragStart = (e, task) => {
        // Prevent dragging if task has pending approval (for members)
        if (!isProjectAdmin && task.approvalStatus === 'pending') {
            e.preventDefault();
            return;
        }
        e.dataTransfer.setData('taskId', task._id);
        e.target.classList.add('dragging');
    };

    const handleDragEnd = (e) => {
        e.target.classList.remove('dragging');
    };

    const handleDrop = async (e, newStatus) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData('taskId');
        const task = sprintTasks.find(t => t._id === taskId);

        if (!task || task.status === newStatus) return;

        if (isProjectAdmin) {
            // Admin: update status directly (optimistic update)
            setSprintTasks(prev => prev.map(t =>
                t._id === taskId ? { ...t, status: newStatus } : t
            ));

            try {
                await taskService.updateStatus(taskId, newStatus);
            } catch (error) {
                console.error('Error updating task:', error);
                fetchProjectData();
            }
        } else {
            // Member: create approval request
            try {
                const res = await taskService.updateStatus(taskId, newStatus);
                if (res.message) {
                    alert(res.message);
                }
                fetchProjectData();
            } catch (error) {
                console.error('Error requesting stage change:', error);
                alert(error.response?.data?.message || 'Failed to request stage change');
            }
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    // Handle approval action (admin only)
    const handleApproval = async (e, taskId, action) => {
        e.stopPropagation();

        // Optimistic update
        const updateTaskInList = (list) => list.map(t => 
            t._id === taskId 
                ? { 
                    ...t, 
                    approvalStatus: 'none', 
                    status: action === 'approve' ? (t.requestedStatus || t.status) : t.status,
                    requestedStatus: null
                  } 
                : t
        );

        setSprintTasks(prev => updateTaskInList(prev));
        setBacklogTasks(prev => updateTaskInList(prev));

        try {
            if (action === 'approve') {
                await taskService.approveStage(taskId);
            } else if (action === 'reject') {
                await taskService.rejectStage(taskId);
            }
            fetchProjectData();
        } catch (error) {
            console.error('Error processing approval:', error);
            alert(error.response?.data?.message || 'Failed to process approval');
            fetchProjectData(); // Rollback
        }
    };

    // Get the next possible statuses for a task
    const getNextStatuses = (currentStatus) => {
        const statusOrder = ['todo', 'in-progress', 'review', 'done'];
        return statusOrder.filter(s => s !== currentStatus);
    };

    // Sprint Modal Functions
    const openSprintModal = (sprint = null) => {
        setEditingSprint(sprint);
        if (sprint) {
            setSprintForm({
                name: sprint.name,
                goal: sprint.goal || '',
                startDate: sprint.startDate?.split('T')[0] || '',
                endDate: sprint.endDate?.split('T')[0] || ''
            });
        } else {
            const today = new Date();
            const twoWeeksLater = new Date(today);
            twoWeeksLater.setDate(today.getDate() + 14);

            setSprintForm({
                name: `Sprint ${sprints.length + 1}`,
                goal: '',
                startDate: today.toISOString().split('T')[0],
                endDate: twoWeeksLater.toISOString().split('T')[0]
            });
        }
        setShowSprintModal(true);
    };

    const handleSprintSubmit = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            if (editingSprint) {
                await sprintService.update(editingSprint._id, sprintForm);
            } else {
                await sprintService.create({ ...sprintForm, project: selectedProject });
            }
            setShowSprintModal(false);
            fetchProjectData();
        } catch (error) {
            console.error('Error saving sprint:', error);
            alert('Failed to save sprint');
        } finally {
            setSaving(false);
        }
    };

    const handleStartSprint = async (sprintId) => {
        try {
            await sprintService.start(sprintId);
            fetchProjectData();
        } catch (error) {
            console.error('Error starting sprint:', error);
        }
    };

    const handleCompleteSprint = async () => {
        if (!window.confirm('Complete this sprint? Incomplete tasks will be moved back to the backlog.')) return;
        try {
            await sprintService.complete(activeSprint._id);
            fetchProjectData();
        } catch (error) {
            console.error('Error completing sprint:', error);
        }
    };

    const handleDeleteSprint = async (sprintId) => {
        if (!window.confirm('Delete this sprint? Tasks will be moved back to the backlog.')) return;
        try {
            await sprintService.delete(sprintId);
            fetchProjectData();
        } catch (error) {
            console.error('Error deleting sprint:', error);
        }
    };

    // Task Modal Functions
    const openTaskModal = (task = null, status = 'todo') => {
        setEditingTask(task);
        if (task) {
            setTaskForm({
                title: task.title,
                description: task.description || '',
                priority: task.priority,
                status: task.status,
                dueDate: task.dueDate?.split('T')[0] || '',
                storyPoints: task.storyPoints || 0,
                assignee: task.assignee?._id || task.assignee || ''
            });
        } else {
            setTaskForm({
                title: '',
                description: '',
                priority: 'medium',
                status: status,
                dueDate: '',
                storyPoints: 0,
                assignee: ''
            });
        }
        setShowTaskModal(true);
    };

    const handleTaskSubmit = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            
            const taskData = { ...taskForm };
            if (!taskData.assignee) delete taskData.assignee;
            if (!taskData.dueDate) delete taskData.dueDate;
            
            if (editingTask) {
                await taskService.update(editingTask._id, taskData);
            } else {
                await taskService.create({
                    ...taskData,
                    project: selectedProject,
                    sprint: view === 'sprint' && activeSprint ? activeSprint._id : undefined
                });
            }
            setShowTaskModal(false);
            fetchProjectData();
        } catch (error) {
            console.error('Error saving task:', error);
            alert(error.response?.data?.message || 'Failed to save task');
        } finally {
            setSaving(false);
        }
    };

    const handleMoveToSprint = async (taskId) => {
        if (!activeSprint) {
            alert('No active sprint. Please start a sprint first.');
            return;
        }
        try {
            await taskService.assignToSprint(taskId, activeSprint._id);
            fetchProjectData();
        } catch (error) {
            console.error('Error moving task to sprint:', error);
        }
    };

    const handleMoveToBacklog = async (taskId) => {
        try {
            await taskService.assignToSprint(taskId, null);
            fetchProjectData();
        } catch (error) {
            console.error('Error moving task to backlog:', error);
        }
    };

    const handleDeleteTask = async (taskId) => {
        if (!window.confirm('Delete this task?')) return;
        try {
            await taskService.delete(taskId);
            fetchProjectData();
        } catch (error) {
            console.error('Error deleting task:', error);
        }
    };

    // Stats
    const getSprintStats = () => {
        const total = filteredSprintTasks.length;
        const completed = filteredSprintTasks.filter(t => t.status === 'done').length;
        const totalPoints = filteredSprintTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
        const completedPoints = filteredSprintTasks.filter(t => t.status === 'done')
            .reduce((sum, t) => sum + (t.storyPoints || 0), 0);

        return { total, completed, totalPoints, completedPoints };
    };

    // Compute story points per member from sprint tasks
    const getMemberPoints = () => {
        const membersMap = {};
        filteredSprintTasks.forEach(task => {
            if (!task.assignee) return;
            const id = task.assignee._id || task.assignee;
            if (!membersMap[id]) {
                membersMap[id] = {
                    user: task.assignee,
                    totalPoints: 0,
                    earnedPoints: 0, // in-progress + review + done
                    donePoints: 0,
                    inProgressPoints: 0,
                    reviewPoints: 0,
                    todoPoints: 0,
                    totalTasks: 0,
                    doneTasks: 0
                };
            }
            const sp = task.storyPoints || 0;
            membersMap[id].totalPoints += sp;
            membersMap[id].totalTasks += 1;
            if (task.status === 'done') {
                membersMap[id].donePoints += sp;
                membersMap[id].earnedPoints += sp;
                membersMap[id].doneTasks += 1;
            } else if (task.status === 'in-progress') {
                membersMap[id].inProgressPoints += sp;
                membersMap[id].earnedPoints += sp;
            } else if (task.status === 'review') {
                membersMap[id].reviewPoints += sp;
                membersMap[id].earnedPoints += sp;
            } else {
                membersMap[id].todoPoints += sp;
            }
        });
        return Object.values(membersMap).sort((a, b) => b.earnedPoints - a.earnedPoints);
    };

    const getDaysRemaining = () => {
        if (!activeSprint?.endDate) return null;
        const end = new Date(activeSprint.endDate);
        const now = new Date();
        const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
        return diff;
    };

    const stats = getSprintStats();
    const daysRemaining = getDaysRemaining();
    const progress = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;
    const memberPoints = getMemberPoints();

    return (
        <div className="page">
            <Navbar />
            <main className="page-main">
                <div className="container">
                    <div className="scrum-header">
                        <div className="scrum-header-left">
                            <h1>Scrum Board</h1>
                            <p className="scrum-subtitle">Manage sprints and track team velocity</p>
                        </div>
                        <div className="scrum-header-right">
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
                                    </div>
                                )}
                            </div>

                            <select
                                className="project-filter"
                                value={selectedProject || ''}
                                onChange={(e) => setSelectedProject(e.target.value)}
                            >
                                {projects.map(project => (
                                    <option key={project._id} value={project._id}>
                                        {project.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {loading ? (
                        <div className="loading-container">
                            <div className="spinner"></div>
                            <p>Loading scrum board...</p>
                        </div>
                    ) : !selectedProject ? (
                        <div className="empty-state-large">
                            <div className="empty-icon">📊</div>
                            <h2>No projects found</h2>
                            <p>Create a project first to use the Scrum Board.</p>
                        </div>
                    ) : (
                        <>
                            {/* View Toggle & Actions */}
                            <div className="scrum-controls">
                                <div className="view-toggle">
                                    <button
                                        className={`toggle-btn ${view === 'sprint' ? 'active' : ''}`}
                                        onClick={() => setView('sprint')}
                                    >
                                        🏃 Active Sprint
                                    </button>
                                    <button
                                        className={`toggle-btn ${view === 'backlog' ? 'active' : ''}`}
                                        onClick={() => setView('backlog')}
                                    >
                                        📋 Backlog ({filteredBacklogTasks.length})
                                    </button>
                                </div>
                                <div className="scrum-actions">
                                    {view === 'sprint' && activeSprint && isProjectAdmin && (
                                        <button className="btn btn-warning" onClick={handleCompleteSprint}>
                                            ✓ Complete Sprint
                                        </button>
                                    )}
                                    {isProjectAdmin && (
                                        <button className="btn btn-secondary" onClick={() => openSprintModal()}>
                                            + New Sprint
                                        </button>
                                    )}
                                    {isProjectAdmin && (
                                        <button className="btn btn-primary" onClick={() => openTaskModal()}>
                                            + New Task
                                        </button>
                                    )}
                                    {selectedProject && projectRole && (
                                        <span className={`role-indicator ${isProjectAdmin ? 'role-admin' : 'role-member'}`}>
                                            {isProjectAdmin ? '🛡️ Admin' : '👤 Member'}
                                        </span>
                                    )}
                                    {isProjectAdmin && pendingCount > 0 && (
                                        <span className="pending-approvals-badge">
                                            ⏳ {pendingCount} Pending
                                        </span>
                                    )}
                                </div>
                            </div>

                            {view === 'sprint' ? (
                                <>
                                    {/* Sprint Info Card */}
                                    {activeSprint ? (
                                        <div className="sprint-info-card">
                                            <div className="sprint-info-header">
                                                <div className="sprint-title-section">
                                                    <span className="sprint-badge">Active Sprint</span>
                                                    <h2>{activeSprint.name}</h2>
                                                    {activeSprint.goal && (
                                                        <p className="sprint-goal">{activeSprint.goal}</p>
                                                    )}
                                                </div>
                                                <div className="sprint-meta">
                                                    <div className="meta-item">
                                                        <span className="meta-label">Dates</span>
                                                        <span className="meta-value">
                                                            {new Date(activeSprint.startDate).toLocaleDateString()} - {new Date(activeSprint.endDate).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    {daysRemaining !== null && (
                                                        <div className={`days-remaining ${daysRemaining < 3 ? 'urgent' : ''}`}>
                                                            <span className="days-number">{daysRemaining}</span>
                                                            <span className="days-label">days left</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="sprint-progress-section">
                                                <div className="progress-stats">
                                                    <div className="stat">
                                                        <span className="stat-value">{stats.completed}/{stats.total}</span>
                                                        <span className="stat-label">Tasks</span>
                                                    </div>
                                                    <div className="stat">
                                                        <span className="stat-value">{stats.completedPoints}/{stats.totalPoints}</span>
                                                        <span className="stat-label">Story Points</span>
                                                    </div>
                                                    <div className="stat">
                                                        <span className="stat-value">{Math.round(progress)}%</span>
                                                        <span className="stat-label">Complete</span>
                                                    </div>
                                                </div>
                                                <div className="progress-bar-container">
                                                    <div className="progress-bar" style={{ width: `${progress}%` }}></div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="no-sprint-message">
                                            <div className="no-sprint-icon">🏃</div>
                                            <h3>No Active Sprint</h3>
                                            <p>Start a sprint to begin tracking your team's work.</p>
                                            {sprints.filter(s => s.status === 'planning').length > 0 ? (
                                                <div className="planned-sprints">
                                                    <h4>Planned Sprints</h4>
                                                    {sprints.filter(s => s.status === 'planning').map(sprint => (
                                                        <div key={sprint._id} className="planned-sprint-item">
                                                            <span>{sprint.name}</span>
                                                            <div className="planned-sprint-actions">
                                                                <button
                                                                    className="btn btn-sm btn-primary"
                                                                    onClick={() => handleStartSprint(sprint._id)}
                                                                >
                                                                    Start
                                                                </button>
                                                                <button
                                                                    className="btn btn-sm btn-secondary"
                                                                    onClick={() => openSprintModal(sprint)}
                                                                >
                                                                    Edit
                                                                </button>
                                                                <button
                                                                    className="btn btn-sm btn-danger"
                                                                    onClick={() => handleDeleteSprint(sprint._id)}
                                                                >
                                                                    Delete
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <button className="btn btn-primary" onClick={() => openSprintModal()}>
                                                    Create Your First Sprint
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    {/* Member Story Points */}
                                    {activeSprint && memberPoints.length > 0 && (
                                        <div className="member-points-section">
                                            <h3 className="member-points-title">📊 Member Story Points</h3>
                                            <div className="member-points-grid">
                                                {memberPoints.map(mp => (
                                                    <div key={mp.user._id || mp.user} className="member-points-card">
                                                        <div className="mp-header">
                                                            <div className="mp-user-info">
                                                                {mp.user.avatar
                                                                    ? <img src={mp.user.avatar} alt={mp.user.name} className="mp-avatar" />
                                                                    : <span className="mp-avatar mp-avatar-initial">{mp.user.name?.charAt(0).toUpperCase()}</span>
                                                                }
                                                                <span className="mp-name">{mp.user.name || 'Unknown'}</span>
                                                            </div>
                                                            <div className="mp-earned-badge">
                                                                <span className="mp-earned-num">{mp.earnedPoints}</span>
                                                                <span className="mp-earned-label">SP</span>
                                                            </div>
                                                        </div>
                                                        <div className="mp-progress-bar">
                                                            <div className="mp-progress-track">
                                                                {mp.totalPoints > 0 && (
                                                                    <>
                                                                        <div className="mp-bar-done" style={{ width: `${(mp.donePoints / mp.totalPoints) * 100}%` }} title={`Done: ${mp.donePoints} SP`}></div>
                                                                        <div className="mp-bar-review" style={{ width: `${(mp.reviewPoints / mp.totalPoints) * 100}%` }} title={`Review: ${mp.reviewPoints} SP`}></div>
                                                                        <div className="mp-bar-inprogress" style={{ width: `${(mp.inProgressPoints / mp.totalPoints) * 100}%` }} title={`In Progress: ${mp.inProgressPoints} SP`}></div>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="mp-breakdown">
                                                            <span className="mp-stat" title="Done">✅ {mp.donePoints}</span>
                                                            <span className="mp-stat" title="Review">👀 {mp.reviewPoints}</span>
                                                            <span className="mp-stat" title="In Progress">🔄 {mp.inProgressPoints}</span>
                                                            <span className="mp-stat" title="To Do">📋 {mp.todoPoints}</span>
                                                            <span className="mp-stat-total">/ {mp.totalPoints} SP</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Sprint Board */}
                                    {activeSprint && (
                                        <div className="sprint-board">
                                            {STATUSES.map(status => (
                                                <div
                                                    key={status.id}
                                                    className="sprint-column"
                                                    onDragOver={handleDragOver}
                                                    onDrop={(e) => handleDrop(e, status.id)}
                                                >
                                                    <div className="sprint-column-header">
                                                        <span className="status-icon">{status.icon}</span>
                                                        <h3>{status.title}</h3>
                                                        <span className="task-count">{getTasksByStatus(status.id).length}</span>
                                                    </div>
                                                    <div className="sprint-column-content">
                                                        {getTasksByStatus(status.id).map(task => (
                                                            <div
                                                                key={task._id}
                                                                className={`sprint-task-card ${task.approvalStatus === 'pending' ? 'has-pending-approval' : ''}`}
                                                                draggable={!(task.approvalStatus === 'pending' && !isProjectAdmin)}
                                                                onDragStart={(e) => handleDragStart(e, task)}
                                                                onDragEnd={handleDragEnd}
                                                                onClick={() => isProjectAdmin && openTaskModal(task)}
                                                            >
                                                                {/* Pending approval badge */}
                                                                {task.approvalStatus === 'pending' && (
                                                                    <div className="approval-pending-banner">
                                                                        <div className="approval-info">
                                                                            <span className="approval-icon">⏳</span>
                                                                            <span className="approval-text">
                                                                                {task.approvalRequestedBy?.name || 'Member'} → <strong>{STATUS_LABELS[task.requestedStatus] || task.requestedStatus}</strong>
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

                                                                <div className="task-card-top">
                                                                    <span className={`priority-dot priority-${task.priority}`}></span>
                                                                    {task.storyPoints > 0 && (
                                                                        <span className="sp-badge">{task.storyPoints} SP</span>
                                                                    )}
                                                                </div>
                                                                <h4>{task.title}</h4>
                                                                {task.description && (
                                                                    <p className="task-desc">{task.description}</p>
                                                                )}
                                                                <div className="task-card-bottom">
                                                                    {task.assignee && (
                                                                        <span className="task-assignee" title={`Assigned to ${task.assignee.name}`}>
                                                                            {task.assignee.avatar
                                                                                ? <img src={task.assignee.avatar} alt={task.assignee.name} style={{ width: 20, height: 20, borderRadius: '50%', objectFit: 'cover' }} />
                                                                                : <span style={{ width: 20, height: 20, borderRadius: '50%', background: '#6366f1', color: '#fff', fontSize: 10, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{task.assignee.name?.charAt(0).toUpperCase()}</span>
                                                                            }
                                                                        </span>
                                                                    )}
                                                                    {task.dueDate && (
                                                                        <span className="due-badge">
                                                                            📅 {new Date(task.dueDate).toLocaleDateString()}
                                                                        </span>
                                                                    )}
                                                                    <button
                                                                        className="move-btn"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleMoveToBacklog(task._id);
                                                                        }}
                                                                        title="Move to backlog"
                                                                    >
                                                                        ↩
                                                                    </button>
                                                                </div>

                                                                {/* Member: show "Move to" buttons if no pending approval */}
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
                                                                                            fetchProjectData();
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

                                                                {/* Member: waiting message if pending */}
                                                                {!isProjectAdmin && task.approvalStatus === 'pending' && (
                                                                    <div className="member-waiting-badge">
                                                                        ⏳ Waiting for admin approval
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            ) : (
                                /* Backlog View */
                                <div className="backlog-section">
                                    <div className="backlog-header">
                                        <h2>Product Backlog</h2>
                                        <span className="backlog-count">{filteredBacklogTasks.length} items</span>
                                    </div>
                                    {filteredBacklogTasks.length === 0 ? (
                                        <div className="empty-backlog">
                                            <p>No tasks found in backlog matching filters.</p>
                                            {/* Original button for adding task if backlog was empty, now only if no tasks match filters */}
                                            {backlogTasks.length === 0 && (
                                                <button className="btn btn-primary" onClick={() => openTaskModal()}>
                                                    + Add Task
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="backlog-list">
                                            {filteredBacklogTasks.map(task => (
                                                <div key={task._id} className={`backlog-item ${task.approvalStatus === 'pending' ? 'has-pending-approval' : ''}`}>
                                                    <div className="backlog-item-left">
                                                        <span className={`priority-dot priority-${task.priority}`}></span>
                                                        <div className="backlog-item-info">
                                                            <h4>{task.title}</h4>
                                                            {task.description && <p>{task.description}</p>}
                                                        </div>
                                                    </div>
                                                    <div className="backlog-item-right">
                                                        {task.storyPoints > 0 && (
                                                            <span className="sp-badge">{task.storyPoints} SP</span>
                                                        )}
                                                        <span className={`status-badge status-${task.status}`}>
                                                            {task.status.replace('-', ' ')}
                                                        </span>

                                                        {/* Approval pending indicator in backlog */}
                                                        {task.approvalStatus === 'pending' && (
                                                            <div className="backlog-approval-indicator">
                                                                <span className="approval-badge-inline">
                                                                    ⏳ {task.approvalRequestedBy?.name || 'Member'} → {STATUS_LABELS[task.requestedStatus]}
                                                                </span>
                                                                {isProjectAdmin && (
                                                                    <div className="approval-actions" style={{ marginLeft: '10px' }}>
                                                                        <button
                                                                            className="btn-approve btn-approve-sm"
                                                                            onClick={(e) => handleApproval(e, task._id, 'approve')}
                                                                            title="Approve Move"
                                                                            style={{ padding: '2px 8px', fontSize: '10px' }}
                                                                        >
                                                                            Approve
                                                                        </button>
                                                                        <button
                                                                            className="btn-reject btn-reject-sm"
                                                                            onClick={(e) => handleApproval(e, task._id, 'reject')}
                                                                            title="Reject Move"
                                                                            style={{ padding: '2px 8px', fontSize: '10px' }}
                                                                        >
                                                                            Reject
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}

                                                        <div className="backlog-item-actions">
                                                            {isProjectAdmin && activeSprint && (
                                                                <button
                                                                    className="btn btn-sm btn-primary"
                                                                    onClick={() => handleMoveToSprint(task._id)}
                                                                >
                                                                    → Sprint
                                                                </button>
                                                            )}
                                                            {isProjectAdmin && (
                                                                <button
                                                                    className="btn btn-sm btn-secondary"
                                                                    onClick={() => openTaskModal(task)}
                                                                >
                                                                    Edit
                                                                </button>
                                                            )}
                                                            {isProjectAdmin && (
                                                                <button
                                                                    className="btn btn-sm btn-danger"
                                                                    onClick={() => handleDeleteTask(task._id)}
                                                                >
                                                                    ×
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>

            {/* Sprint Modal */}
            {showSprintModal && (
                <div className="modal-overlay" onClick={() => setShowSprintModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingSprint ? 'Edit Sprint' : 'Create New Sprint'}</h2>
                            <button className="modal-close" onClick={() => setShowSprintModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleSprintSubmit} className="modal-form">
                            <div className="form-group">
                                <label>Sprint Name *</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={sprintForm.name}
                                    onChange={(e) => setSprintForm({ ...sprintForm, name: e.target.value })}
                                    placeholder="e.g., Sprint 1"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Sprint Goal</label>
                                <textarea
                                    className="input textarea"
                                    value={sprintForm.goal}
                                    onChange={(e) => setSprintForm({ ...sprintForm, goal: e.target.value })}
                                    placeholder="What do you want to achieve in this sprint?"
                                    rows={3}
                                />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Start Date *</label>
                                    <input
                                        type="date"
                                        className="input"
                                        value={sprintForm.startDate}
                                        onChange={(e) => setSprintForm({ ...sprintForm, startDate: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>End Date *</label>
                                    <input
                                        type="date"
                                        className="input"
                                        value={sprintForm.endDate}
                                        onChange={(e) => setSprintForm({ ...sprintForm, endDate: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowSprintModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving ? 'Saving...' : (editingSprint ? 'Update Sprint' : 'Create Sprint')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Task Modal */}
            {showTaskModal && (
                <div className="modal-overlay" onClick={() => setShowTaskModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingTask ? 'Edit Task' : 'Create New Task'}</h2>
                            <button className="modal-close" onClick={() => setShowTaskModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleTaskSubmit} className="modal-form">
                            <div className="form-group">
                                <label>Task Title *</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={taskForm.title}
                                    onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                                    placeholder="Enter task title"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    className="input textarea"
                                    value={taskForm.description}
                                    onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                                    placeholder="Enter task description"
                                    rows={3}
                                />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Priority</label>
                                    <select
                                        className="input"
                                        value={taskForm.priority}
                                        onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Story Points</label>
                                    <select
                                        className="input"
                                        value={taskForm.storyPoints}
                                        onChange={(e) => setTaskForm({ ...taskForm, storyPoints: parseInt(e.target.value) || 0 })}
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
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Status</label>
                                    <select
                                        className="input"
                                        value={taskForm.status}
                                        onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}
                                    >
                                        <option value="todo">To Do</option>
                                        <option value="in-progress">In Progress</option>
                                        <option value="review">Review</option>
                                        <option value="done">Done</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Due Date</label>
                                    <input
                                        type="date"
                                        className="input"
                                        value={taskForm.dueDate}
                                        onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Assign To</label>
                                <select
                                    className="input"
                                    value={taskForm.assignee}
                                    onChange={(e) => setTaskForm({ ...taskForm, assignee: e.target.value })}
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
                                <button type="button" className="btn btn-secondary" onClick={() => setShowTaskModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving ? 'Saving...' : (editingTask ? 'Update Task' : 'Create Task')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ScrumBoard;
