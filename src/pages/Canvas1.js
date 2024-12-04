// // 페인트 페이지
// // src/pages/Canvas.js
// import React, { useState, useRef, useEffect, useCallback } from 'react';
// import './Canvas.css';
// import Body from '../components/Body';
// import { BsPencilFill, BsFillEraserFill } from 'react-icons/bs';
// import { MdClear, MdDelete, MdAddBox } from 'react-icons/md';
// import VerticalContent from '../components/VerticalContent';
// import axios from 'axios';
// import ChatroomModal from '../components_chatting/ChatroomModal';
// import ChatModal from '../components_chatting/ChatModal';
// import { FaSearch } from 'react-icons/fa';
// import SearchResultModal from '../components_chatting/SearchResultModal';

// const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://183.105.171.41:8080';
// const WS_URL = process.env.REACT_APP_WS_URL || 'ws://183.105.171.41:8081/ws';

// function Canvas({ id, onDelete, ws, color, brushSize, isEraser, onClear, onClick, chatroomId }) {
//     const canvasRef = useRef(null);
//     const [isDrawing, setIsDrawing] = useState(false);
//     const [lastX, setLastX] = useState(0);
//     const [lastY, setLastY] = useState(0);
//     const [isChatting, setIsChatting] = useState(false);
//     const [chatName, setChatName] = useState('');
//     const [chatRooms, setChatRooms] = useState([]);
//     const [showChatroomModal, setShowChatroomModal] = useState(false);
//     const [showChatModal, setShowChatModal] = useState(false);
//     const [isTwoFingerTouch, setIsTwoFingerTouch] = useState(false);
//     const [lastTouchY, setLastTouchY] = useState(0);
//     const [searchText, setSearchText] = useState('');    
//     const [searchResults, setSearchResults] = useState([]);
//     const [showSearchModal, setShowSearchModal] = useState(false);
    
//     useEffect(() => {
//         const canvas = canvasRef.current;
//         if (!canvas) return;

//         const ctx = canvas.getContext('2d');
//         ctx.lineCap = 'round';
//         ctx.lineJoin = 'round';
//         ctx.fillStyle = '#FFFFFF';
//         ctx.fillRect(0, 0, canvas.width, canvas.height);
//     }, []);

//     const drawLine = useCallback((x, y, lastX, lastY, strokeColor, lineWidth) => {
//         const canvas = canvasRef.current;
//         if (!canvas) return;

//         const ctx = canvas.getContext('2d');
//         if (!ctx) return;

//         ctx.beginPath();
//         ctx.strokeStyle = strokeColor;
//         ctx.lineWidth = lineWidth;
//         ctx.lineCap = 'round';
//         ctx.lineJoin = 'round';
//         ctx.moveTo(lastX, lastY);
//         ctx.lineTo(x, y);
//         ctx.stroke();
//         ctx.closePath();
//     }, []);

//     useEffect(() => {
//         if (!ws || !canvasRef.current) return;
    
//         const messageHandler = async (event) => {
//             try {
//                 const data = event.data;
//                 let message;
                
//                 if (data instanceof Blob) {
//                     const text = await data.text();
//                     message = JSON.parse(text);
//                 } else {
//                     message = JSON.parse(data);
//                 }
    
//                 // chatroomId 비교 수정
//                 if (parseInt(message.chatroomId, 10) === parseInt(chatroomId, 10)) {
//                     if (message.type === 'draw') {
//                         if (message.x != null && 
//                             message.y != null && 
//                             message.lastX != null && 
//                             message.lastY != null && 
//                             message.color && 
//                             message.brushSize) {
//                             drawLine(
//                                 message.x, 
//                                 message.y, 
//                                 message.lastX, 
//                                 message.lastY, 
//                                 message.color, 
//                                 message.brushSize
//                             );
//                         }
//                     } else if (message.type === 'clear') {
//                         onClear();
//                     }
//                 }
//             } catch (error) {
//                 console.error('메시지 처리 중 오류:', error);
//             }
//         };
    
//         ws.addEventListener('message', messageHandler);
    
//         return () => {
//             ws.removeEventListener('message', messageHandler);
//         };
//     }, [ws, id, chatroomId, onClear, drawLine]);

//     const startDrawing = (e) => {
//         const canvas = canvasRef.current;
//         if (!canvas) return;

//         const coords = getCoordinates(e, canvas);
//         setIsDrawing(true);
//         setLastX(coords.x);
//         setLastY(coords.y);
//     };

