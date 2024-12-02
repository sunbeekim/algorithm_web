// 휴대폰 인증 컴포넌트
// 인증번호 발송 및 인증 기능 구현
// src/components_login/SignupModal.js
import React, { useState } from 'react';
import axios from 'axios';

const SmsAuth = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1);


  const requestOtp = async () => {
    try {
      const response = await axios.post('/api/send-otp', { phoneNumber });
      if (response.data.success) {
        alert('인증번호가 발송되었습니다.');
        setStep(2); // 다음 단계로 이동
      } else {
        alert('인증번호 발송 실패');
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      alert('오류가 발생했습니다.');
    }
  };

  const verifyOtp = async () => {
    try {
      const response = await axios.post('/api/verify-otp', { phoneNumber, otp });
      if (response.data.success) {
        alert('인증이 완료되었습니다!');
      } else {
        alert('인증번호가 올바르지 않습니다.');
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      alert('오류가 발생했습니다.');
    }
  };
};

export default SmsAuth;