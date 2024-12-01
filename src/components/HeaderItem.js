import React from 'react';
import { Link } from 'react-router-dom';
import './HeaderItem.css';

const HeaderItem = ({ to, icon, tooltip, text, onClick }) => {
  return (
  
        <Link 
          to={to} 
      className="header-item"
      onClick={onClick}
    >
      <span className="icon">{icon}</span>
      <span className="text">{text}</span>
      <span className="tooltip">{tooltip}</span>
        </Link>
  
  );
};

export default HeaderItem;
