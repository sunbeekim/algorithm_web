import React, { useEffect, useState } from 'react';
import './BodyRectangle.css';
import blueImage from '../assets/blue.jpg';

function BodyRectangle({ children }) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div className={`body-container ${isLoaded ? 'loaded' : ''}`}>
      <div className="body-image-wrapper">
        <div 
          className="body-background"
          style={{ 
            backgroundImage: `url(${blueImage})`
          }}
        />
        <div className="body-overlay" />
        <div className="body-content">
          <div className="content-inner">
            {children}
          </div>
          <div className="scroll-indicator">
            <div className="mouse">
              <div className="wheel"></div>
            </div>
            <div className="scroll-text">Scroll Down</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BodyRectangle; 