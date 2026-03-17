import React from 'react';
import { Link } from 'react-router-dom';
import './Pages.css';

const NotFound = () => {
    return (
        <div className="not-found">
            <h1>404</h1>
            <p>Page not found</p>
            <Link to="/" className="btn btn-primary">Go Home</Link>
        </div>
    );
};

export default NotFound;
