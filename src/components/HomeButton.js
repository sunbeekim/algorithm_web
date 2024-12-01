import React from 'react';
import { AiFillHome } from 'react-icons/ai';
import { useNavigate } from 'react-router-dom';
import './HomeButton.css';

function HomeButton() {
    const navigate = useNavigate();

    return (
        <button 
            className="home-button"
            onClick={() => navigate('/home')}
        >
            <span className="icon">
                <AiFillHome />
            </span>
            <span className="tooltip">홈</span>
        </button>
    );
}

export default HomeButton;