//     const sendDrawData = (x, y, lastX, lastY, color, brushSize) => {
//         if (ws && ws.readyState === WebSocket.OPEN) {
//             const drawData = {
//                 type: 'draw',
//                 chatroomId: chatroomId,
//                 canvasId: id,
//                 x, y, lastX, lastY,
//                 color,
//                 brushSize
//             };
//             console.log('그리기 데이터 전송 시도:', {
//                 type: 'draw',
//                 chatroomId,
//                 canvasId: id,
//                 wsState: ws.readyState
//             });
//             ws.send(JSON.stringify(drawData));
//         } else {
//             console.log('WebSocket 상태:', {
//                 connected: !!ws,
//                 readyState: ws?.readyState,
//                 chatroomId
//             });
//         }
//     };

//     const draw = useCallback((e) => {
//         if (!isDrawing || !canvasRef.current) return;
    
//         const canvas = canvasRef.current;
//         const coords = getCoordinates(e, canvas);
        
//         const distance = Math.sqrt(
//             Math.pow(coords.x - lastX, 2) + 
//             Math.pow(coords.y - lastY, 2)
//         );
        
//         if (distance < 2 || distance > 100) return;
    
//         drawLine(coords.x, coords.y, lastX, lastY, isEraser ? '#FFFFFF' : color, brushSize);
        
//         // WebSocket 메시지 전송 수정
//         if (ws && ws.readyState === WebSocket.OPEN) {
//             const drawData = {
//                 type: 'draw',
//                 chatroomId: parseInt(chatroomId, 10),
//                 canvasId: id,
//                 x: coords.x,
//                 y: coords.y,
//                 lastX: lastX,
//                 lastY: lastY,
//                 color: isEraser ? '#FFFFFF' : color,
//                 brushSize: brushSize
//             };
//             ws.send(JSON.stringify(drawData));
//             console.log('그리기 데이터 전송:', drawData); // 디버깅용
//         }
    
//         setLastX(coords.x);
//         setLastY(coords.y);
//     }, [isDrawing, lastX, lastY, color, brushSize, isEraser, id, ws, chatroomId]);
//     const stopDrawing = () => {
//         setIsDrawing(false);
//     };

//     const clearCanvas = useCallback(() => {
//         const canvas = canvasRef.current;
//         if (!canvas) return;

//         const ctx = canvas.getContext('2d');
//         if (!ctx) return;

//         ctx.fillStyle = '#FFFFFF';
//         ctx.fillRect(0, 0, canvas.width, canvas.height);

//         // clear 메시지 전송
//         if (ws && ws.readyState === WebSocket.OPEN) {
//             const clearData = {
//                 type: 'clear',
//                 canvasId: id
//             };
//             ws.send(JSON.stringify(clearData));
//         }
//     }, [id, ws]);

//     // // 터치 이벤트 핸들러
//     // const handleTouchStart = (e) => {
//     //     if (e.touches.length === 2) {
//     //         // 두 손가락 터치 시 그리기 방지
//     //         setIsTwoFingerTouch(true);
//     //         setIsDrawing(false);
//     //         e.preventDefault();
//     //         return;
//     //     }
        
//     //     // 한 손가락 터치일 때만 그리기 시작
//     //     if (!isTwoFingerTouch) {
//     //         e.preventDefault();
//     //         const touch = e.touches[0];
//     //         const canvas = canvasRef.current;
//     //         if (!canvas) return;

//     //         const coords = getTouchCoordinates(touch, canvas);
//     //         setIsDrawing(true);
//     //         setLastX(coords.x);
//     //         setLastY(coords.y);
//     //     }
//     // };

    

//     // preventDefault 함수를 컴포넌트 레벨에서 한 번만 정의
//     const handlePreventDefault = (e) => {
//         e.preventDefault();
//     };

//     useEffect(() => {
//         const canvas = canvasRef.current;
        
//         if ('ontouchstart' in window) {
//             // 캔버스 주변의 스크롤도 방지
//             canvas.style.touchAction = 'none';
//             document.body.style.overflow = 'hidden';
            
//             // 이벤트 리스너 한 번만 추가
//             canvas.addEventListener('touchmove', handlePreventDefault, { passive: false });

//             return () => {
//                 document.body.style.overflow = 'auto';
//                 canvas.removeEventListener('touchmove', handlePreventDefault);
//             };
//         }
//     }, []); // 의존성 배열 비움

