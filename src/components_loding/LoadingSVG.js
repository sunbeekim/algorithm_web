import React, { Component } from 'react';
import './LoadingSVG.css';

class LoadingSVG extends Component {
  state = {
    planets: [
      { id: 'sun', r: 6, orbit: 0, speed: 0, color: '#FDB813' },  // 태양
      { id: 'mercury', r: 3, orbit: 25, speed: 4.1, color: '#A0522D' },  // 수성
      { id: 'venus', r: 4, orbit: 35, speed: 1.6, color: '#FFA07A' },  // 금성
      { id: 'earth', r: 5, orbit: 45, speed: 1, color: '#4B9CD3' },  // 지구
      { id: 'mars', r: 4, orbit: 55, speed: 0.5, color: '#CD5C5C' },  // 화성
    ]
  };

  componentDidMount() {
    this.mounted = true;
    this.tick();
  }

  componentWillUnmount() {
    this.mounted = false;
  }

  tick = () => {
    this.setState(prevState => ({
      planets: prevState.planets.map(planet => ({
        ...planet,
        angle: (planet.angle || 0) + planet.speed * 0.02
      }))
    }));

    if (this.mounted) {
      requestAnimationFrame(this.tick);
    }
  };

  render() {
    const centerX = 60;
    const centerY = 60;

    return (
      <div className="loading">
        <svg width="120" height="120">
          {this.state.planets.map(planet => {
            const angle = planet.angle || 0;
            const x = centerX + planet.orbit * Math.cos(angle);
            const y = centerY + planet.orbit * Math.sin(angle);

            return (
              <g key={planet.id}>
                {/* 궤도 */}
                {planet.orbit > 0 && (
                  <circle
                    cx={centerX}
                    cy={centerY}
                    r={planet.orbit}
                    fill="none"
                    stroke="#333"
                    strokeWidth="0.5"
                  />
                )}
                {/* 행성 */}
                <circle
                  r={planet.r}
                  cx={x}
                  cy={y}
                  fill={planet.color}
                />
              </g>
            );
          })}
        </svg>
      </div>
    );
  }
}

export default LoadingSVG;