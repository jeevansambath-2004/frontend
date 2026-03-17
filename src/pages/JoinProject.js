import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import projectService from '../services/projectService';
import Navbar from '../components/Navbar';
import './Pages.css';

const JoinProject = () => {
    const { inviteCode } = useParams();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [joining, setJoining] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        fetchProjectInfo();
    }, [inviteCode]);

    const fetchProjectInfo = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await projectService.getByInviteCode(inviteCode);
            setProject(response.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid or expired invite link');
        } finally {
            setLoading(false);
        }
    };

    const handleJoinProject = async () => {
        if (!isAuthenticated) {
            // Store invite code and redirect to login
            localStorage.setItem('pendingInvite', inviteCode);
            navigate('/login');
            return;
        }

        try {
            setJoining(true);
            setError('');
            await projectService.joinProject(inviteCode);
            setSuccess(true);
            setTimeout(() => {
                navigate('/projects');
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to join project');
        } finally {
            setJoining(false);
        }
    };

    return (
        <div className="page">
            <Navbar />
            <main className="page-main">
                <div className="container">
                    <div className="join-project-container">
                        {loading ? (
                            <div className="join-project-card">
                                <div className="loading-container">
                                    <div className="spinner"></div>
                                    <p>Loading project info...</p>
                                </div>
                            </div>
                        ) : error && !project ? (
                            <div className="join-project-card">
                                <div className="join-project-error">
                                    <div className="error-icon">❌</div>
                                    <h2>Invalid Invite Link</h2>
                                    <p>{error}</p>
                                    <Link to="/" className="btn btn-primary">
                                        Go to Homepage
                                    </Link>
                                </div>
                            </div>
                        ) : success ? (
                            <div className="join-project-card">
                                <div className="join-project-success">
                                    <div className="success-icon">✅</div>
                                    <h2>Successfully Joined!</h2>
                                    <p>You are now a member of <strong>{project?.name}</strong></p>
                                    <p className="text-muted">Redirecting to projects...</p>
                                </div>
                            </div>
                        ) : (
                            <div className="join-project-card">
                                <div
                                    className="join-project-color-bar"
                                    style={{ backgroundColor: project?.color || '#6366f1' }}
                                ></div>
                                <div className="join-project-content">
                                    <h2>You're invited to join</h2>
                                    <h1 className="join-project-name">{project?.name}</h1>
                                    {project?.description && (
                                        <p className="join-project-description">{project.description}</p>
                                    )}
                                    <div className="join-project-info">
                                        <div className="info-item">
                                            <span className="info-label">Created by</span>
                                            <span className="info-value">{project?.ownerName}</span>
                                        </div>
                                        <div className="info-item">
                                            <span className="info-label">Team Size</span>
                                            <span className="info-value">{project?.memberCount} members</span>
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="alert alert-error">
                                            {error}
                                        </div>
                                    )}

                                    <div className="join-project-actions">
                                        {isAuthenticated ? (
                                            <button
                                                className="btn btn-primary btn-lg"
                                                onClick={handleJoinProject}
                                                disabled={joining}
                                            >
                                                {joining ? 'Joining...' : 'Join Project'}
                                            </button>
                                        ) : (
                                            <>
                                                <button
                                                    className="btn btn-primary btn-lg"
                                                    onClick={handleJoinProject}
                                                >
                                                    Sign in to Join
                                                </button>
                                                <p className="join-project-hint">
                                                    Don't have an account? <Link to="/register">Sign up</Link>
                                                </p>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default JoinProject;
