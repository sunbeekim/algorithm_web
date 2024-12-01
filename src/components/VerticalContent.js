import React from 'react';
import './VerticalContent.css';

function VerticalContent({ children }) {
    return (
        <div className="content-wrapper">
            <div className="content">
                {children}
            </div>
        </div>
    );
}

export default VerticalContent;
