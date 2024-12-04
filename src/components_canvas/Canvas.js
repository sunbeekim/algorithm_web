// /src/components_canvas/Canvas.js

import React, { useState, useRef, useEffect, useCallback } from 'react';
import './Canvas.css';
import DrawingTools from './DrawingTools';

const WS_URL = process.env.REACT_APP_WS_URL || 'ws://183.105.171.41:8081/ws';

function Canvas({ chatroomId }) {
    console.log('Canvas 컴포넌트 마운트:', { chatroomId });
    
    // =========== 상태 선언 ===========
    // Canvas 관련 상태
    const canvasRefs = useRef({});
    const [canvases, setCanvases] = useState([{ id: 1 }]);
    const [activeCanvasId, setActiveCanvasId] = useState(1);
    const [isDrawing, setIsDrawing] = useState(false);
    const [lastX, setLastX] = useState(0);
    const [lastY, setLastY] = useState(0);
    const [context, setContext] = useState(null);
    const [currentChatroomId, setCurrentChatroomId] = useState(null);
    
    // 그리기 도구 관련 상태
    const [color, setColor] = useState('#000000');
    const [brushSize, setBrushSize] = useState(5);
    const [isEraser, setIsEraser] = useState(false);
    const [previousColor, setPreviousColor] = useState('#000000');
    
    // WebSocket 관련 상태
    const [ws, setWs] = useState(null);
    const reconnectAttempts = useRef(0);
    const maxReconnectAttempts = 5;
    const reconnectTimeoutRef = useRef(null);
    const [isTwoFingerTouch, setIsTwoFingerTouch] = useState(false);

    // 캔버스 크기 상태
    const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
    const containerRef = useRef(null);

    // =========== 함수 선언 ===========
    // 좌표 변환 함수 추가
    const getScaledCoordinates = useCallback((clientX, clientY, canvas) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    }, []);

    // 캔버스 크기 조정 함수
    const updateCanvasSize = useCallback(() => {
        if (!containerRef.current) return;
        
        const container = containerRef.current;
        const containerWidth = container.clientWidth;
        const aspectRatio = 3/4; // 4:3 비율 유지
        
        // 컨테이너 너비에 맞춰 캔버스 크기 조정
        const newWidth = Math.min(800, containerWidth - 40); // 여백 고려
        const newHeight = newWidth * aspectRatio;
        
        setCanvasSize({ width: newWidth, height: newHeight });
        console.log('캔버스 크기 업데이트:', { width: newWidth, height: newHeight });
    }, []);
    
    // 그리기 함수를 먼저 선언
    const drawLine = useCallback((x, y, lastX, lastY, strokeColor, lineWidth, canvasId) => {
        const canvas = canvasRefs.current[canvasId];
        if (!canvas) {
            console.error('캔버스를 찾을 수 없음:', canvasId);
            return;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.error('컨텍스트를 가져올 수 없음');
            return;
        }

        // 두 점 사이의 거리 계산
        const dx = x - lastX;
        const dy = y - lastY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // 보간할 점의 개수 결정 (거리에 비례)
        const steps = Math.max(Math.floor(distance / 2), 1);
        
        ctx.beginPath();
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // 부드러운 선을 위한 보간
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const interpolatedX = lastX + dx * t;
            const interpolatedY = lastY + dy * t;
            
            if (i === 0) {
                ctx.moveTo(interpolatedX, interpolatedY);
            } else {
                ctx.lineTo(interpolatedX, interpolatedY);
            }
        }
        
        ctx.stroke();
    }, []);

    // 마우스 이벤트 핸들러 수정
    const handleDrawStart = useCallback((e, canvasId) => {
        e.preventDefault();
        const canvas = canvasRefs.current[canvasId];
        if (!canvas) return;

        setActiveCanvasId(canvasId);
        const coords = getScaledCoordinates(e.clientX, e.clientY, canvas);
        setIsDrawing(true);
        setLastX(coords.x);
        setLastY(coords.y);
    }, [getScaledCoordinates]);