//     // 마우스 좌표 계산 함수 수정
//     const getCoordinates = (e, canvas) => {
//         const rect = canvas.getBoundingClientRect();
        
//         // 상대적 위치를 백분율로 계산 (0~1 사이의 값)
//         const relativeX = (e.clientX - rect.left) / rect.width;
//         const relativeY = (e.clientY - rect.top) / rect.height;
        
//         // 백분율 위치를 캔버스 크기에 적용
//         return {
//             x: Math.round(relativeX * canvas.width),
//             y: Math.round(relativeY * canvas.height)
//         };
//     };

//     // 터치 좌표 계산 함수 수정
//     const getTouchCoordinates = (touch, canvas) => {
//         const rect = canvas.getBoundingClientRect();
        
//         // 상대적 위치를 백분율로 계산 (0~1 사이의 값)
//         const relativeX = (touch.clientX - rect.left) / rect.width;
//         const relativeY = (touch.clientY - rect.top) / rect.height;
        
//         // 백분율 위치를 캔버스 크기에 적용
//         return {
//             x: relativeX * canvas.width,
//             y: relativeY * canvas.height
//         };
//     };

//     useEffect(() => {
//         const canvas = canvasRef.current;
//         if (!canvas) return;

//         const resizeCanvas = () => {
//             // 가로 800px 기준으로 4:3 비율 적용 (800 x 1067)
//             canvas.width = 800;
//             canvas.height = 1067;  // 더 길어진 세로 길이

//             const ctx = canvas.getContext('2d');
//             ctx.lineCap = 'round';
//             ctx.lineJoin = 'round';
//             ctx.fillStyle = '#FFFFFF';
//             ctx.fillRect(0, 0, canvas.width, canvas.height);
//         };

//         resizeCanvas(); // 초기 크기 설정

//         const resizeObserver = new ResizeObserver(() => {
//             requestAnimationFrame(() => {
//                 // 크기가 변경되어도 실제 캔버스 크기는 유지
//                 const ctx = canvas.getContext('2d');
//                 ctx.lineCap = 'round';
//                 ctx.lineJoin = 'round';
//             });
//         });

//         resizeObserver.observe(canvas.parentElement);

//         return () => {
//             resizeObserver.disconnect();
//         };
//     }, []);

//     // 채팅방 목록 조회
//     useEffect(() => {
//         const fetchChatRooms = async () => {
//             try {
//                 const response = await axios.get(`${API_BASE_URL}/api/my-chatrooms`, {
//                     withCredentials: true
//                 });
//                 setChatRooms(response.data);
//             } catch (error) {
//                 console.error('채팅방 목록 조회 실패:', error);
//             }
//         };
//         fetchChatRooms();
//     }, []);

//     // 채팅방 생성 핸들러
//     const handleAddChatRoom = async (chatroomData) => {
//         try {
//             // 데이터베이스 스키마에 맞게 필드 수정
//             const response = await axios.post(`${API_BASE_URL}/api/chatrooms`, {
//                 chatname: chatroomData.name,
//                 name: chatroomData.name,  // name 필드 추가
//                 description: `${chatroomData.name}의 채팅방입니다.`,
//                 is_group: false,  // tinyint 타입
//                 password: chatroomData.password || null
//             }, {
//                 withCredentials: true,
//                 headers: {
//                     'Content-Type': 'application/json'
//                 }
//             });

//             console.log('채팅방 생성 응답:', response.data);

//             if (response.data.success) {
//                 const updatedRooms = await axios.get(`${API_BASE_URL}/api/my-chatrooms`, {
//                     withCredentials: true
//                 });
//                 setChatRooms(updatedRooms.data);
//                 setShowChatroomModal(false);
//                 alert(response.data.message || '채팅방이 생성되었습니다.');
//             } else {
//                 throw new Error(response.data.error || '채팅방 생성에 실패했습니다.');
//             }
//         } catch (error) {
//             console.error('채팅방 생성 실패:', error.response?.data || error);
//             alert(error.response?.data?.error || '채팅방 생성에 실패했습니다.');
//         }
//     };

//     // 채팅방 삭제/나가기
//     const handleDeleteChatRoom = async () => {
//         if (!chatName) return;
        
//         try {
//             const response = await axios.delete(`${API_BASE_URL}/api/chatrooms/${chatName}`, {
//                 withCredentials: true
//             });
            
