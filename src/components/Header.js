// 헤더 컴포넌트
// src/components/Header.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoginModal from '../components_login/LoginModal';
import SignupModal from '../components_login/SignupModal';
import './Header.css';
import AuthButton from './AuthButton';
import MobileDropdown from './MobileDropdown';
import HomeButton from './HomeButton';
import HeaderItem from './HeaderItem';  // HeaderItem 컴포넌트 임포트 추가
import { MdAdminPanelSettings } from 'react-icons/md'; // 관리자 패널 아이콘

// 아이콘 임포트
import { AiFillHome } from 'react-icons/ai';
import { BsFillPencilFill } from 'react-icons/bs';
import { BiCodeAlt, BiLogIn, BiLogOut } from 'react-icons/bi';
import { FaChartBar } from 'react-icons/fa';
import { CiKeyboard } from "react-icons/ci";
import { SiThealgorithms } from "react-icons/si";
import { BiTestTube } from 'react-icons/bi';  // 테스트 아이콘 추가

// API URL을 항상 실제 서버 주소로 설정
// localhost 대신 실제 서버 IP 사용
const API_URL = 'http://183.105.171.41:8080';

// 공통 메뉴
const MENU_ITEMS = [
    { path: '/board', name: '게시판', icon: <CiKeyboard /> },
    { path: '/coding', name: '코딩', icon: <BiCodeAlt /> },
    { path: '/algorithm', name: '알고리즘', icon: <SiThealgorithms /> },
    { path: '/ranking', name: '랭킹', icon: <FaChartBar /> },
    { path: '/test', name: '테스트페이지', icon: <BiTestTube /> }  // 콤마 추가하고 아이콘 변경
];

// 로그인 사용자 전용 메뉴
const AUTH_MENU_ITEMS = [
    { path: '/chatroom/1', name: '그림판채팅', icon: <BsFillPencilFill /> }
];

// 비로그인 사용자 전용 메뉴
const PUBLIC_MENU_ITEMS = [
    { path: '/draw', name: '그림판', icon: <BsFillPencilFill /> }
];

