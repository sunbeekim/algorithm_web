// 앱 컴포넌트
// src/App.js
import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import Board from './pages/Board';
import Coding from './pages/Coding';  
import Ranking from './pages/Ranking';
import Paint from './pages/Paint';
import './App.css';
import { AuthProvider } from './context/AuthContext';
import Algorithm from './pages/Algorithm';
import Bottom from './components/Bottom';
import Layout from './components/Layout';
import VerticalContent from './components/VerticalContent';
import { FaArrowUp } from 'react-icons/fa';

function App() {
  const [showButton, setShowButton] = useState(false);

  // throttle 함수 구현
  const throttle = (func, limit) => {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  };

  // 스크롤 핸들러를 useCallback으로 메모이제이션
  const handleScroll = useCallback(
    throttle(() => {
      if (window.scrollY > 200) {
        setShowButton(true);
      } else {
        setShowButton(false);
      }
    }, 100), // 100ms 마다 실행
    []
  );

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <AuthProvider>
      <div className="wrapper">
        <Header />
        <div className="content-container">
          <Routes>
            <Route default path="/" element={<Home />} />
            <Route path="/home" element={<Home />} />
            <Route path="/board/*" element={<Board />} />
            <Route path="/coding" element={<Coding />} />
            <Route path="/algorithm" element={<Algorithm />} />
            <Route path="/ranking" element={<Ranking />} />
            <Route path="/paint" element={<Paint />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
        
        <div id="modal-root"></div>
       
      </div>
      
      <Bottom />
    </AuthProvider>
  );
}

export default App;
