import React, { Component } from 'react';
import BodyRectangle from '../components/BodyRectangle';
import './Home.css';
import HorizontalContent from '../components/HorizontalContent';
import VerticalContent from '../components/VerticalContent';
import Body from '../components/Body';

class Home extends Component {
  render() {
    return (
      
      <div className="home-container">
        
        <BodyRectangle>
          <div className="home-content">
            <h1>Hello!</h1>
            <h2>My Name is<br/>Sun Bee</h2>
          </div>
        </BodyRectangle>    
        
        <VerticalContent>
          {/* 세로 방향 컨텐츠 */}
        </VerticalContent>
        
        <HorizontalContent>
          {/* 가로 방향 컨텐츠 */}
        </HorizontalContent>
        
      </div>
      
    );
  }
}

export default Home;