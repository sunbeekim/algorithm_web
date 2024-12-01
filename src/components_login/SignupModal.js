// 회원가입 모달 컴포넌트
// src/components_login/SignupModal.js
import React, { Component } from 'react';
import './SignupModal.css';

class SignupModal extends Component {
  render() {
    if (!this.props.show) {
      return null;
    }

    return (
      <div className="modal-overlay" onClick={this.props.onClose}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2>회원가입</h2>
            <button className="close-button" onClick={this.props.onClose}>&times;</button>
          </div>
          
          <div className="modal-body">
            <div className="input-group">
              <label>아이디 *</label>
              <input type="text" placeholder="아이디 (6-12자)" />
              <button className="check-button">중복확인</button>
            </div>

            <div className="input-group">
              <label>비밀번호 *</label>
              <input type="password" placeholder="비밀번호 (8-16자)" />
            </div>

            <div className="input-group">
              <label>비밀번호 확인 *</label>
              <input type="password" placeholder="비밀번호 확인" />
            </div>

            <div className="input-group">
              <label>이름 *</label>
              <input type="text" placeholder="이름" />
            </div>

            <div className="input-group">
              <label>이메일 *</label>
              <input type="email" placeholder="example@email.com" />
            </div>

            <div className="input-group">
              <label>휴대폰 번호 *</label>
              <div className="phone-input">
                <input type="tel" placeholder="010-0000-0000" />
                <button className="verify-button">인증</button>
              </div>
            </div>

            <div className="agreement-group">
              <label className="checkbox-label">
                <input type="checkbox" />
                <span>이용약관에 동의합니다. (필수)</span>
              </label>
              <label className="checkbox-label">
                <input type="checkbox" />
                <span>개인정보 수집 및 이용에 동의합니다. (필수)</span>
              </label>
            </div>

            <button className="signup-button">회원가입</button>
          </div>
        </div>
      </div>
    );
  }
}

export default SignupModal;
