import React from 'react';
import './AuthButton.css';

const AuthButton = ({ onClick, type, children }) => {
    const icon = React.Children.toArray(children).find(child => child.props.className === 'icon');
    const tooltip = React.Children.toArray(children).find(child => child.props.className === 'tooltip');

    return (
        <button 
            className={`auth-button ${type}`}
            onClick={onClick}
        >
            {icon}
            {tooltip}
        </button>
    );
};

export default AuthButton;