//             // 성공 시 채팅방 목록 새로고침
//             const updatedRooms = await axios.get(`${API_BASE_URL}/api/my-chatrooms`, {
//                 withCredentials: true
//             });
//             setChatRooms(updatedRooms.data);
//             setChatName('');
            
//             // 서버 응답 메시지에 따라 다른 알림 표시
//             alert(response.data.message);
//         } catch (error) {
//             console.error('채팅방 삭제/나가기 실패:', error);
//             if (error.response?.status === 403) {
//                 alert('권한이 없습니다.');
//             } else if (error.response?.status === 404) {
//                 alert('채팅방을 찾을 수 없습니다.');
//             } else {
//                 alert('처리에 실패했습니다.');
//             }
//         }
//     };

//     // select 태그의 onChange 핸들러 수정
// const handleChatRoomChange = (e) => {
//     const newChatName = e.target.value;
//     setChatName(newChatName);
    
//     // 새로운 채팅방 선택 시 WebSocket join 메시지 전송
//     if (ws && ws.readyState === WebSocket.OPEN && newChatName) {
//         ws.send(JSON.stringify({
//             type: 'join',
//             chatroomId: newChatName
//         }));
//     }
// };
//     // Chat In/Out 핸들러 수정
//     const handleChatToggle = () => {
//         if (!chatName && !isChatting) {
//             alert('목차를 선택해주세요.');
//             return;
//         }

//         if (isChatting) {
//             // Chat Out
//             setIsChatting(false);
//             setShowChatModal(false);
//         } else {
//             // Chat In
//             setIsChatting(true);
//             setShowChatModal(true);
//         }
//     };

//     // 검색 핸들러 수정
//     const handleSearch = async () => {
//         if (!searchText.trim()) {
//             alert('검색어를 입력해주세요.');
//             return;
//         }
        
//         try {
//             const response = await axios.get(`${API_BASE_URL}/api/chatrooms/search`, {
//                 params: {
//                     keyword: searchText
//                 },
//                 withCredentials: true
//             });
            
//             console.log('검색 결과:', response.data); // 디버깅용
//             setSearchResults(response.data);
//             setShowSearchModal(true);
//         } catch (error) {
//             console.error('검색 실패:', error);
//             alert('검색에 실패했습니다.');
//         }
//     };

//     // 채팅방 입장 핸들러
//     const handleJoinChat = async (chatroomId) => {
//         try {
//             const response = await axios.post(`${API_BASE_URL}/api/chatrooms/${chatroomId}/join`, {}, {
//                 withCredentials: true
//             });
            
//             if (response.data.success) {
//                 alert('채팅방에 입장했습니다.');
//                 setShowSearchModal(false);
//                 // 채팅방 목록 새로고침
//                 const updatedRooms = await axios.get(`${API_BASE_URL}/api/my-chatrooms`, {
//                     withCredentials: true
//                 });
//                 setChatRooms(updatedRooms.data);
//             }
//         } catch (error) {
//             console.error('채팅방 입장 실패:', error);
//             alert(error.response?.data?.error || '채팅방 입장에 실패했습니다.');
//         }
//     };

//     return (
//         <div className="canvas-container">
//             <div className="chat-tools">
//                 <button 
//                     className={`chat-button ${isChatting ? 'active' : ''}`}
//                     onClick={handleChatToggle}
//                     title={isChatting ? 'Chat Out' : 'Chat In'}
//                 >
//                     <span className="button-text">{isChatting ? 'Chat Out' : 'Chat In'}</span>
//                     <span className="button-icon">{isChatting ? '⟲' : '⟳'}</span>
//                 </button>
//                 <select
//     className="chat-name"
//     value={chatName}
//     onChange={handleChatRoomChange}
//     disabled={isChatting}
//     title="Select Chat"
// >
//     <option value="">채팅방</option>
//     {chatRooms.map(room => (
//         <option key={room.chatroom_id} value={room.chatroom_id}>
//             {room.chatname}
//         </option>
//     ))}
// </select>
//                 <input
//                     type="text"
//                     className="search-field"
//                     placeholder="검색..."
//                     value={searchText}
//                     onChange={(e) => setSearchText(e.target.value)}
//                     onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
//                 />
//                 <button 
//                     className="search-button"
//                     onClick={handleSearch}
//                     title="Search"
//                 >
//                     <span className="button-text">검색</span>
//                     <span className="button-icon">🔍</span>
//                 </button>
//                 <button 
//                     className="chat-add-button"
//                     onClick={() => setShowChatroomModal(true)}
//                     title="Add Chatroom"
//                 >
//                     <span className="button-text">Add</span>
//                     <span className="button-icon">+</span>
//                 </button>
//                 <button 
//                     className="chat-delete-button"
//                     onClick={handleDeleteChatRoom}
//                     disabled={!chatName}
//                     title="Delete Chatroom"
//                 >
//                     <span className="button-text">Del</span>
//                     <span className="button-icon">-</span>
//                 </button>
//             </div>
            
