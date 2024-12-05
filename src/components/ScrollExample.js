import React, { useState, useEffect } from 'react';
import './ScrollExample.css';

function ScrollExample() {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            // 스크롤이 100px 이상 되면 scrolled를 true로 설정
            const isScrolled = window.scrollY > 100;
            if (isScrolled !== scrolled) {
                setScrolled(isScrolled);
            }
        };

        window.addEventListener('scroll', handleScroll);

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, [scrolled]);

    return (
        <div className={`scroll-container ${scrolled ? 'scrolled' : ''}`}>
            <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
                <h1>스크롤 예제</h1>
            </nav>
            <div className="content">
                <p>아래로 스크롤해보세요</p>
                {/* 스크롤을 위한 더미 컨텐츠 */}
                {Array(20).fill().map((_, i) => (
                    <div key={i} className="dummy-content">
                        컨텐츠 {i + 1}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default ScrollExample; 