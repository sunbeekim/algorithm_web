// src/client/Root.jsx
// 루트 설정 파일
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import App from '../App';

const Root = () => (
  <BrowserRouter>
    <App />
  </BrowserRouter>
);

export default Root;