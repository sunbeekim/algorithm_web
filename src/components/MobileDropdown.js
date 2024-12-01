import React from 'react';
import HeaderItem from './HeaderItem';
import AuthButton from './AuthButton';
import { BiLogIn, BiLogOut } from 'react-icons/bi';
import './MobileDropdown.css';
import LoadingSVG from '../components_loding/LoadingSVG';
import HomeButton from './HomeButton';

function MobileDropdown({ isOpen, menus, onMenuClick, authState, onLoginClick, onLogout }) {
    if (!isOpen) return null;

    return (
        <div>
            <div className="mobile-dropdown show">               
                {menus.map((menu) => (
                    <HeaderItem 
                    key={menu.path}
                    to={menu.path}
                    icon={menu.icon}
                    text={menu.name}
                    onClick={() => onMenuClick(menu.path)}
                />
             ))}
{/*             
            <HeaderButton 
                onClick={authState.isAuthenticated ? onLogout : onLoginClick}
                type={authState.isAuthenticated ? "logout" : "login"}
            >
                <span className="icon">                            
                    {authState.isAuthenticated ? <BiLogOut /> : <BiLogIn />}
                </span>
                <span className="text">
                    {authState.isAuthenticated ? "로그아웃" : "로그인"}
                </span>
            </HeaderButton> */}
                <div className="mobile-dropdown-svg">
            <LoadingSVG />
                </div>        
            </div>        
        </div>        
        
        
    );
}

export default MobileDropdown; 