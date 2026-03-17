import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import authService from '../services/authService';
import './Auth.css';

const Register = () => {
    const [mode, setMode] = useState('join'); // 'join' = member via code, 'create' = admin creating company
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        company: '',
        companyCode: '',
        password: '',
        confirmPassword: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [passwordError, setPasswordError] = useState('');
    const [companyPreview, setCompanyPreview] = useState(null);
    const [codeChecking, setCodeChecking] = useState(false);
    const [codeError, setCodeError] = useState('');
    const { register, googleLogin, loading, error } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });

        if (name === 'confirmPassword' || name === 'password') {
            const pw = name === 'password' ? value : formData.password;
            const cpw = name === 'confirmPassword' ? value : formData.confirmPassword;
            setPasswordError(cpw && pw !== cpw ? 'Passwords do not match' : '');
        }

        if (name === 'companyCode') {
            setCompanyPreview(null);
            setCodeError('');
        }
    };

    const handleVerifyCode = async () => {
        if (!formData.companyCode.trim()) return;
        setCodeChecking(true);
        setCodeError('');
        try {
            const res = await authService.verifyCompanyCode(formData.companyCode.trim());
            setCompanyPreview(res.companyName);
        } catch (err) {
            setCodeError(err.response?.data?.message || 'Invalid company code');
            setCompanyPreview(null);
        } finally {
            setCodeChecking(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            setPasswordError('Passwords do not match');
            return;
        }
        if (mode === 'join' && !companyPreview) {
            setCodeError('Please verify the company code first');
            return;
        }
        try {
            await register({
                name: formData.name,
                email: formData.email,
                password: formData.password,
                company: mode === 'create' ? formData.company : undefined,
                companyCode: mode === 'join' ? formData.companyCode.trim() : undefined,
                isAdmin: mode === 'create',
            });
            navigate('/dashboard');
        } catch (err) {
            console.error('Registration failed:', err);
        }
    };

    const handleGoogleRegister = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            try {
                const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
                });
                const userInfo = await userInfoResponse.json();
                await googleLogin(
                    tokenResponse.access_token,
                    userInfo,
                    mode === 'create' ? formData.company || 'My Company' : undefined,
                    mode === 'join' ? formData.companyCode : undefined
                );
                navigate('/dashboard');
            } catch (err) {
                console.error('Google signup failed:', err);
            }
        },
        onError: () => console.error('Google signup failed')
    });

    return (
        <div className="auth-page">
            <div className="auth-bg">
                <div className="auth-glow auth-glow-1"></div>
                <div className="auth-glow auth-glow-2"></div>
            </div>

            <div className="auth-container">
                <Link to="/" className="auth-logo">
                    <div className="auth-logo-icon">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <span>ProjectFlow</span>
                </Link>

                <div className="auth-card">
                    <div className="auth-header">
                        <h1 className="auth-title">Create an account</h1>
                        <p className="auth-subtitle">Start your journey with ProjectFlow</p>
                    </div>

                    {/* Mode selector */}
                    <div className="register-mode-selector">
                        <button
                            type="button"
                            className={`mode-btn ${mode === 'join' ? 'active' : ''}`}
                            onClick={() => setMode('join')}
                        >
                            🔑 Join a Company
                        </button>
                        <button
                            type="button"
                            className={`mode-btn ${mode === 'create' ? 'active' : ''}`}
                            onClick={() => setMode('create')}
                        >
                            🏢 Create Company
                        </button>
                    </div>

                    <div className="mode-description">
                        {mode === 'join' ? (
                            <p>👋 Enter the <strong>secret code</strong> shared by your company admin to join your team.</p>
                        ) : (
                            <p>👑 Register as an <strong>Admin</strong> to create your company workspace. You'll get a secret code to share with your team.</p>
                        )}
                    </div>

                    {error && (
                        <div className="auth-error">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="auth-form">
                        {/* Company Code Field (Join mode) */}
                        {mode === 'join' && (
                            <div className="form-group">
                                <label className="form-label">Company Secret Code</label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <input
                                        type="text"
                                        name="companyCode"
                                        value={formData.companyCode}
                                        onChange={handleChange}
                                        className={`input ${codeError ? 'input-error' : ''}`}
                                        placeholder="e.g. A1B2-C3D4"
                                        style={{ flex: 1, textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 600 }}
                                        required={mode === 'join'}
                                    />
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={handleVerifyCode}
                                        disabled={codeChecking || !formData.companyCode}
                                        style={{ whiteSpace: 'nowrap' }}
                                    >
                                        {codeChecking ? '...' : 'Verify'}
                                    </button>
                                </div>
                                {codeError && <span className="form-error">{codeError}</span>}
                                {companyPreview && (
                                    <div className="code-verified-badge">
                                        ✅ Joining: <strong>{companyPreview}</strong>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Company Name Field (Create mode) */}
                        {mode === 'create' && (
                            <div className="form-group">
                                <label htmlFor="company" className="form-label">Company Name</label>
                                <input
                                    type="text"
                                    id="company"
                                    name="company"
                                    value={formData.company}
                                    onChange={handleChange}
                                    className="input"
                                    placeholder="Enter your company name"
                                    required={mode === 'create'}
                                />
                            </div>
                        )}

                        <div className="form-group">
                            <label htmlFor="name" className="form-label">Full Name</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="input"
                                placeholder="Enter your full name"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="email" className="form-label">Email</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="input"
                                placeholder="Enter your email"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password" className="form-label">Password</label>
                            <div className="input-password">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="input"
                                    placeholder="Create a password"
                                    required
                                    minLength={8}
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? (
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                            <line x1="1" y1="1" x2="23" y2="23" />
                                        </svg>
                                    ) : (
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                            <circle cx="12" cy="12" r="3" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
                            <input
                                type="password"
                                id="confirmPassword"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                className={`input ${passwordError ? 'input-error' : ''}`}
                                placeholder="Confirm your password"
                                required
                            />
                            {passwordError && <span className="form-error">{passwordError}</span>}
                        </div>

                        <label className="checkbox-label">
                            <input type="checkbox" className="checkbox" required />
                            <span>I agree to the <a href="#terms" className="form-link">Terms of Service</a> and <a href="#privacy" className="form-link">Privacy Policy</a></span>
                        </label>

                        <button type="submit" className="btn btn-primary btn-lg auth-submit" disabled={loading || !!passwordError}>
                            {loading ? (
                                <span className="btn-loading">
                                    <span className="spinner"></span>
                                    Creating account...
                                </span>
                            ) : mode === 'create' ? '🏢 Create Company & Register' : '🔑 Join Company & Register'}
                        </button>
                    </form>

                    <div className="auth-divider">
                        <span>or continue with</span>
                    </div>

                    <div className="auth-social">
                        <button
                            type="button"
                            className="btn btn-google btn-lg"
                            onClick={() => handleGoogleRegister()}
                            disabled={loading}
                        >
                            <svg viewBox="0 0 24 24" width="20" height="20">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Sign up with Google
                        </button>
                    </div>

                    <p className="auth-footer">
                        Already have an account? <Link to="/login" className="auth-link">Sign in</Link>
                    </p>

                    <p className="auth-footer" style={{ marginTop: '12px' }}>
                        <Link to="/admin/login" className="auth-link" style={{ color: '#f59e0b', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            🛡️ Login as Admin
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
