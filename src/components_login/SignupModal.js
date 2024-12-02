// 회원가입 모달 컴포넌트
// src/components_login/SignupModal.js
import React, { Component } from 'react';
import './SignupModal.css';
import axios from 'axios';

const API_BASE_URL = 'http://183.105.171.41:8080';
class SignupModal extends Component {
  state = {
    username: '',
    isUsernameChecked: false,
    password: '',
    passwordConfirm: '',
    isPasswordMatch: false,
    error: '',
    name: '',
    email: '',
    phone: '',
    phoneAuth: '',
    checkPhone: false,
    checkbox1: false,
    checkbox2: false,
    signupSuccess: false,
    otpSent: false,
    otpVerified: false,
    otp: '',
  }

  // 휴대폰 인증번호 요청
  handleVerifyPhone = async () => {
  if(!this.state.phone){
    alert('휴대폰 번호를 입력해주세요.');
    return;
  }

  try{
    const response = await axios.post(`${API_BASE_URL}/api/send-sms`, { phoneNumber: this.state.phone });
    if(response.data.success){
      alert('인증번호가 발송되었습니다.');
      this.setState({ otpSent: true });
    } else {
      alert('인증번호 발송에 실패했습니다.');
    }
  }catch(error) {
      console.error('Error sending OTP:', error);
      alert('인증번호 발송 중 오류가 발생했습니다.');
    }
  }

