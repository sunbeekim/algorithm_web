import React from 'react';
import './HorizontalContent.css';

function HorizontalContent({ children, gap }) {
    return (
        <div className="horizontal-wrapper">
            <div className="horizontal-content" style={{ gap: gap || '20px' }}>
                {children}
            </div>
        </div>
    );
}

export default HorizontalContent;