const handleDrawMove = useCallback((e, canvasId) => {
        if (!isDrawing) return;
        e.preventDefault();
        
        const canvas = canvasRefs.current[canvasId];
        if (!canvas) return;

    const coords = getScaledCoordinates(e.clientX, e.clientY, canvas);
    
    // 로컬 그리기
    drawLine(
        coords.x,
        coords.y,
        lastX,
        lastY,
        isEraser ? '#FFFFFF' : color,
        brushSize,
        canvasId
    );
    
    // WebSocket 메시지 전송 - 구조 단순화
    if (ws?.readyState === WebSocket.OPEN && currentChatroomId) {
        const drawData = {
            type: 'draw',
            chatroomId: currentChatroomId,
            x: coords.x,
            y: coords.y,
            lastX: lastX,
            lastY: lastY,
            color: isEraser ? '#FFFFFF' : color,
            brushSize: brushSize,
            canvasId: canvasId
        };
        console.log('그리기 데이터 전송:', drawData);
        ws.send(JSON.stringify(drawData));
    }
    
    setLastX(coords.x);
    setLastY(coords.y);
}, [isDrawing, lastX, lastY, color, brushSize, isEraser, ws, currentChatroomId, drawLine, getScaledCoordinates]);

// handleDrawEnd 함수 수정
    const handleDrawEnd = useCallback(() => {
        setIsDrawing(false);
    }, []);

    // 터치 이벤트 핸들러 추가
    const handleTouchStart = useCallback((e, canvasId) => {
        e.preventDefault(); // 스크롤 방지
        const canvas = canvasRefs.current[canvasId];
        if (!canvas) return;

        setActiveCanvasId(canvasId);
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const coords = getScaledCoordinates(touch.clientX, touch.clientY, canvas);
        
        setActiveCanvasId(canvasId);
        setIsDrawing(true);
        setLastX(coords.x);
        setLastY(coords.y);
    }, [getScaledCoordinates]);

const handleTouchMove = useCallback((e, canvasId) => {
        if (!isDrawing || !currentChatroomId) return;
        e.preventDefault();
        
        const canvas = canvasRefs.current[canvasId];
        if (!canvas) return;

        const touch = e.touches[0];
        const coords = getScaledCoordinates(touch.clientX, touch.clientY, canvas);
        
        // 로컬 그리기
        drawLine(
            coords.x,
            coords.y,
            lastX,
            lastY,
            isEraser ? '#FFFFFF' : color,
            brushSize,
            canvasId
        );
        
        // WebSocket 메시지 전송
        if (ws?.readyState === WebSocket.OPEN && currentChatroomId) {
            const drawData = {
                type: 'draw',
                chatroomId: currentChatroomId,
                clientChatroomId: currentChatroomId,
                x: coords.x,
                y: coords.y,
                lastX: lastX,
                lastY: lastY,
                color: isEraser ? '#FFFFFF' : color,
                brushSize: brushSize,
                canvasId: canvasId
            };
            ws.send(JSON.stringify(drawData));
        }
        
        setLastX(coords.x);
        setLastY(coords.y);
    }, [isDrawing, lastX, lastY, color, brushSize, isEraser, ws, currentChatroomId, drawLine, getScaledCoordinates]);

const handleTouchEnd = useCallback(() => {
        console.log('터치 종료');
        setIsDrawing(false);
    }, []);

// 캔버스 초기화 함수 수정
    const initializeCanvas = useCallback((canvas, id) => {
        if (!canvas || canvasRefs.current[id]) return;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = 800;
        canvas.height = 1000;
        
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        canvasRefs.current[id] = canvas;
    }, []);

    

// clearCanvas 함수를 먼저 선언
    const clearCanvas = useCallback((canvasId) => {
        console.log('캔버스 내용 지우기 시도:', canvasId);
        
        const canvas = canvasRefs.current[canvasId];
        if (!canvas) {
            console.error('캔버스를 찾을 수 없음:', canvasId);
            return;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.error('컨텍스트를 가져올 수 없음');
            return;
        }

        // 해당 캔버스의 내용만 지우기
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // WebSocket으로 clear 메시지 전송
        if (ws?.readyState === WebSocket.OPEN) {
            const clearData = {
                type: 'clear',
                chatroomId: currentChatroomId,
                canvasId: canvasId
            };
            console.log('지우기 데이터 전송:', clearData);
            ws.send(JSON.stringify(clearData));
        }
    }, [ws, currentChatroomId, color, brushSize]);


