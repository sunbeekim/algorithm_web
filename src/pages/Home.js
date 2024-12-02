import React, { Component } from 'react';
import BodyRectangle from '../components/BodyRectangle';
import './Home.css';
import HorizontalContent from '../components/HorizontalContent';
import VerticalContent from '../components/VerticalContent';

class Home extends Component {
  componentDidMount() {
    // 초기 로드 시 첫 번째 섹션은 보이게 설정
    const mainSection = document.querySelector('.main-section');
    if (mainSection) {
      mainSection.classList.add('visible');
    }

    // 스크롤 이벤트 리스너 추가
    window.addEventListener('scroll', this.handleScroll);
  }

  componentWillUnmount() {
    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    window.removeEventListener('scroll', this.handleScroll);
  }

  handleScroll = () => {
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
      const rect = section.getBoundingClientRect();
      const isVisible = rect.top <= window.innerHeight * 0.75;
      
      if (isVisible) {
        section.classList.add('visible');
      }
    });
  }

  render() {
    return (
      <div className="home-container">
        {/* 메인 섹션: 인사말 */}
        <section className="section main-section">
          <BodyRectangle>
            <div className="home-content">
              <h1>Hello!</h1>
              <h2>My Name is<br/>Sun Bee</h2>
            </div>
          </BodyRectangle>
        </section>

        {/* 소개 섹션 */}
        <section className="section intro-section">
          <div className="section-content">
            <h2>Welcome to My Website</h2>
            <p>웹사이트 소개 내용...</p>
          </div>
        </section>

        {/* 기능 소개 섹션 */}
        <section className="section features-section">
          <div className="section-content">
            <h2>Features</h2>
            <HorizontalContent>
              <div className="feature-item">
                <h3>기능 1</h3>
                <p>설명...</p>
              </div>
              <div className="feature-item">
                <h3>기능 2</h3>
                <p>설명...</p>
              </div>
            </HorizontalContent>
          </div>
        </section>

        {/* 기술 스택 섹션 */}
        <section className="section tech-stack-section">
          <div className="section-content">
            <h2>Tech Stack</h2>
            <div className="tech-stack-grid">
              {/* 기술 스택 아이템들 */}
            </div>
          </div>
        </section>

        {/* 프로필 섹션 */}
        <section className="section profile-section">
          <div className="section-content">
            <h2>About Me</h2>
            <div className="profile-content">
              {/* 프로필 내용 */}
            </div>
          </div>
        </section>

        {/* 추가 섹션을 위한 템플릿 */}
        <section className="section template-section">
          <div className="section-content">
            <h2>Section Title</h2>
            <div className="section-body">
              {/* 섹션 내용 */}
            </div>
          </div>
        </section>
      </div>
    );
  }
}

export default Home;