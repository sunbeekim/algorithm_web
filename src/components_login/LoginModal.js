// 로그인 모달 컴포넌트
// src/components_login/LoginModal.js
import React, { Component } from 'react';
import './LoginModal.css';
import ReactDOM from 'react-dom';

class LoginModal extends Component {
  state = {
    username: '',
    password: '',
    error: ''
  }

  handleChange = (e) => {
    console.log('입력 변경:', e.target.name, e.target.value);
    this.setState({
      [e.target.name]: e.target.value,
      error: ''
    });
  }

  handleLogin = async (e) => {
    e.preventDefault();
    console.log('로그인 버튼 클릭');
    const { username, password } = this.state;
    this.props.onLogin(username, password);
  }

  handleSignupClick = (e) => {
    e.preventDefault();
    console.log('회원가입 버튼 클릭');
    this.props.onClose();
    this.props.onSignupClick();
  }

  render() {
    if (!this.props.show) {
      return null;
    }

    return ReactDOM.createPortal(
      <div className="modal-overlay">
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2>로그인</h2>
            <button className="close-button" onClick={() => {
              console.log('모달 닫기 버튼 클릭');
              this.props.onClose();
            }}>&times;</button>
          </div>
          
          <div className="modal-body">
            {this.state.error && <div className="error-message">{this.state.error}</div>}
            <form onSubmit={this.handleLogin}>
              <div className="input-group">
                <input
                  type="text"
                  name="username"
                  placeholder="아이디"
                  value={this.state.username}
                  onChange={this.handleChange}
                  required
                  autoComplete="usernaame"
                />
              </div>
              <div className="input-group">
                <input
                  type="password"
                  name="password"
                  placeholder="비밀번호"
                  value={this.state.password}
                  onChange={this.handleChange}
                  required
                  autoComplete="current-password"
                />
              </div>
              
              <button type="submit" className="login-button">로그인</button>
            </form>
            
            <div className="social-login">
              <button className="google-login">
                <img src="/google-icon.png" alt="Google" />
                Google로 계속하기
              </button>
              <button className="kakao-login">
                <img src="/kakao-icon.png" alt="Kakao" />
                카카오로 계속하기
              </button>
            </div>
            
            <div className="signup-link">
              <p>계정이 없으신가요? 
                <button onClick={this.handleSignupClick}>회원가입</button>
              </p>
            </div>
          </div>
        </div>
      </div>,
      document.getElementById('modal-root')
    );
  }
}

export default LoginModal;