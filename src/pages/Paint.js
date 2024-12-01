// 페인트 페이지
// src/pages/Paint.js
import React, { useState, useRef, useEffect, useCallback } from 'react';
import './Paint.css';
import Body from '../components/Body';
import { BsPencilFill, BsFillEraserFill } from 'react-icons/bs';
import { MdClear, MdDelete, MdAddBox } from 'react-icons/md';
import VerticalContent from '../components/VerticalContent';

function Canvas({ id, onDelete, ws, color, brushSize, isEraser, onClear, onClick }) {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [lastX, setLastX] = useState(0);
    const [lastY, setLastY] = useState(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }, []);

    const drawLine = useCallback((x, y, lastX, lastY, strokeColor, lineWidth) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.beginPath();
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.closePath();
    }, []);

    useEffect(() => {
        if (!ws || !canvasRef.current) return;

        const messageHandler = async (event) => {
            try {
                const data = event.data;
                let message;
                
                if (data instanceof Blob) {
                    const text = await data.text();
                    message = JSON.parse(text);
                } else {
                    message = JSON.parse(data);
                }

                if (!canvasRef.current) {
                    console.log('메시지 처리 시 캔버스 참조 없음');
                    return;
                }

                if (message.canvasId === id) {
                    if (message.type === 'draw') {
                        if (message.x != null && 
                            message.y != null && 
                            message.lastX != null && 
                            message.lastY != null && 
                            message.color && 
                            message.brushSize) {
                            drawLine(
                                message.x, 
                                message.y, 
                                message.lastX, 
                                message.lastY, 
                                message.color, 
                                message.brushSize
                            );
                        } else {
                            console.log('잘못된 드로잉 데이터:', message);
                        }
                    } else if (message.type === 'clear') {
                        onClear();
                    }
                }
            } catch (error) {
                console.error('메시지 처리 중 오류:', error);
            }
        };

        ws.addEventListener('message', messageHandler);

        return () => {
            ws.removeEventListener('message', messageHandler);
        };
    }, [ws, id, drawLine]);

    const startDrawing = (e) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const coords = getCoordinates(e, canvas);
        setIsDrawing(true);
        setLastX(coords.x);
        setLastY(coords.y);
    };

    const sendDrawData = (x, y, lastX, lastY, color, brushSize) => {
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                type: 'draw',
                canvasId: id,
                x, y, lastX, lastY, color, brushSize
            }));
        }
    };

    const draw = useCallback((e) => {
        if (!isDrawing || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const coords = getCoordinates(e, canvas);
        
        // 최소 거리 체크를 위한 계산
        const distance = Math.sqrt(
            Math.pow(coords.x - lastX, 2) + 
            Math.pow(coords.y - lastY, 2)
        );
        
        // 거리가 너무 가깝거나 멀면 무시
        if (distance < 2 || distance > 100) return;

        drawLine(coords.x, coords.y, lastX, lastY, isEraser ? '#FFFFFF' : color, brushSize);
        
        // 그리기 데이터 전송
        if (ws && ws.readyState === WebSocket.OPEN) {
            const drawData = {
                type: 'draw',
                canvasId: id,
                x: coords.x,
                y: coords.y,
                lastX: lastX,
                lastY: lastY,
                color: isEraser ? '#FFFFFF' : color,
                brushSize: brushSize
            };
            ws.send(JSON.stringify(drawData));
        }

        setLastX(coords.x);
        setLastY(coords.y);
    }, [isDrawing, lastX, lastY, color, brushSize, isEraser, id, ws]);

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const clearCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // clear 메시지 전송
        if (ws && ws.readyState === WebSocket.OPEN) {
            const clearData = {
                type: 'clear',
                canvasId: id
            };
            ws.send(JSON.stringify(clearData));
        }
    }, [id, ws]);

    // 터치 이벤트 핸들러 추가
    const handleTouchStart = (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const canvas = canvasRef.current;
        const coords = getTouchCoordinates(touch, canvas);
        
        setIsDrawing(true);
        setLastX(coords.x);
        setLastY(coords.y);
    };

    const handleTouchMove = useCallback((e) => {
        e.preventDefault();
        if (!isDrawing) return;

        const touch = e.touches[0];
        const canvas = canvasRef.current;
        if (!canvas) return;

        const coords = getTouchCoordinates(touch, canvas);
        
        if (coords.x === lastX && coords.y === lastY) return;

        const distance = Math.sqrt(
            Math.pow(coords.x - lastX, 2) + 
            Math.pow(coords.y - lastY, 2)
        );
        
        if (distance < 2) return;

        drawLine(coords.x, coords.y, lastX, lastY, isEraser ? '#FFFFFF' : color, brushSize);
        sendDrawData(coords.x, coords.y, lastX, lastY, isEraser ? '#FFFFFF' : color, brushSize);

        setLastX(coords.x);
        setLastY(coords.y);
    }, [isDrawing, lastX, lastY, color, brushSize, isEraser, drawLine]);

    const handleTouchEnd = (e) => {
        e.preventDefault();
        setIsDrawing(false);
    };

    // preventDefault 함수를 컴포넌트 레벨에서 한 번만 정의
    const handlePreventDefault = (e) => {
        e.preventDefault();
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        
        if ('ontouchstart' in window) {
            // 캔버스 주변의 스크롤도 방지
            canvas.style.touchAction = 'none';
            document.body.style.overflow = 'hidden';
            
            // 이벤트 리스너 한 번만 추가
            canvas.addEventListener('touchmove', handlePreventDefault, { passive: false });

            return () => {
                document.body.style.overflow = 'auto';
                canvas.removeEventListener('touchmove', handlePreventDefault);
            };
        }
    }, []); // 의존성 배열 비움

    // 마우스 좌표 계산 함수 수정
    const getCoordinates = (e, canvas) => {
        const rect = canvas.getBoundingClientRect();
        
        // 상대적 위치를 백분율로 계산 (0~1 사이의 값)
        const relativeX = (e.clientX - rect.left) / rect.width;
        const relativeY = (e.clientY - rect.top) / rect.height;
        
        // 백분율 위치를 캔버스 크기에 적용
        return {
            x: Math.round(relativeX * canvas.width),
            y: Math.round(relativeY * canvas.height)
        };
    };

    // 터치 좌표 계산 함수 수정
    const getTouchCoordinates = (touch, canvas) => {
        const rect = canvas.getBoundingClientRect();
        
        // 상대적 위치를 백분율로 계산 (0~1 사이의 값)
        const relativeX = (touch.clientX - rect.left) / rect.width;
        const relativeY = (touch.clientY - rect.top) / rect.height;
        
        // 백분율 위치를 캔버스 크기에 적용
        return {
            x: relativeX * canvas.width,
            y: relativeY * canvas.height
        };
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const resizeCanvas = () => {
            // 가로 800px 기준으로 4:3 비율 적용 (800 x 1067)
            canvas.width = 800;
            canvas.height = 1067;  // 더 길어진 세로 길이

            const ctx = canvas.getContext('2d');
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        };

        resizeCanvas(); // 초기 크기 설정

        const resizeObserver = new ResizeObserver(() => {
            requestAnimationFrame(() => {
                // 크기가 변경되어도 실제 캔버스 크기는 유지
                const ctx = canvas.getContext('2d');
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
            });
        });

        resizeObserver.observe(canvas.parentElement);

        return () => {
            resizeObserver.disconnect();
        };
    }, []);

    return (
        <div className="canvas-container">
            <canvas
                ref={canvasRef}
                data-id={id}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseOut={stopDrawing}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                className="canvas"
                onClick={onClick}
                style={{ touchAction: 'none' }}
            />
        </div>
    );
}

