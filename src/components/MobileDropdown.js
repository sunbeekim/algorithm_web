import React from 'react';
import HeaderItem from './HeaderItem';
import AuthButton from './AuthButton';
import { BiLogIn, BiLogOut } from 'react-icons/bi';
import './MobileDropdown.css';
import LoadingSVG from '../components_loding/LoadingSVG';
import HomeButton from './HomeButton';
import { BsFillPencilFill } from 'react-icons/bs';

function MobileDropdown({ isOpen, menus, onMenuClick, authState, onLoginClick, onLogout }) {
    if (!isOpen) return null;

    // 공통 메뉴와 조건부 메뉴 분리
    const commonMenus = menus.filter(menu => 
        !menu.path.includes('/chatroom') && !menu.path.includes('/draw')
    );

    // 로그인 상태에 따른 그림판 메뉴
    const drawingMenu = authState.isAuthenticated
        ? { path: '/chatroom/1', name: '그림판채팅', icon: <BsFillPencilFill /> }
        : { path: '/draw', name: '그림판', icon: <BsFillPencilFill /> };

    return (
        <div>
            <div className="mobile-dropdown show">               
                {/* 공통 메뉴 렌더링 */}
                {commonMenus.map((menu) => (
                    <HeaderItem 
                        key={menu.path}
                        to={menu.path}
                        icon={menu.icon}
                        text={menu.name}
                        onClick={() => onMenuClick(menu.path)}
                    />
                ))}

                {/* 그림판 메뉴 렌더링 */}
                <HeaderItem 
                    key={drawingMenu.path}
                    to={drawingMenu.path}
                    icon={drawingMenu.icon}
                    text={drawingMenu.name}
                    onClick={() => onMenuClick(drawingMenu.path)}
                />
            
                <div className="mobile-dropdown-svg">
                    <LoadingSVG />
                </div>        
            </div>        
        </div>        
    );
}

export default MobileDropdown; 