//             <canvas
//                 ref={canvasRef}
//                 data-id={id}
//                 onMouseDown={startDrawing}
//                 onMouseMove={draw}
//                 onMouseUp={stopDrawing}
//                 onMouseOut={stopDrawing}
//                 onTouchStart={handleTouchStart}
//                 onTouchMove={handleTouchMove}
//                 onTouchEnd={handleTouchEnd}
//                 className="canvas"
//                 onClick={onClick}
//                 style={{ 
//                     touchAction: 'none',
//                     WebkitUserSelect: 'none',
//                     userSelect: 'none'
//                 }}
//             />
//             <ChatroomModal
//                 show={showChatroomModal}
//                 onClose={() => setShowChatroomModal(false)}
//                 onSubmit={handleAddChatRoom}
//                 initialData={{  // 초기 데이터 추가
//                     name: '',
//                     description: '',
//                     isGroup: false,
//                     password: ''
//                 }}
//             />
//             <ChatModal
//                 show={isChatting && showChatModal}
//                 chatName={chatRooms.find(room => room.chatroom_id === Number(chatName))?.chatname || ''}
//                 chatroomId={Number(chatName)}
//                 onClose={() => {
//                     setShowChatModal(false);
//                     setIsChatting(false);
//                 }}
//             />
//             <SearchResultModal
//                 show={showSearchModal}
//                 onClose={() => setShowSearchModal(false)}
//                 searchResults={searchResults}
//                 onJoinChat={handleJoinChat}
//             />
//         </div>
//     );
// }

// function Paint({ chatroomId }) {
//     const [canvases, setCanvases] = useState([{ id: 1 }]);
//     const [ws, setWs] = useState(null);
//     const [color, setColor] = useState('#000000');
//     const [brushSize, setBrushSize] = useState(5);
//     const [isEraser, setIsEraser] = useState(false);
//     const [previousColor, setPreviousColor] = useState('#000000');
//     const reconnectAttempts = useRef(0);
//     const maxReconnectAttempts = 5;
//     const reconnectTimeoutRef = useRef(null);
//     const [lastClickedCanvasId, setLastClickedCanvasId] = useState(1); // 마지막 클릭한 캔버스 ID 추적
//     const containerRef = useRef(null);
//     const [isTouchDevice, setIsTouchDevice] = useState(false);
//     const [isTwoFingerTouch, setIsTwoFingerTouch] = useState(false);
//     const [lastTouchY, setLastTouchY] = useState(0);
//     const [searchText, setSearchText] = useState('');
//     const [searchResults, setSearchResults] = useState([]);
//     const [showSearchModal, setShowSearchModal] = useState(false);

    
//     // 터치 디바이스 감지
//     useEffect(() => {
//         const isTouchCapable = (
//             'ontouchstart' in window ||
//             navigator.maxTouchPoints > 0 ||
//             navigator.msMaxTouchPoints > 0
//         );
//         setIsTouchDevice(isTouchCapable);
//     }, []);

//     // 터치 이벤트 핸들러
//     const handleContainerTouchStart = (e) => {
//         if (e.touches.length === 2) {
//             setIsTwoFingerTouch(true);
//             setLastTouchY(e.touches[0].clientY);
//             e.stopPropagation();
//             e.preventDefault();
//         }
//     };

//     const handleContainerTouchMove = (e) => {
//         if (isTwoFingerTouch && e.touches.length === 2) {
//             const currentTouchY = e.touches[0].clientY;
//             const deltaY = lastTouchY - currentTouchY;
//             const scrollSpeed = 0.03;  // 스크롤 속도를 2.5에서 0.8로 감소
            
//             const container = containerRef.current;
//             if (container) {
//                 container.scrollBy({
//                     top: deltaY * scrollSpeed,
//                     behavior: 'auto'
//                 });
//             }
            
