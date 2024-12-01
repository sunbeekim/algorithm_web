// 개인 라우트 컴포넌트
// src/components/PrivateRoute.js
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // AuthContext에서 인증 상태를 가져옴

function PrivateRoute({ children }) {
  const { state } = useAuth(); // 인증 상태 확인
  const location = useLocation();

  if (!state.isAuthenticated) {
    // 인증되지 않은 경우 로그인 페이지로 리다이렉트
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children; // 인증된 경우 자식 컴포넌트 렌더링
}

export default PrivateRoute; 