// 캔버스 추가 핸들러 수정
    const addCanvas = useCallback(() => {
        console.log('캔버스 추가 시도');
        const newId = canvases.length > 0 
            ? Math.max(...canvases.map(c => c.id)) + 1 
            : 1;
        
        setCanvases(prevCanvases => {
            const newCanvases = [...prevCanvases, { id: newId }];
            console.log('새로운 캔버스 목록:', newCanvases);
            return newCanvases;
        });

        // 새 캔버스를 활성 캔버스로 설정
        setActiveCanvasId(newId);

        // WebSocket으로 캔버스 추가 이벤트 전송
        if (ws?.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                type: 'addCanvas',
                chatroomId: currentChatroomId,
                clientChatroomId: currentChatroomId,
                canvasId: newId
            }));
        }
    }, [canvases, ws, currentChatroomId]);

// 캔버스 삭제 핸들러 수정
    const deleteCanvas = useCallback((id) => {
        console.log('캔버스 삭제 시도:', id);
        if (canvases.length <= 1) {
            console.log('마지막 캔버스는 삭제할 수 없습니다.');
            return;
        }

        setCanvases(prevCanvases => {
            const newCanvases = prevCanvases.filter(canvas => canvas.id !== id);
            console.log('업데이트된 캔버스 목록:', newCanvases);
            return newCanvases;
        });

        // WebSocket으로 캔버스 삭제 이벤트 전송
        if (ws?.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                type: 'deleteCanvas',
                chatroomId: currentChatroomId,
                clientChatroomId: currentChatroomId,
                canvasId: id
            }));
        }
    }, [canvases, ws, currentChatroomId]);

// 지우개 토글 핸들러
    const toggleEraser = useCallback(() => {
        if (!isEraser) {
            setPreviousColor(color);
            setIsEraser(true);
        } else {
            setColor(previousColor);
            setIsEraser(false);
        }
    }, [isEraser, color, previousColor]);

// WebSocket 메시지 핸들러를 컴포넌트 최상위 레벨로 이동
const handleWebSocketMessage = useCallback(async (event) => {
    try {
        let message;
        if (typeof event.data === 'string') {
            message = JSON.parse(event.data);
        } else if (event.data instanceof Blob) {
            const text = await event.data.text();
            message = JSON.parse(text);
        }

        console.log('수신된 WebSocket 메시지:', message);

        switch (message.type) {
            case 'draw':
                const drawData = message;
                if (drawData.x != null && 
                    drawData.y != null && 
                    drawData.lastX != null && 
                    drawData.lastY != null) {
                    drawLine(
                        drawData.x,
                        drawData.y,
                        drawData.lastX,
                        drawData.lastY,
                        drawData.color,
                        drawData.brushSize,
                        drawData.canvasId || activeCanvasId
                    );
                }
                break;

            case 'clear':
                console.log('지우기 메시지 수신:', message);
                const canvasToClear = canvasRefs.current[message.canvasId];
                if (canvasToClear) {
                    const ctx = canvasToClear.getContext('2d');
                    if (ctx) {
                        ctx.fillStyle = '#FFFFFF';
                        ctx.fillRect(0, 0, canvasToClear.width, canvasToClear.height);
                    }
                }
                break;

            case 'addCanvas':
                setCanvases(prevCanvases => {
                    if (!prevCanvases.some(canvas => canvas.id === message.canvasId)) {
                        return [...prevCanvases, { id: message.canvasId }];
                    }
                    return prevCanvases;
                });
                break;

            case 'deleteCanvas':
                setCanvases(prevCanvases => {
                    if (prevCanvases.length > 1) {
                        return prevCanvases.filter(canvas => canvas.id !== message.canvasId);
                    }
                    return prevCanvases;
                });
                break;
        }
    } catch (error) {
        console.error('메시지 처리 중 오류:', error);
    }
}, [drawLine, activeCanvasId, setCanvases]);

// WebSocket 에러 핸들러
    const handleWebSocketError = (error) => {
        console.error('WebSocket 에러:', error);
    };

    // WebSocket 연결 종료 핸들러
    const handleWebSocketClose = (event) => {
        if (!event.wasClean) {
            handleReconnect();
        }
    };

// 재연결 핸들러
    const handleReconnect = useCallback(() => {
        if (reconnectAttempts.current < maxReconnectAttempts) {
            reconnectTimeoutRef.current = setTimeout(() => {
                reconnectAttempts.current += 1;
                // WebSocket 재연결 로직
            }, 3000);
        }
    }, []);






