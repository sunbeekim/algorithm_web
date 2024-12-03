import React from 'react';
import './Bottom.css';
import { Link } from 'react-router-dom';
import { FaGithub, FaEnvelope, FaPhone } from 'react-icons/fa';
import VerticalContent from './VerticalContent';

function Bottom() {
    return (
        <VerticalContent>
        <footer className="bottom">
            <div className="bottom-content">
                {/* About Us 섹션 */}
                <div className="bottom-section">
                    <h3>About Us</h3>
                    <p>코딩 커뮤니티 플랫폼</p>
                    <p>함께 성장하는 개발자 공간</p>
                </div>

                {/* Quick Links 섹션 */}
                <div className="bottom-section">
                    <h3>Quick Links</h3>
                    <ul>
                        <li><Link to="/home">홈</Link></li>
                        <li><Link to="/board">게시판</Link></li>
                        <li><Link to="/coding">코딩</Link></li>
                        <li><Link to="/algorithm">알고리즘</Link></li>
                        <li><Link to="/chatroom/:chatroomId">그림판채팅</Link></li>
                        <li><Link to="/ranking">랭킹</Link></li>
                    </ul>
                </div>

                {/* Contact 섹션 */}
               
                    <div className="bottom-section">
                        <h3>Contact</h3>
                        <div className="contact-info">
                            <div className="contact-item">
                                <FaEnvelope className="contact-icon" />
                                <span>Email: contact@example.com</span>
                            </div>
                            <div className="contact-item">
                                <FaPhone className="contact-icon" />
                                <span>Phone: 010-1234-5678</span>
                            </div>
                            <a href="https://github.com" 
                               target="_blank" 
                               rel="noopener noreferrer" 
                               className="contact-item">
                                <FaGithub className="contact-icon" />
                                <span>GitHub</span>
                            </a>
                        </div>
                    </div>
                
            </div>

            {/* Footer 섹션 */}
            <div className="bottom-footer">
                <p>&copy; 2024 Your Website. All rights reserved.</p>
            </div>
        </footer>
        </VerticalContent>
    );
}

export default Bottom; 