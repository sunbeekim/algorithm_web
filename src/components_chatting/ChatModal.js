// ChatModal.js
// src/components/ChatModal.js
import React, { useState, useRef, useEffect } from 'react';
import './ChatModal.css';
import { useAuth } from '../context/AuthContext';

function ChatModal({ show, chatName, chatroomId, onClose }) {
    const { state: { user } } = useAuth();
    const [message, setMessage] = useState('');
    const [chatHistory, setChatHistory] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const ws = useRef(null);
    const chatContainerRef = useRef(null);
    const reconnectAttempts = useRef(0);
    const maxReconnectAttempts = 5;
    const reconnectTimeoutRef = useRef(null);

    useEffect(() => {
        const connectWebSocket = () => {
            if (reconnectAttempts.current >= maxReconnectAttempts) {
                console.error('최대 재연결 시도 횟수를 초과했습니다.');
                return;
            }

            try {
                const newWs = new WebSocket('ws://183.105.171.41:8081/ws');
                
                newWs.onopen = () => {
                    console.log('WebSocket 연결 성공');
                    ws.current = newWs;
                    setIsConnected(true);
                    reconnectAttempts.current = 0;

                    // 채팅방 입장 메시지 전송
                    if (chatroomId) {
                        newWs.send(JSON.stringify({
                            type: 'join',
                            chatroomId: chatroomId
                        }));
                        // 이전 메시지 로드
                        fetchChatHistory();
                    }
                };
                
                newWs.onerror = (error) => {
                    console.error('WebSocket 연결 에러:', error);
                    setIsConnected(false);
                };
                
                newWs.onmessage = async (event) => {
                    try {
                        const data = event.data;
                        let message;
                        
                        if (data instanceof Blob) {
                            const text = await data.text();
                            message = JSON.parse(text);
                        } else {
                            message = JSON.parse(data);
                        }

                        if (message.type === 'message') {
                            setChatHistory(prev => [...prev, {
                                id: message.data.message_id,
                                text: message.data.content,
                                sender: message.data.sender_id === user.userId ? 'me' : 'other',
                                timestamp: new Date(message.data.sent_at).toLocaleTimeString(),
                                username: message.data.username,
                                forename: message.data.forename
                            }]);
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
                        setIsConnected(false);
                        reconnectAttempts.current += 1;
                        
                        if (reconnectAttempts.current < maxReconnectAttempts) {
                            console.log(`재연결 시도 ${reconnectAttempts.current}/${maxReconnectAttempts}`);
                            reconnectTimeoutRef.current = setTimeout(connectWebSocket, 3000);
                        }
                    }
                };
            } catch (error) {
                console.error('WebSocket 연결 시도 중 오류:', error);
                setIsConnected(false);
                reconnectAttempts.current += 1;
                
                if (reconnectAttempts.current < maxReconnectAttempts) {
                    reconnectTimeoutRef.current = setTimeout(connectWebSocket, 3000);
                }
            }
        };

        if (show) {
            connectWebSocket();
        }

        return () => {
            if (ws.current) {
                ws.current.close();
                ws.current = null;
            }
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
        };
    }, [show, chatroomId]);

    // 채팅 내역이 업데이트될 때마다 스크롤을 맨 아래로
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [chatHistory]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!message.trim()) return;

        try {
            const response = await fetch('http://183.105.171.41:8081/api/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    chatroom_id: chatroomId,
                    content: message,
                    message_type: 'text'
                })
            });

            if (!response.ok) {
                throw new Error('메시지 전송에 실패했습니다.');
            }

            setMessage('');
        } catch (error) {
            console.error('메시지 전송 실패:', error);
        }
    };

    // 이전 메시지 로드 함수
    const fetchChatHistory = async () => {
        try {
            const response = await fetch(`http://183.105.171.41:8081/api/chatrooms/${chatroomId}/messages`, {
                credentials: 'include'
            });
            
            if (!response.ok) {
                throw new Error('채팅 내역을 불러오는데 실패했습니다.');
            }

            const data = await response.json();
            
            const formattedMessages = data.messages.map(msg => ({
                id: msg.message_id,
                text: msg.content,
                sender: msg.sender_id === user.userId ? 'me' : 'other',
                timestamp: new Date(msg.sent_at).toLocaleTimeString(),
                username: msg.username,
                forename: msg.forename
            }));

            setChatHistory(formattedMessages);
            
            // 메시지 읽음 처리
            await fetch(`http://183.105.171.41:8081/api/messages/read`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    chatroomId: chatroomId
                })
            });
        } catch (error) {
            console.error('채팅 내역 로드 실패:', error);
        }
    };

    // 디버깅용 로그 추가
    useEffect(() => {
        console.log('ChatModal props:', { show, chatName, chatroomId });
    }, [show, chatName, chatroomId]);

    // 조건부 렌더링 전에 로그 추가
    if (!show || !chatroomId) {
        console.log('ChatModal not showing because:', { 
            show, 
            chatroomId,
            showIsFalsy: !show,
            chatroomIdIsFalsy: !chatroomId 
        });
        return null;
    }

    return (
        <div className="chat-modal">
            <div className="chat-header">
                <h3>{chatName}</h3>
                <button onClick={onClose} className="close-button">×</button>
            </div>
            <div className="chat-history" ref={chatContainerRef}>
                {chatHistory.map(msg => (
                    <div 
                        key={msg.id} 
                        className={`chat-message ${msg.sender === 'me' ? 'sent' : 'received'}`}
                    >
                        {msg.sender !== 'me' && (
                            <div className="message-sender">{msg.forename}</div>
                        )}
                        <div className="message-content">{msg.text}</div>
                        <div className="message-timestamp">{msg.timestamp}</div>
                    </div>
                ))}
            </div>
            <form onSubmit={handleSubmit} className="chat-input-form">
                <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="메시지를 입력하세요..."
                />
                <button type="submit">전송</button>
            </form>
        </div>
    );
}

export default ChatModal; 