  // 인증번호 확인
  handleVerifyOtp = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/verify-otp`, {
        phoneNumber: this.state.phone,
        otp: this.state.otp
      });

      if (response.data.success) {
        this.setState({ 
          otpVerified: true,
          phoneAuth: true
        });
        alert('인증이 완료되었습니다!');
      } else {
        alert('인증번호가 올바르지 않습니다.');
      }
    } catch (error) {
      console.error('인증번호 확인 오류:', error);
      alert('인증 확인 중 오류가 발생했습니다.');
    }
  }


  handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    this.setState({ 
      [name]: type === 'checkbox' ? checked : value  // 체크박스인 경우 checked 값 사용
    }, () => {
      if (name === 'password' || name === 'passwordConfirm') {
        this.checkPasswordMatch();
      }
    });
  }

  checkPasswordMatch = () => {
    const { password, passwordConfirm } = this.state;
    const isMatch = password === passwordConfirm && password !== '';
    this.setState({ isPasswordMatch: isMatch });
  }

  handleCheckUsername = async () => {
    if(!this.state.username){
        alert('아이디를 입력해주세요.');
        return;
    }
    try {
        const response = await fetch(
            `${API_BASE_URL}/api/users/check-username?username=${this.state.username}`,
            {
                method: 'GET',  // GET 메서드 사용
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            }
        );
        
        const data = await response.json();
        
        if(response.ok) {
            if(data.isAvailable) {
                this.setState({isUsernameChecked: true});
                alert('사용 가능한 아이디입니다.');
            }
        } else {
            alert(data.error || '이미 사용 중인 아이디입니다.');
        }
    } catch (error) {
        console.error('중복 확인 중 오류:', error);
        alert('중복 확인에 실패했습니다.');
    }
  }

  handleSignup = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/signup`, {
        username: this.state.username,
        password: this.state.password,
        name: this.state.name,
        email: this.state.email,
        phone: this.state.phone
      });

      if (response.data.success) {
        alert('회원가입이 완료되었습니다.');
        this.props.onClose();  // 모달 닫기
      } else {
        alert(response.data.error || '회원가입에 실패했습니다.');
      }
    } catch (error) {
      console.error('회원가입 오류:', error);
      alert(error.response?.data?.error || '회원가입 처리 중 오류가 발생했습니다.');
    }
  }

  render() {
    if (!this.props.show) {
      return null;
    }

    return (
      <div className="signup-modal-overlay" onClick={this.props.onClose}>
        <div className="signup-modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2>회원가입</h2>
            <button className="close-button" onClick={this.props.onClose}>&times;</button>
          </div>
          
          <div className="modal-body">
            <div className="input-group">
              <label>아이디 *</label>
              <input 
                type="text" 
                name="username"
                placeholder="아이디 (6-12자)" 
                value={this.state.username}
                onChange={this.handleChange}
              />
              <button 
                type = "button" 
                className="check-button" 
                onClick={this.handleCheckUsername}
              >
                중복확인
                </button>             
            </div>

            <div className="input-group">
              <label>비밀번호 *</label>
              <input 
                type="password"
                name="password"
                placeholder="비밀번호 (8-16자)"
                value={this.state.password}
                onChange={this.handleChange}
              />
            </div>

            <div className="input-group">
              <label>비밀번호 확인 *</label>
              <input 
                type="password"
                name="passwordConfirm"
                placeholder="비밀번호 확인"
                value={this.state.passwordConfirm}
                onChange={this.handleChange}
              />
            </div>

            <div className="input-group">
              <label className={this.state.isPasswordMatch ? "match" : "mismatch"}>
                {this.state.isPasswordMatch 
                  ? "비밀번호가 일치합니다." 
                  : "비밀번호가 일치하지 않습니다."}
              </label>
            </div>

            <div className="input-group">
              <label>이름 *</label>
              <input 
              type="text"
               placeholder="이름"
               name="name"
               value={this.state.name}
               onChange={this.handleChange}
               />
            </div>

            <div className="input-group">
              <label>이메일 *</label>
              <input 
              type="email" 
              placeholder="example@email.com"
              name="email"
              value={this.state.email}
              onChange={this.handleChange}
              />
            </div>

            <div className="input-group">
        <label>휴대폰 번호 *</label>
        <div className="phone-input">
          <input 
            type="tel" 
            placeholder="010-0000-0000"
            name="phone"
            value={this.state.phone}
            onChange={this.handleChange}
          />
          <button 
            type="button" 
            className="verify-button"
            onClick={this.handleVerifyPhone}
            disabled={!this.state.phone || this.state.otpVerified}
          >
            {this.state.otpVerified ? '인증완료' : '인증요청'}
          </button>
        </div>
        
        {/* 인증번호 입력 필드 (인증번호 발송 후 표시) */}
        {this.state.otpSent && !this.state.otpVerified && (
          <div className="otp-input">
            <input
              type="text"
              placeholder="인증번호 입력"
              name="otp"
              value={this.state.otp}
              onChange={this.handleChange}
            />
            <button
              type="button"
              className="verify-button"
              onClick={this.handleVerifyOtp}
              disabled={!this.state.otp}
            >
              확인
            </button>
          </div>
        )}
              
            </div>

            <div className="agreement-group">
              <label className="checkbox-label">
                <input 
                type="checkbox"
                name="checkbox1"
                checked={this.state.checkbox1}
                onChange={this.handleChange}
                />
                <span>이용약관에 동의합니다. (필수)</span>
              </label>
              <label className="checkbox-label">
                <input 
                type="checkbox"
                name="checkbox2"
                checked={this.state.checkbox2}
                onChange={this.handleChange}
                />
                <span>개인정보 수집 및 이용에 동의합니다. (필수)</span>
              </label>
            </div>

            <button 
            type="button"
             className="signup-button"
             onClick={this.handleSignup}
             //버튼의 비활성화 조건
             disabled={
                   !this.state.username
                || !this.state.isUsernameChecked
                || !this.state.password
                || !this.state.passwordConfirm
                || !this.state.isPasswordMatch
                || !this.state.name
                || !this.state.email
                || !this.state.phone
                || !this.state.checkbox1
                || !this.state.checkbox2 
                || !this.state.phoneAuth}
             >
              회원가입
              </button>
          </div>
        </div>
      </div>
    );
  }
}

export default SignupModal;
