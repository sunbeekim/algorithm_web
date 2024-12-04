// ChatRoom.js
// 채팅방 페이지
// src/pages/ChatRoom.js
import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Canvas from '../components_canvas/Canvas';
import ChatModal from '../components_chatting/ChatModal';
import './ChatRoom.css';
import ChatTools from '../components_chatting/ChatTools';

function ChatRoom() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [chatName, setChatName] = useState('');
    const [showChat, setShowChat] = useState(false);
    const [activeCanvasChatId, setActiveCanvasChatId] = useState(null);

    // id 값 디버깅
    useEffect(() => {
        console.log('현재 채팅방 ID:', {
            rawId: id,
            parsedId: parseInt(id, 10),
            type: typeof id
        });
    }, [id]);

    // 채팅방 정보 가져오기
    useEffect(() => {
        const fetchChatRoomInfo = async () => {
            if (!id) {
                console.log('채팅방 ID 없음');
                return;
            }

            console.log('채팅방 정보 가져오기 시도:', id);
            try {
                const response = await fetch(`http://183.105.171.41:8081/api/chatrooms/${id}`, {
                    credentials: 'include'
                });
                
                if (!response.ok) {
                    throw new Error('채팅방 정보를 가져오는데 실패했습니다.');
                }

                const data = await response.json();
                console.log('채팅방 정보:', data);
                setChatName(data.chatname);
                setShowChat(true);
            } catch (error) {
                console.error('채팅방 정보 로드 실패:', error);
            }
        };

        fetchChatRoomInfo();
    }, [id]);

    // Chat In/Out 토글 핸들러 수정
    const handleChatToggle = (isActive, chatId) => {
        console.log('Chat Toggle:', {
            isActive,
            chatId,
            currentId: id
        });

        // chatId가 없을 경우 현재 채팅방 ID 사용
        const targetChatId = chatId || parseInt(id, 10);
        
        setShowChat(isActive);
        setActiveCanvasChatId(isActive ? targetChatId : null);
        
        console.log('Canvas에 전달될 ID:', {
            isActive,
            targetChatId,
            activeCanvasChatId: isActive ? targetChatId : null
        });
    };

    // 채팅방 선택 핸들러 수정
    const handleChatSelect = (newChatId) => {
        console.log('채팅방 선택:', {
            newChatId,
            currentId: id,
            activeCanvasChatId
        });
        
        navigate(`/chatroom/${newChatId}`);
        setShowChat(true);
        setActiveCanvasChatId(newChatId);
    };

    // 상태 변경 모니터링
    useEffect(() => {
        console.log('ChatRoom 상태 업데이트:', {
            id,
            chatName,
            showChat,
            activeCanvasChatId
        });
    }, [id, chatName, showChat, activeCanvasChatId]);

    return (
        <div className="chatroom-container">
            <ChatTools 
                chatroomId={parseInt(id, 10)} 
                onChatSelect={handleChatSelect}
                onChatToggle={handleChatToggle}
            />
            <div className="chatroom-content">
                <div className="canvas-section">
                    {console.log('Canvas로 전달되는 activeCanvasChatId:', activeCanvasChatId)}
                    {activeCanvasChatId && (
                        <Canvas 
                            chatroomId={activeCanvasChatId}
                            key={activeCanvasChatId}
                        />
                    )}
                </div>
                
                <ChatModal 
                    show={showChat}
                    chatName={chatName}
                    chatroomId={parseInt(id, 10)}
                    onClose={() => {
                        console.log('ChatModal 닫기');
                        setShowChat(false);
                        setActiveCanvasChatId(null);
                    }}
                />
            </div>
        </div>
    );
}

export default ChatRoom;