//             setLastTouchY(currentTouchY);
//             e.stopPropagation();
//             e.preventDefault();
//         }
//     };

//     const handleContainerTouchEnd = () => {
//         setIsTwoFingerTouch(false);
//     };

//     // 터치 이벤트 리스너 등록
//     useEffect(() => {
//         const container = containerRef.current;
//         if (container && isTouchDevice) {
//             container.addEventListener('touchstart', handleContainerTouchStart, { passive: false });
//             container.addEventListener('touchmove', handleContainerTouchMove, { passive: false });
//             container.addEventListener('touchend', handleContainerTouchEnd);

//             return () => {
//                 container.removeEventListener('touchstart', handleContainerTouchStart);
//                 container.removeEventListener('touchmove', handleContainerTouchMove);
//                 container.removeEventListener('touchend', handleContainerTouchEnd);
//             };
//         }
//     }, [isTouchDevice, isTwoFingerTouch]);

//     // toggleEraser 함수
//     const toggleEraser = () => {
//         if (!isEraser) {
//             setPreviousColor(color);
//             setIsEraser(true);
//         } else {
//             setColor(previousColor);
//             setIsEraser(false);
//         }
//     };

//     // Canvas 컴포넌트에 전달할 클릭 핸들러
//     const handleCanvasClick = (id) => {
//         setLastClickedCanvasId(id);
//         // 캔버스 클릭 시 채팅방 퇴장되지 않도록 수정
//         if (chatroomId && ws && ws.readyState === WebSocket.OPEN) {
//             // 채팅방 상태 유지
//             ws.send(JSON.stringify({
//                 type: 'draw_start',
//                 chatroomId: chatroomId,
//                 canvasId: id
//             }));
//         }
//     };

//     // clearCanvas 함수 수정
//     const clearCanvas = (canvasId) => {
//         if (ws && ws.readyState === WebSocket.OPEN) {
//             const clearData = {
//                 type: 'clear',
//                 chatroomId: chatroomId,
//                 canvasId: canvasId
//             };
//             console.log('캔버스 초기화 데이터 전송:', clearData);
//             ws.send(JSON.stringify(clearData));
//         }
//     };

//     useEffect(() => {
//         console.log('Paint 컴포넌트 chatroomId:', chatroomId);  // 디버깅용 로그
        
//         const connectWebSocket = () => {
//             if (reconnectAttempts.current >= maxReconnectAttempts) {
//                 console.error('최대 재연결 시도 횟수를 초과했습니다.');
//                 return;
//             }
    
//             try {
//                 const wsUrl = process.env.NODE_ENV === 'production' 
//                     ? 'ws://183.105.171.41:8081/ws'
//                     : 'ws://localhost:8081/ws';
                    
//                 console.log('WebSocket 연결 시도:', wsUrl);
//                 const newWs = new WebSocket(wsUrl);
                
//                 newWs.onopen = () => {
//                     console.log('WebSocket 연결 성공');
//                     setWs(newWs);
//                     reconnectAttempts.current = 0;
    
//                     if (chatroomId) {
//                         console.log('채팅방 입장 시도:', chatroomId);
//                         newWs.send(JSON.stringify({
//                             type: 'join',
//                             chatroomId: parseInt(chatroomId, 10)
//                         }));
//                     }
//                 };
                
//                 newWs.onerror = (error) => {
//                     console.error('WebSocket 연결 에러:', error);
//                 };
                
//                 newWs.onmessage = async (event) => {
//                     const data = event.data;
//                     let message;
                    
//                     try {
//                         if (data instanceof Blob) {
//                             const text = await data.text();
//                             message = JSON.parse(text);
//                         } else {
//                             message = JSON.parse(data);
//                         }

//                         // 메시지 처리
//                         if (message.type === 'addCanvas') {
//                             setCanvases(prev => [...prev, { id: message.id }]);
//                         } else if (message.type === 'deleteCanvas') {
//                             setCanvases(prev => prev.filter(canvas => canvas.id !== message.id));
//                         }
//                     } catch (error) {
//                         console.error('메시지 처리 중 오류:', error);
//                     }
//                 };
                
//                 newWs.onclose = (event) => {
//                     if (event.wasClean) {
//                         console.log(`WebSocket 연결 정상 종료 (코드=${event.code})`);
//                     } else {
//                         console.log('WebSocket 연결 끊김');
//                         reconnectAttempts.current += 1;
                        
