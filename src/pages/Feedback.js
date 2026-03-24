import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import './Feedback.css';

const Feedback = () => {
    const [feedbackForm, setFeedbackForm] = useState({ name: '', email: '', rating: 5, message: '' });
    const [feedbackStatus, setFeedbackStatus] = useState(null);

    const handleFeedbackChange = (e) => {
        setFeedbackForm({ ...feedbackForm, [e.target.name]: e.target.value });
    };

    const handleFeedbackSubmit = async (e) => {
        e.preventDefault();
        try {
            const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
            const response = await fetch(`${API_URL}/feedback`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(feedbackForm)
            });
            if (response.ok) {
                setFeedbackStatus({ type: 'success', message: 'Thank you for your feedback!' });
                setFeedbackForm({ name: '', email: '', rating: 5, message: '' });
            } else {
                setFeedbackStatus({ type: 'error', message: 'Failed to submit feedback. Please try again later.' });
            }
        } catch (error) {
            setFeedbackStatus({ type: 'error', message: 'Something went wrong. Please try again.' });
        }
    };

    return (
        <div className="feedback-page">
            <Navbar />
            <div className="feedback-content-wrapper">
                <section id="feedback" className="feedback-section">
                    <div className="container">
                        <div className="section-header">
                            <span className="section-badge">Feedback</span>
                            <h2 className="section-title">We Value Your Opinion</h2>
                            <p className="section-description">
                                Help us improve by sharing your thoughts, suggestions, and experiences with our platform.
                            </p>
                        </div>

                        <div className="feedback-container">
                            <form className="feedback-form" onSubmit={handleFeedbackSubmit}>
                                {feedbackStatus && (
                                    <div className={`feedback-alert feedback-alert-${feedbackStatus.type}`}>
                                        {feedbackStatus.message}
                                    </div>
                                )}
                                <div className="form-group">
                                    <label>Name</label>
                                    <input 
                                        type="text" 
                                        name="name" 
                                        value={feedbackForm.name} 
                                        onChange={handleFeedbackChange} 
                                        required 
                                        placeholder="Your Name"
                                        className="form-input"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Email</label>
                                    <input 
                                        type="email" 
                                        name="email" 
                                        value={feedbackForm.email} 
                                        onChange={handleFeedbackChange} 
                                        required 
                                        placeholder="your.email@example.com"
                                        className="form-input"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Rating</label>
                                    <div className="rating-select">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <label key={star} className={`rating-star ${feedbackForm.rating >= star ? 'active' : ''}`}>
                                                <input 
                                                    type="radio" 
                                                    name="rating" 
                                                    value={star} 
                                                    checked={feedbackForm.rating === star} 
                                                    onChange={(e) => setFeedbackForm({...feedbackForm, rating: Number(e.target.value)})}
                                                />
                                                ★
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Message</label>
                                    <textarea 
                                        name="message" 
                                        value={feedbackForm.message} 
                                        onChange={handleFeedbackChange} 
                                        required 
                                        placeholder="Tell us what you love or what could be better..."
                                        className="form-input form-textarea"
                                        rows="5"
                                    ></textarea>
                                </div>
                                <button type="submit" className="btn btn-primary btn-lg feedback-submit-btn">
                                    Submit Feedback
                                </button>
                            </form>
                        </div>
                    </div>
                </section>
            </div>
            <Footer />
        </div>
    );
};

export default Feedback;
