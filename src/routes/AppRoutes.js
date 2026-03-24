import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Pages
import Home from '../pages/Home';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Dashboard from '../pages/Dashboard';
import Projects from '../pages/Projects';
import ProjectDetails from '../pages/ProjectDetails';
import Tasks from '../pages/Tasks';
import Messages from '../pages/Messages';
import Profile from '../pages/Profile';
import NotFound from '../pages/NotFound';
import JoinProject from '../pages/JoinProject';
import KanbanBoard from '../pages/KanbanBoard';
import ScrumBoard from '../pages/ScrumBoard';
import AdminPanel from '../pages/AdminPanel';
import AdminAccess from '../pages/AdminAccess';
import TeamProgress from '../pages/TeamProgress';
import ProductivityDashboard from '../pages/ProductivityDashboard';
import Feedback from '../pages/Feedback';

// Components
import PrivateRoute from '../components/PrivateRoute';
import AdminRoute from '../components/AdminRoute';

const AppRoutes = () => {
    return (
        <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/join/:inviteCode" element={<JoinProject />} />

            {/* Protected Routes */}
            <Route path="/dashboard" element={
                <PrivateRoute><Dashboard /></PrivateRoute>
            } />
            <Route path="/projects" element={
                <PrivateRoute><Projects /></PrivateRoute>
            } />
            <Route path="/projects/:id" element={
                <PrivateRoute><ProjectDetails /></PrivateRoute>
            } />
            <Route path="/tasks" element={
                <PrivateRoute><Tasks /></PrivateRoute>
            } />
            <Route path="/kanban" element={
                <PrivateRoute><KanbanBoard /></PrivateRoute>
            } />
            <Route path="/scrum" element={
                <PrivateRoute><ScrumBoard /></PrivateRoute>
            } />
            <Route path="/messages" element={
                <PrivateRoute><Messages /></PrivateRoute>
            } />
            <Route path="/profile" element={
                <PrivateRoute><Profile /></PrivateRoute>
            } />
            <Route path="/team-progress" element={
                <PrivateRoute><TeamProgress /></PrivateRoute>
            } />
            <Route path="/productivity" element={
                <PrivateRoute><ProductivityDashboard /></PrivateRoute>
            } />
            <Route path="/team-progress/:projectId" element={
                <PrivateRoute><TeamProgress /></PrivateRoute>
            } />

            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminAccess />} />
            <Route path="/admin" element={
                <AdminRoute><AdminPanel /></AdminRoute>
            } />

            {/* Application Routes */}
            <Route path="/feedback" element={<Feedback />} />

            {/* 404 Route */}
            <Route path="*" element={<NotFound />} />
        </Routes>
    );
};

export default AppRoutes;