//========================================================================//

    // 각 캔버스 요소가 마운트될 때 초기화
    useEffect(() => {
        const canvasElements = document.querySelectorAll('.canvas');
        canvasElements.forEach(canvas => {
        const ctx = initializeCanvas(canvas);
        if (ctx) {
                setContext(ctx);
            }
        });
    }, [canvases.length, initializeCanvas]);

    // chatroomId가 변경될 때마다 상태 업데이트
    useEffect(() => {
        if (chatroomId) {
            console.log('채팅방 ID 설정:', chatroomId);
            setCurrentChatroomId(parseInt(chatroomId, 10));
        }
    }, [chatroomId]);


    // 컴포넌트 시작 부분에 prop 확인 로그 추가
    useEffect(() => {
        console.log('Canvas 컴포넌트가 받은 chatroomId:', {
            rawValue: chatroomId,
            parsedValue: parseInt(chatroomId, 10),
            type: typeof chatroomId
        });
    }, [chatroomId]);

    // 윈도우 리사이즈 이벤트 처리
    useEffect(() => {
        updateCanvasSize();
        window.addEventListener('resize', updateCanvasSize);
        return () => window.removeEventListener('resize', updateCanvasSize);
    }, [updateCanvasSize]);
    

    // 컴포넌트 마운트 시 디버깅
    useEffect(() => {
        console.log('Canvas 컴포넌트 마운트됨');
        console.log('받은 chatroomId:', chatroomId);
    }, []);

    // WebSocket 연결 설정을 별도의 useEffect로 분리
    useEffect(() => {
        if (!currentChatroomId) return;

        let wsInstance = null;

        const connectWebSocket = () => {
            if (wsInstance?.readyState === WebSocket.OPEN) return;

            try {
                wsInstance = new WebSocket(WS_URL);
                
                wsInstance.onopen = () => {
                    setWs(wsInstance);
                    wsInstance.send(JSON.stringify({
                        type: 'join',
                        chatroomId: currentChatroomId
                    }));
                };

                wsInstance.onmessage = handleWebSocketMessage;
                wsInstance.onerror = handleWebSocketError;
                wsInstance.onclose = handleWebSocketClose;
                
            } catch (error) {
                console.error('WebSocket 연결 실패:', error);
            }
        };

        connectWebSocket();
        
        return () => {
            if (wsInstance) {
                wsInstance.close();
            }
        };
    }, [currentChatroomId]); // 최소한의 의존성만 포함

    
    // chatroomId 유효성 검사 추가
    useEffect(() => {
        if (!chatroomId) {
            console.error('chatroomId가 없습니다:', chatroomId);
            return;
        }
        console.log('현재 chatroomId:', chatroomId);
    }, [chatroomId]);


    return (
        <div className="canvas-container" ref={containerRef}>
            <div className="canvases-wrapper">
                {canvases.map(canvas => (
                    <canvas
                        key={canvas.id}
                        ref={el => el && initializeCanvas(el, canvas.id)}
                        className="canvas"
                        width={800}
                        height={1000}
                        onMouseDown={e => handleDrawStart(e, canvas.id)}
                        onMouseMove={e => handleDrawMove(e, canvas.id)}
                        onMouseUp={handleDrawEnd}
                        onMouseOut={handleDrawEnd}
                        onTouchStart={e => handleTouchStart(e, canvas.id)}
                        onTouchMove={e => handleTouchMove(e, canvas.id)}
                        onTouchEnd={handleTouchEnd}
                        style={{
                            width: `${canvasSize.width}px`,
                            height: `${canvasSize.height}px`,
                            border: canvas.id === activeCanvasId ? '2px solid #0066ff' : '1px solid #000',
                            touchAction: 'none', // 터치 동작 방지
                            cursor: isEraser ? 'cell' : 'crosshair'
                        }}
                    />
                ))}
            </div>
            <DrawingTools
                color={color}
                brushSize={brushSize}
                isEraser={isEraser}
                onColorChange={setColor}
                onBrushSizeChange={setBrushSize}
                onEraserToggle={toggleEraser}
                onClear={clearCanvas}
                onAddCanvas={addCanvas}
                onDeleteCanvas={deleteCanvas}
                canvasId={canvases[0]?.id}
                activeCanvasId={activeCanvasId}
            />
        </div>
    );
    
}

export default Canvas;