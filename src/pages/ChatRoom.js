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
    // URL 파라미터에서 채팅방 ID 추출
    const { id } = useParams();
    const navigate = useNavigate();

    // 상태 관리
    const [chatName, setChatName] = useState('');  // 채팅방 이름
    const [showChat, setShowChat] = useState(false);  // 채팅창 표시 여부
    const [activeCanvasChatId, setActiveCanvasChatId] = useState(null);  // 현재 활성화된 캔버스 ID

    // 채팅방 ID 디버깅용 useEffect
    useEffect(() => {
        console.log('현재 채팅방 ID:', {
            rawId: id,
            parsedId: parseInt(id, 10),
            type: typeof id
        });
    }, [id]);

    // 사용자 채팅방 정보 조회 useEffect
    useEffect(() => {
        const fetchChatRoomInfo = async () => {
            if (!id) {
                console.log('채팅방 ID 없음');
                return;
            }

            console.log('채팅방 정보 가져오기 시도:', id);
            try {
                // API 호출하여 채팅방 정보 가져오기
                const response = await fetch(`http://183.105.171.41:8081/api/chatrooms/${id}`, {
                    credentials: 'include'
                });
                
                if (!response.ok) {
                    throw new Error('채팅방 정보를 가져오는데 실패했습니다.');
                }

                const data = await response.json();
                console.log('채팅방 정보:', data);
                setChatName(data.chatname);  // 채팅방 이름 설정
                setShowChat(true);  // 채팅창 표시
            } catch (error) {
                console.error('채팅방 정보 로드 실패:', error);
            }
        };

        fetchChatRoomInfo();
    }, [id]);

    // 채팅 토글 핸들러 (Chat In/Out 처리)
    const handleChatToggle = (isActive, chatId) => {
        console.log('Chat Toggle:', {
            isActive,
            chatId,
            currentId: id
        });

        // chatId가 없으면 현재 채팅방 ID 사용
        const targetChatId = chatId || parseInt(id, 10);
        
        setShowChat(isActive);  // 채팅창 표시/숨김
        setActiveCanvasChatId(isActive ? targetChatId : null);  // 캔버스 활성화/비활성화
        
        console.log('Canvas에 전달될 ID:', {
            isActive,
            targetChatId,
            activeCanvasChatId: isActive ? targetChatId : null
        });
    };

    // 채팅방 선택 핸들러
    const handleChatSelect = (newChatId) => {
        console.log('채팅방 선택:', {
            newChatId,
            currentId: id,
            activeCanvasChatId
        });
        
        navigate(`/chatroom/${newChatId}`);  // 새 채팅방으로 이동
        setShowChat(true);  // 채팅창 표시
        setActiveCanvasChatId(newChatId);  // 새 캔버스 활성화
    };

    // 상태 변경 모니터링용 useEffect
    useEffect(() => {
        console.log('ChatRoom 상태 업데이트:', {
            id,
            chatName,
            showChat,
            activeCanvasChatId
        });
    }, [id, chatName, showChat, activeCanvasChatId]);

    // 컴포넌트 렌더링
    return (
        <div className="chatroom-container">
            <div className="chatroom-content">
                {/* 캔버스 섹션 */}
                
                <div className="canvas-section">
                    {console.log('Canvas로 전달되는 activeCanvasChatId:', activeCanvasChatId)}
                    {activeCanvasChatId && (
                        <Canvas 
                            chatroomId={activeCanvasChatId}
                            key={activeCanvasChatId}
                        />
                    )}
                </div>
                
            </div>
            {/* 채팅 도구 모음 */}
            <ChatTools 
                chatroomId={parseInt(id, 10)} 
                onChatSelect={handleChatSelect}
                onChatToggle={handleChatToggle}
            />
            
        </div>
    );
}

export default ChatRoom;