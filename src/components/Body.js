import React from 'react';
import './Body.css';

function Body({ children }) {
    return (
        <div className="body-container">
            <div className="body-content">
                {children}
            </div>
        </div>
    );
}

export default Body;
