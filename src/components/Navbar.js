import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import './Navbar.css';

const Navbar = () => {
    const { user, isAuthenticated, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <nav className="navbar">
            <div className="container navbar-container">
                <Link to="/" className="navbar-brand">
                    <div className="navbar-logo">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <span className="navbar-brand-text">ProjectFlow</span>
                </Link>

                <div className="navbar-links">
                    {isAuthenticated ? (
                        <>
                            <Link to="/dashboard" className="navbar-link">Dashboard</Link>
                            <Link to="/projects" className="navbar-link">Projects</Link>
                            <Link to="/tasks" className="navbar-link">Tasks</Link>
                            <Link to="/productivity" className="navbar-link">Productivity</Link>
                            <Link to="/messages" className="navbar-link">Messages</Link>
                            {user?.role === 'admin' && (
                                <>
                                    <Link to="/admin" className="navbar-link" style={{ color: '#f59e0b' }}>
                                        👑 Admin
                                    </Link>
                                </>
                            )}
                            <Link to="/feedback" className="navbar-link">Feedback</Link>
                        </>
                    ) : (
                        <>
                            <a href="#features" className="navbar-link">Features</a>
                            <a href="#pricing" className="navbar-link">Pricing</a>
                            <a href="#about" className="navbar-link">About</a>
                            <a href="#feedback" className="navbar-link">Feedback</a>
                        </>
                    )}
                </div>

                <div className="navbar-actions">
                    <button onClick={toggleTheme} className="btn btn-ghost theme-toggle" aria-label="Toggle theme">
                        {theme === 'dark' ? '☀️' : '🌙'}
                    </button>
                    {isAuthenticated ? (
                        <>
                            <Link to="/profile" className="navbar-user">
                                <div className="navbar-avatar">
                                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                                </div>
                                <div className="navbar-user-info">
                                    <span className="navbar-username">{user?.name}</span>
                                    <span className="navbar-company">{user?.company || ''}</span>
                                </div>
                                {user?.role === 'admin' && (
                                    <span className="navbar-role-badge admin-badge">Admin</span>
                                )}
                                {user?.role === 'user' && (
                                    <span className="navbar-role-badge member-badge">Member</span>
                                )}
                            </Link>
                            <button onClick={handleLogout} className="btn btn-ghost">
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="btn btn-ghost">Sign In</Link>
                            <Link to="/register" className="btn btn-primary">Get Started</Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