function Paint() {
    const [canvases, setCanvases] = useState([{ id: 1 }]);
    const [ws, setWs] = useState(null);
    const [color, setColor] = useState('#000000');
    const [brushSize, setBrushSize] = useState(5);
    const [isEraser, setIsEraser] = useState(false);
    const [previousColor, setPreviousColor] = useState('#000000');
    const reconnectAttempts = useRef(0);
    const maxReconnectAttempts = 5;
    const reconnectTimeoutRef = useRef(null);
    const [lastClickedCanvasId, setLastClickedCanvasId] = useState(1); // 마지막 클릭한 캔버스 ID 추적

    // toggleEraser 함수
    const toggleEraser = () => {
        if (!isEraser) {
            setPreviousColor(color);
            setIsEraser(true);
        } else {
            setColor(previousColor);
            setIsEraser(false);
        }
    };

    // Canvas 컴포넌트에 전달할 클릭 핸들러
    const handleCanvasClick = (id) => {
        setLastClickedCanvasId(id);
    };

    // clearCanvas 함수 수정
    const clearCanvas = () => {
        // 마지막으로 클릭한 캔버스 ID 사용
        const canvas = document.querySelector(`canvas[data-id="${lastClickedCanvasId}"]`);
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // WebSocket 메시지 전송
        if (ws && ws.readyState === WebSocket.OPEN) {
            const clearData = {
                type: 'clear',
                canvasId: lastClickedCanvasId
            };
            console.log('WebSocket으로 clear 메시지 전송:', clearData);
            ws.send(JSON.stringify(clearData));
        } else {
            console.log('WebSocket 연결 상태:', ws ? ws.readyState : 'ws is null');
        }
    };

    useEffect(() => {
        const connectWebSocket = () => {
            // 최대 재연결 시도 횟수를 초과한 경우
            if (reconnectAttempts.current >= maxReconnectAttempts) {
                console.error('최대 재연결 시도 횟수를 초과했습니다.');
                return;
            }

            try {
                const newWs = new WebSocket('ws://183.105.171.41:8081');
                
                newWs.onopen = () => {
                    console.log('WebSocket 연결 성공');
                    setWs(newWs);
                    reconnectAttempts.current = 0; // 연결 성공시 카운터 리셋
                };
                
                newWs.onerror = (error) => {
                    console.error('WebSocket 연결 에러:', error);
                };
                
                newWs.onmessage = async (event) => {
                    const data = event.data;
                    let message;
                    
                    try {
                        if (data instanceof Blob) {
                            const text = await data.text();
                            message = JSON.parse(text);
                        } else {
                            message = JSON.parse(data);
                        }

                        // 메시지 처리
                        if (message.type === 'addCanvas') {
                            setCanvases(prev => [...prev, { id: message.id }]);
                        } else if (message.type === 'deleteCanvas') {
                            setCanvases(prev => prev.filter(canvas => canvas.id !== message.id));
                        }
                    } catch (error) {
                        console.error('메시지 처리 중 오류:', error);
                    }
                };
                
                newWs.onclose = (event) => {
                    if (event.wasClean) {
                        console.log(`WebSocket 연결 정상 종료 (코드=${event.code})`);
                    } else {
                        console.log('WebSocket 연결 끊김');
                        reconnectAttempts.current += 1;
                        
                        if (reconnectAttempts.current < maxReconnectAttempts) {
                            console.log(`재연결 시도 ${reconnectAttempts.current}/${maxReconnectAttempts}`);
                            reconnectTimeoutRef.current = setTimeout(connectWebSocket, 3000);
                        }
                    }
                };
            } catch (error) {
                console.error('WebSocket 연결 시도 중 오류:', error);
                reconnectAttempts.current += 1;
                
                if (reconnectAttempts.current < maxReconnectAttempts) {
                    reconnectTimeoutRef.current = setTimeout(connectWebSocket, 3000);
                }
            }
        };

        connectWebSocket();

        // 클린업 함수
        return () => {
            if (ws) {
                ws.close(1000, '정상 종료');
            }
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
        };
    }, []);

    const addCanvas = () => {
        const newId = Math.max(...canvases.map(c => c.id), 0) + 1;
        setCanvases(prev => [...prev, { id: newId }]);
        
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                type: 'addCanvas',
                id: newId
            }));
        }
    };

    const deleteCanvas = (id) => {
        if (canvases.length > 1) {
            setCanvases(prev => prev.filter(canvas => canvas.id !== id));
            
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: 'deleteCanvas',
                    id: id
                }));
            }
        }
    };

    return (
        <VerticalContent>
            <div className="paint-container">
                <div className="canvases-container">
                    {canvases.map(canvas => (
                        <Canvas
                            key={canvas.id}
                            id={canvas.id}
                            onDelete={deleteCanvas}
                            ws={ws}
                            color={color}
                            brushSize={brushSize}
                            isEraser={isEraser}
                            onClear={() => clearCanvas(canvas.id)}
                            onClick={() => handleCanvasClick(canvas.id)}
                        />
                    ))}
                </div>
                <div className="tools">
                    <input 
                        type="color" 
                        value={color} 
                        onChange={(e) => setColor(e.target.value)}
                        className="color-picker"
                        disabled={isEraser}
                    />
                    <input 
                        type="range" 
                        min="1" 
                        max="50" 
                        value={brushSize} 
                        onChange={(e) => setBrushSize(e.target.value)}
                        className="brush-size"
                    />
                    <button 
                        onClick={toggleEraser} 
                        className={`eraser-button ${isEraser ? 'active' : ''}`}
                        title={isEraser ? '펜' : '지우개'}
                    >
                        {isEraser ? <BsPencilFill /> : <BsFillEraserFill />}
                    </button>
                    <button 
                        onClick={clearCanvas}
                        className="clear-button"
                        title="모두 지우기"
                    >
                        <MdClear />
                    </button>
                    <button 
                        onClick={() => deleteCanvas(canvases[0].id)} 
                        className="delete-button"
                        title="캔버스 삭제"
                    >
                        <MdDelete />
                    </button>
                    <button 
                        onClick={addCanvas} 
                        className="add-canvas-button"
                        title="캔버스 추가"
                    >
                        <MdAddBox />
                    </button>
                </div>
            </div>
        </VerticalContent>
    );
}

export default Paint;
