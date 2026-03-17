import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import AppRoutes from './routes/AppRoutes';
import { AuthProvider } from './context/AuthContext';
import './styles/App.css';

const GOOGLE_CLIENT_ID = '771392019076-hoh90f3tfqlqmm7uhvn227cne3n74883.apps.googleusercontent.com';

function App() {
    return (
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <AuthProvider>
                <Router>
                    <div className="app">
                        <AppRoutes />
                    </div>
                </Router>
            </AuthProvider>
        </GoogleOAuthProvider>
    );
}

export default App;
