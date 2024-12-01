// 인증 컨텍스트
// src/context/AuthContext.js
import React, { createContext, useContext, useReducer, useEffect } from 'react';

const AuthContext = createContext();

const initialState = {
    isAuthenticated: false,
    user: null,
    loading: true  // 초기 로딩 상태 추가
};

function authReducer(state, action) {
    switch (action.type) {
        case 'LOGIN':
            return {
                ...state,
                isAuthenticated: true,
                user: action.payload,
                loading: false
            };
        case 'LOGOUT':
            return {
                ...state,
                isAuthenticated: false,
                user: null,
                loading: false
            };
        case 'SET_LOADING':
            return {
                ...state,
                loading: action.payload
            };
        default:
            return state;
    }
}

export function AuthProvider({ children }) {
    const [state, dispatch] = useReducer(authReducer, initialState);

    useEffect(() => {
        const checkAuth = async () => {
            dispatch({ type: 'SET_LOADING', payload: true });
            
            try {
                const API_URL = 'http://183.105.171.41:8080';

                const response = await fetch(`${API_URL}/api/check-auth`, {
                    credentials: 'include',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.isAuthenticated) {
                        dispatch({ type: 'LOGIN', payload: data.user });
                    } else {
                        dispatch({ type: 'LOGOUT' });
                    }
                } else {
                    dispatch({ type: 'LOGOUT' });
                }
            } catch (error) {
                console.error('Auth check error:', error);
                dispatch({ type: 'LOGOUT' });
            }
        };

        checkAuth();
    }, []);

    const login = (userData) => {
        console.log('로그인 시도:', userData); // 디버깅을 위해 추가
        localStorage.setItem('token', userData.token);
        dispatch({ type: 'LOGIN', payload: userData });
        // alert('로그인 성공!'); // 필요한 경우에만 사용
    };

    const logout = () => {
        localStorage.removeItem('token');
        dispatch({ type: 'LOGOUT' });
    };

    return (
        <AuthContext.Provider value={{ state, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
} 
