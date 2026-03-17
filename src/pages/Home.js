import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import './Home.css';

const Home = () => {
    const features = [
        {
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <line x1="3" y1="9" x2="21" y2="9" />
                    <line x1="9" y1="21" x2="9" y2="9" />
                </svg>
            ),
            title: 'Project Management',
            description: 'Organize and track all your projects in one centralized dashboard with intuitive controls.'
        },
        {
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
            ),
            title: 'Team Collaboration',
            description: 'Work together seamlessly with real-time messaging and file sharing capabilities.'
        },
        {
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
            ),
            title: 'Task Tracking',
            description: 'Monitor progress with detailed task management and status tracking features.'
        },
        {
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
            ),
            title: 'File Management',
            description: 'Upload, organize, and share files securely across your entire team.'
        },
        {
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                </svg>
            ),
            title: 'Time Tracking',
            description: 'Track time spent on tasks and projects for accurate resource management.'
        },
        {
            icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 20V10" />
                    <path d="M12 20V4" />
                    <path d="M6 20v-6" />
                </svg>
            ),
            title: 'Analytics',
            description: 'Gain insights with powerful analytics and reporting dashboards.'
        }
    ];

    return (
        <div className="home">
            <Navbar />

            {/* Hero Section */}
            <section className="hero">
                <div className="hero-bg">
                    <div className="hero-glow hero-glow-1"></div>
                    <div className="hero-glow hero-glow-2"></div>
                    <div className="hero-grid"></div>
                </div>

                <div className="container hero-content">
                    <h1 className="hero-title">
                        Manage Projects
                        <span className="hero-title-gradient"> Effortlessly</span>
                    </h1>

                    <p className="hero-description">
                        Streamline your workflow, collaborate with your team, and deliver projects on time.
                        The all-in-one project management solution for modern teams.
                    </p>

                    <div className="hero-actions">
                        <Link to="/register" className="btn btn-primary btn-lg">
                            Start Free Trial
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                                <path d="M5 12h14" />
                                <path d="M12 5l7 7-7 7" />
                            </svg>
                        </Link>
                        <Link to="/login" className="btn btn-secondary btn-lg">
                            View Demo
                        </Link>
                    </div>

                    <div className="hero-stats">
                        <div className="hero-stat">
                            <span className="hero-stat-value">10K+</span>
                            <span className="hero-stat-label">Active Users</span>
                        </div>
                        <div className="hero-stat">
                            <span className="hero-stat-value">50K+</span>
                            <span className="hero-stat-label">Projects Completed</span>
                        </div>
                        <div className="hero-stat">
                            <span className="hero-stat-value">99.9%</span>
                            <span className="hero-stat-label">Uptime</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="features">
                <div className="container">
                    <div className="section-header">
                        <span className="section-badge">Features</span>
                        <h2 className="section-title">Everything you need to succeed</h2>
                        <p className="section-description">
                            Powerful features to help you manage projects, collaborate with your team, and deliver exceptional results.
                        </p>
                    </div>

                    <div className="features-grid">
                        {features.map((feature, index) => (
                            <div key={index} className="feature-card" style={{ animationDelay: `${index * 0.1}s` }}>
                                <div className="feature-icon">{feature.icon}</div>
                                <h3 className="feature-title">{feature.title}</h3>
                                <p className="feature-description">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="pricing">
                <div className="container">
                    <div className="section-header">
                        <span className="section-badge">Pricing</span>
                        <h2 className="section-title">Simple, transparent pricing</h2>
                        <p className="section-description">
                            Choose the perfect plan for your team. No hidden fees, cancel anytime.
                        </p>
                    </div>

                    <div className="pricing-grid">
                        {/* Free Plan */}
                        <div className="pricing-card">
                            <div className="pricing-header">
                                <h3 className="pricing-name">Free</h3>
                                <p className="pricing-tagline">Perfect for getting started</p>
                            </div>
                            <div className="pricing-price">
                                <span className="pricing-amount">₹0</span>
                                <span className="pricing-period">/month</span>
                            </div>
                            <ul className="pricing-features">
                                <li className="pricing-feature">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                    Up to 3 projects
                                </li>
                                <li className="pricing-feature">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                    5 team members
                                </li>
                                <li className="pricing-feature">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                    Basic task management
                                </li>
                                <li className="pricing-feature">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                    1GB file storage
                                </li>
                                <li className="pricing-feature disabled">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                    Advanced analytics
                                </li>
                            </ul>
                            <Link to="/register" className="btn btn-secondary btn-lg pricing-btn">
                                Get Started Free
                            </Link>
                        </div>

                        {/* Pro Plan */}
                        <div className="pricing-card pricing-card-featured">
                            <div className="pricing-popular">Most Popular</div>
                            <div className="pricing-header">
                                <h3 className="pricing-name">Pro</h3>
                                <p className="pricing-tagline">Best for growing teams</p>
                            </div>
                            <div className="pricing-price">
                                <span className="pricing-amount">₹1,599</span>
                                <span className="pricing-period">/month</span>
                            </div>
                            <ul className="pricing-features">
                                <li className="pricing-feature">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                    Unlimited projects
                                </li>
                                <li className="pricing-feature">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                    25 team members
                                </li>
                                <li className="pricing-feature">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                    Advanced task management
                                </li>
                                <li className="pricing-feature">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                    50GB file storage
                                </li>
                                <li className="pricing-feature">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                    Advanced analytics
                                </li>
                                <li className="pricing-feature">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                    Priority support
                                </li>
                            </ul>
                            <Link to="/register" className="btn btn-primary btn-lg pricing-btn">
                                Start Pro Trial
                            </Link>
                        </div>

                        {/* Enterprise Plan */}
                        <div className="pricing-card">
                            <div className="pricing-header">
                                <h3 className="pricing-name">Enterprise</h3>
                                <p className="pricing-tagline">For large organizations</p>
                            </div>
                            <div className="pricing-price">
                                <span className="pricing-amount">₹4,099</span>
                                <span className="pricing-period">/month</span>
                            </div>
                            <ul className="pricing-features">
                                <li className="pricing-feature">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                    Unlimited everything
                                </li>
                                <li className="pricing-feature">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                    Unlimited team members
                                </li>
                                <li className="pricing-feature">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                    Custom workflows
                                </li>
                                <li className="pricing-feature">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                    Unlimited storage
                                </li>
                                <li className="pricing-feature">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                    Custom integrations
                                </li>
                                <li className="pricing-feature">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                    24/7 dedicated support
                                </li>
                                <li className="pricing-feature">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                    SLA guarantee
                                </li>
                            </ul>
                            <Link to="/register" className="btn btn-secondary btn-lg pricing-btn">
                                Contact Sales
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* About Section */}
            <section id="about" className="about">
                <div className="container">
                    <div className="about-grid">
                        <div className="about-content">
                            <span className="section-badge">About Us</span>
                            <h2 className="section-title">Built for teams who do great things</h2>
                            <p className="about-description">
                                ProjectFlow was founded in 2024 with a simple mission: to help teams work better together.
                                We believe that great project management tools should be intuitive, powerful, and accessible to everyone.
                            </p>
                            <p className="about-description">
                                Our team of passionate developers and designers work tirelessly to create the best
                                project management experience possible. We're committed to continuous improvement and
                                listening to our users' feedback.
                            </p>

                            <div className="about-stats">
                                <div className="about-stat">
                                    <span className="about-stat-value">2024</span>
                                    <span className="about-stat-label">Founded</span>
                                </div>
                                <div className="about-stat">
                                    <span className="about-stat-value">50+</span>
                                    <span className="about-stat-label">Team Members</span>
                                </div>
                                <div className="about-stat">
                                    <span className="about-stat-value">120+</span>
                                    <span className="about-stat-label">Countries</span>
                                </div>
                            </div>
                        </div>

                        <div className="about-values">
                            <div className="about-value-card">
                                <div className="about-value-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                    </svg>
                                </div>
                                <h4 className="about-value-title">Security First</h4>
                                <p className="about-value-description">
                                    Your data is protected with enterprise-grade encryption and security protocols.
                                </p>
                            </div>

                            <div className="about-value-card">
                                <div className="about-value-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10" />
                                        <path d="M12 6v6l4 2" />
                                    </svg>
                                </div>
                                <h4 className="about-value-title">Always Available</h4>
                                <p className="about-value-description">
                                    99.9% uptime guarantee so your team can work whenever inspiration strikes.
                                </p>
                            </div>

                            <div className="about-value-card">
                                <div className="about-value-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                    </svg>
                                </div>
                                <h4 className="about-value-title">User Focused</h4>
                                <p className="about-value-description">
                                    Every feature is designed with our users in mind, based on real feedback.
                                </p>
                            </div>

                            <div className="about-value-card">
                                <div className="about-value-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                                    </svg>
                                </div>
                                <h4 className="about-value-title">Lightning Fast</h4>
                                <p className="about-value-description">
                                    Optimized performance so you spend less time waiting and more time doing.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta">
                <div className="container">
                    <div className="cta-card">
                        <div className="cta-glow"></div>
                        <h2 className="cta-title">Ready to get started?</h2>
                        <p className="cta-description">
                            Join thousands of teams already using ProjectFlow to deliver amazing results.
                        </p>
                        <div className="cta-actions">
                            <Link to="/register" className="btn btn-primary btn-lg">
                                Start Your Free Trial
                            </Link>
                            <a href="#contact" className="btn btn-ghost btn-lg">
                                Contact Sales
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default Home;
