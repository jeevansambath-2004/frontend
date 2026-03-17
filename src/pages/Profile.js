import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import './Pages.css';
import './Auth.css';

const getAvatarColor = (name) => {
    const colors = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];
    if (!name) return colors[0];
    return colors[name.charCodeAt(0) % colors.length];
};

const Profile = () => {
    const { user } = useAuth();
    const [codeCopied, setCodeCopied] = useState(false);

    const handleCopyCode = () => {
        if (user?.companyCode) {
            navigator.clipboard.writeText(user.companyCode);
            setCodeCopied(true);
            setTimeout(() => setCodeCopied(false), 2000);
        }
    };

    return (
        <div className="page">
            <Navbar />
            <main className="page-main">
                <div className="container" style={{ maxWidth: '680px' }}>
                    <h1 style={{ marginBottom: '2rem', fontSize: 'var(--text-2xl)', fontWeight: 700 }}>My Profile</h1>

                    {/* Profile Card */}
                    <div className="card" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                            {user?.avatar ? (
                                <img
                                    src={user.avatar}
                                    alt={user.name}
                                    style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover' }}
                                />
                            ) : (
                                <div style={{
                                    width: 80,
                                    height: 80,
                                    borderRadius: '50%',
                                    background: getAvatarColor(user?.name),
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '2rem',
                                    fontWeight: 700,
                                    color: '#fff',
                                    flexShrink: 0
                                }}>
                                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                                </div>
                            )}
                            <div>
                                <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: '4px' }}>{user?.name || 'User'}</h2>
                                <p style={{ color: 'var(--text-secondary)', marginBottom: '8px', fontSize: 'var(--text-sm)' }}>{user?.email}</p>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    <span style={{
                                        background: user?.role === 'admin' ? 'rgba(245,158,11,0.15)' : 'rgba(99,102,241,0.15)',
                                        color: user?.role === 'admin' ? '#f59e0b' : '#6366f1',
                                        padding: '3px 10px',
                                        borderRadius: '6px',
                                        fontSize: '12px',
                                        fontWeight: 600
                                    }}>
                                        {user?.role === 'admin' ? '👑 Admin / Team Leader' : '👤 Team Member'}
                                    </span>
                                    {user?.company && (
                                        <span style={{
                                            background: 'rgba(16,185,129,0.12)',
                                            color: '#10b981',
                                            padding: '3px 10px',
                                            borderRadius: '6px',
                                            fontSize: '12px',
                                            fontWeight: 600
                                        }}>
                                            🏢 {user.company}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Company Secret Code (Admins only) */}
                    {user?.role === 'admin' && user?.companyCode && (
                        <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                            <h3 style={{ fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                🔐 Company Secret Code
                            </h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: '14px', lineHeight: 1.6 }}>
                                Share this secret code with your team members so they can join your company workspace during registration.
                            </p>
                            <div className="company-code-box">
                                <span className="company-code-value">{user.companyCode}</span>
                                <button
                                    className="company-code-copy-btn"
                                    onClick={handleCopyCode}
                                >
                                    {codeCopied ? '✅ Copied!' : '📋 Copy Code'}
                                </button>
                            </div>
                            <p style={{ color: 'var(--text-tertiary)', fontSize: '11px', marginTop: '10px' }}>
                                ⚠️ Keep this code private — only share it with trusted team members.
                            </p>
                        </div>
                    )}

                    {/* Team Progress Link (Admins only) */}
                    {user?.role === 'admin' && (
                        <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                            <h3 style={{ fontWeight: 700, marginBottom: '8px' }}>📊 Team Progress</h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: '14px' }}>
                                Monitor your team members' task completion and workload across projects.
                            </p>
                            <Link to="/team-progress" style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                background: 'var(--accent-primary)',
                                color: '#fff',
                                padding: '9px 18px',
                                borderRadius: '10px',
                                fontWeight: 600,
                                fontSize: 'var(--text-sm)',
                                textDecoration: 'none',
                                transition: 'opacity 0.2s'
                            }}>
                                📊 View Team Progress →
                            </Link>
                        </div>
                    )}

                    {/* Info rows */}
                    <div className="card" style={{ padding: '1.5rem' }}>
                        <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>Account Details</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            {[
                                { label: 'Full Name', value: user?.name },
                                { label: 'Email', value: user?.email },
                                { label: 'Company', value: user?.company || '—' },
                                { label: 'Role', value: user?.role === 'admin' ? 'Admin / Team Leader' : 'Member' },
                                { label: 'Auth Method', value: user?.authProvider === 'google' ? 'Google' : 'Email & Password' },
                            ].map(({ label, value }) => (
                                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                                    <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>{label}</span>
                                    <span style={{ fontWeight: 500, fontSize: 'var(--text-sm)' }}>{value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Profile;