function Header() {
    // 상태 관리
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showSignupModal, setShowSignupModal] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    
    // 훅
    const { state: authState, logout, login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const currentPath = location.pathname;

    // 인증 관련 핸들러
    const handleLoginClick = () => setShowLoginModal(true);
    const handleSignupClick = () => {
        setShowLoginModal(false);
        setShowSignupModal(true);
    };

    const handleLogout = async () => {
        try {
            const response = await fetch(`${API_URL}/api/logout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'include'
            });
            // 로그인 버튼을 누르면 POST 메서드로 서버에 요청
            // API 경로는 http://183.105.171.41:8080/api/login
            // Express.js 가 요청받은 req 객체에 담긴 데이터를 엔드포인트인 /api/login에서 처리
            // 헤더에 포함된 데이터는 타입이 express.json() 미들웨어에 의해 JSON 형식으로 변환됨
            // JSON은 body에 포함된 데이터를 파싱
            // 파싱된 데이터는 req.body에 저장
            // req.params는 경로에 포함된 동적 값을 저장
            // ex) POST http://183.105.171.41:8080/api/login/test
            // req.params.id는 test
            // 서버에서는 클라이언트가 보낸 데이터를 받아서 검증 후 토큰 발급
            // 토큰은 클라이언트에 저장되고 쿠키에 저장됨
            // 토큰은 클라이언트가 서버에 요청할 때 헤더에 포함되어 전송
            // 서버에서는 헤더에 포함된 토큰을 검증하고 인증 여부 확인

            if (response.ok) {
                localStorage.removeItem('token');
                document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                logout();
                window.location.href = '/';
            } else {
                // 서버가 응답하지 못하면 네트워크에 문제가 생긴것
                // 네트워크 문제는 클라이언트가 서버에 요청을 보내지 못하는 것
                // 토큰의 유효기간을 만료시키지 않고 유지시킴
              
                console.error('로그아웃 실패');
                alert('로그아웃에 실패했습니다. 다시 시도해주세요.');
            }
        } catch (error) {
            console.error('로그아웃 오류:', error);
            alert('로그아웃 처리 중 오류가 발생했습니다.');
        }
    };

    const handleLogin = async (username, password) => {
        try {
            console.log('로그인 시도:', { username });  // 로그 추가
            
            const response = await fetch(`${API_URL}/api/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'include',  // 쿠키 포함
                body: JSON.stringify({ 
                    id: username, 
                    pw: password 
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '로그인에 실패했습니다.');
            }

            const data = await response.json();
            console.log('로그인 응답:', data);  // 로그 추가
            
            if (data.success) {
                login(data.user);
                setShowLoginModal(false);
            } else {
                throw new Error(data.message || '로그인에 실패했습니다.');
            }
        } catch (error) {
            console.error('로그인 오류:', error);
            alert(error.message || '로그인 처리 중 오류가 발생했습니다.');
        }
    };

    // 드롭다운 관련 핸들러
    const toggleDropdown = (e) => {
        e.stopPropagation();
        setIsDropdownOpen(prev => !prev);  // 토글 상태 변경
    };

    useEffect(() => {
        const closeDropdown = (e) => {
            // 햄버거 버튼과 드롭다운 메뉴 영역 제외한 곳 클릭/터치 시에만 닫기
            const isOutsideClick = !e.target.closest('.mobile-menu') && 
                                 !e.target.closest('.mobile-dropdown') &&
                                 !e.target.closest('.dropdown-toggle');
            
            if (isOutsideClick) {
                setIsDropdownOpen(false);
            }
        };

        if (isDropdownOpen) {
            document.addEventListener('click', closeDropdown);
            document.addEventListener('touchend', closeDropdown, { passive: true });
        }

        return () => {
            document.removeEventListener('click', closeDropdown);
            document.removeEventListener('touchend', closeDropdown);
        };
    }, [isDropdownOpen]);

    // 사이드 이펙트
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth > 768 && isDropdownOpen) {
                setIsDropdownOpen(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isDropdownOpen]);

    // 렌더링
    return (
        <div>
        <header className="header">
            <div className="header-content">
                {/* 홈 버튼 섹션 */}                    
                <div className="home-button">
                    <HomeButton />
                </div>
    
                {/* 데스크톱 메뉴 */}
                <nav className="desktop-menu">
                    
                    <div className="menu-items">
                        {/* 공통 메뉴 렌더링 */}
                        {MENU_ITEMS.map((menu) => (
                            <HeaderItem 
                                key={menu.path}
                                to={menu.path}
                                icon={menu.icon}
                                tooltip={menu.name}
                                onClick={(e) => {
                                    e.preventDefault();
                                    navigate(menu.path);
                                }}
                            />
                        ))}
        
                        {/* 로그인 상태에 따른 그림판 메뉴 렌더링 */}
                        {authState.isAuthenticated ? 
                            AUTH_MENU_ITEMS.map((menu) => (
                                <HeaderItem 
                                    key={menu.path}
                                    to={menu.path}
                                    icon={menu.icon}
                                    tooltip={menu.name}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        navigate(menu.path);
                                    }}
                                />
                            ))
                            : 
                            PUBLIC_MENU_ITEMS.map((menu) => (
                                <HeaderItem 
                                    key={menu.path}
                                    to={menu.path}
                                    icon={menu.icon}
                                    tooltip={menu.name}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        navigate(menu.path);
                                    }}
                                />
                            ))
                        }

                        {/* 관리자 메뉴 */}
                        {authState.isAuthenticated && authState.user?.roleId === 1 && (
                            <HeaderItem 
                                to="/admin"
                                icon={<MdAdminPanelSettings />}
                                tooltip="관리자"
                                onClick={(e) => {
                                    e.preventDefault();
                                    navigate('/admin');
                                }}
                            />
                        )}
                    </div>
                    <div className="logright">
                    <AuthButton 
                        onClick={authState.isAuthenticated ? handleLogout : handleLoginClick}
                        type={authState.isAuthenticated ? "logout" : "login"}
                    >
                        <span className="icon">                            
                            {authState.isAuthenticated ? <BiLogOut /> : <BiLogIn />}
                        </span>
                        <span className="tooltip">
                            {authState.isAuthenticated ? "로그아웃" : "로그인"}
                        </span>
                        </AuthButton>
                    </div>
                </nav>
    
                {/* 모바일 메뉴 */}
                <div className="mobile-menu">
                    <button 
                        className="dropdown-toggle"
                        onClick={toggleDropdown}
                        aria-expanded={isDropdownOpen}
                    >
                        {isDropdownOpen ? '✕' : '☰'}
                    </button>
                </div>
    
                {/* 모바일 드롭다운 */}
                {isDropdownOpen && (
                    <MobileDropdown 
                        isOpen={isDropdownOpen}
                        onClose={() => setIsDropdownOpen(false)}
                        menus={MENU_ITEMS}
                        onMenuClick={(path) => {
                            navigate(path);
                            setIsDropdownOpen(false);
                        }}
                        authState={authState}
                        onLoginClick={() => {
                            setIsDropdownOpen(false);
                            handleLoginClick();
                        }}
                        onLogout={() => {
                            setIsDropdownOpen(false);
                            handleLogout();
                        }}
                    />
                )}
            </div>
    
            {/* 모달 */}
            
            <LoginModal 
                show={showLoginModal} 
                onClose={() => setShowLoginModal(false)}
                onSignupClick={handleSignupClick}
                onLogin={handleLogin}
            />
            <SignupModal 
                show={showSignupModal}
                onClose={() => setShowSignupModal(false)}
            />
        </header>
        </div>
    );
    
}

export default Header;
