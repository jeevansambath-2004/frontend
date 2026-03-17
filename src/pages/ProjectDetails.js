import React from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import './Pages.css';

const ProjectDetails = () => {
    const { id } = useParams();

    return (
        <div className="page">
            <Navbar />
            <main className="page-main">
                <div className="container">
                    <h1>Project Details</h1>
                    <p>Viewing project ID: {id}</p>
                </div>
            </main>
        </div>
    );
};

export default ProjectDetails;