//                         if (reconnectAttempts.current < maxReconnectAttempts) {
//                             console.log(`재연결 시도 ${reconnectAttempts.current}/${maxReconnectAttempts}`);
//                             reconnectTimeoutRef.current = setTimeout(connectWebSocket, 3000);
//                         }
//                     }
//                 };
//             } catch (error) {
//                 console.error('WebSocket 연결 시도 중 오류:', error);
//                 reconnectAttempts.current += 1;
                
//                 if (reconnectAttempts.current < maxReconnectAttempts) {
//                     reconnectTimeoutRef.current = setTimeout(connectWebSocket, 3000);
//                 }
//             }
//         };

//         connectWebSocket();

//         // 클린업 함수
//         return () => {
//             if (ws) {
//                 ws.close(1000, '정상 종료');
//             }
//             if (reconnectTimeoutRef.current) {
//                 clearTimeout(reconnectTimeoutRef.current);
//             }
//         };
//     }, [chatroomId]);

//     const addCanvas = () => {
//         const newId = canvases.length > 0 ? Math.max(...canvases.map(c => c.id)) + 1 : 1;
//         setCanvases(prev => [...prev, { id: newId }]);
//         // 스크롤을 새 캔버스 위치로
//         setTimeout(() => {
//             if (containerRef.current) {
//                 containerRef.current.scrollTop = containerRef.current.scrollHeight;
//             }
//         }, 100);
//     };

//     const deleteCanvas = (id) => {
//         if (canvases.length > 1) {
//             setCanvases(prev => prev.filter(canvas => canvas.id !== id));
            
//             if (ws && ws.readyState === WebSocket.OPEN) {
//                 ws.send(JSON.stringify({
//                     type: 'deleteCanvas',
//                     id: id
//                 }));
//             }
//         }
//     };

//     const handleSearch = () => {
//         console.log('검색어:', searchText);
//     };

//     return (
//         <div className="paint-page">
//             <div 
//                 className={`paint-container ${isTouchDevice ? 'touch-device' : ''}`}
//             >
//                 <div 
//                     ref={containerRef}
//                     className="canvases-container"
//                     onTouchStart={handleContainerTouchStart}
//                     onTouchMove={handleContainerTouchMove}
//                     onTouchEnd={() => setIsTwoFingerTouch(false)}
//                     style={{ 
//                         touchAction: 'pan-y pinch-zoom',
//                         WebkitOverflowScrolling: 'touch',
//                         overflowY: 'auto',
//                         height: 'calc(100vh - 100px)',
//                         width: '100%'
//                     }}
//                 >
//                     {canvases.map(canvas => (
//                         <Canvas
//                             key={canvas.id}
//                             id={canvas.id}
//                             onDelete={deleteCanvas}
//                             ws={ws}
//                             color={color}
//                             brushSize={brushSize}
//                             isEraser={isEraser}
//                             onClear={() => clearCanvas(canvas.id)}
//                             onClick={() => handleCanvasClick(canvas.id)}
//                             chatroomId={chatroomId}
//                         />
//                     ))}
//                 </div>
//                 <div className="tools">
//                     <input 
//                         type="color" 
//                         value={color} 
//                         onChange={(e) => setColor(e.target.value)}
//                         className="color-picker"
//                         disabled={isEraser}
//                     />
//                     <input 
//                         type="range" 
//                         min="1" 
//                         max="50" 
//                         value={brushSize} 
//                         onChange={(e) => setBrushSize(e.target.value)}
//                         className="brush-size"
//                     />
//                     <button 
//                         onClick={toggleEraser} 
//                         className={`eraser-button ${isEraser ? 'active' : ''}`}
//                         title={isEraser ? '펜' : '지우개'}
//                     >
//                         {isEraser ? <BsPencilFill /> : <BsFillEraserFill />}
//                     </button>
//                     <button 
//                         onClick={clearCanvas}
//                         className="clear-button"
//                         title="모두 지우기"
//                     >
//                         <MdClear />
//                     </button>
//                     <button 
//                         onClick={() => deleteCanvas(canvases[0].id)} 
//                         className="delete-button"
//                         title="캔버스 삭제"
//                     >
//                         <MdDelete />
//                     </button>
//                     <button 
//                         onClick={addCanvas} 
//                         className="add-canvas-button"
//                         title="캔버스 추가"
//                     >
//                         <MdAddBox />
//                     </button>
//                 </div>
//             </div>
           
//         </div>
//     );
// }

// export default Canvas;
