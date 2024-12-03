// ChatRoom.js
// 채팅방 페이지
// src/pages/ChatRoom.js
import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Paint from './Paint';
import ChatModal from '../components/ChatModal';


function ChatRoom() {
    const { id } = useParams();
    const [showChat, setShowChat] = useState(true);
    const [chatName, setChatName] = useState('');

    useEffect(() => {
        // 채팅방 정보 가져오기
        const fetchChatRoomInfo = async () => {
            try {
                const response = await fetch(`http://183.105.171.41:8081/api/chatrooms/${id}`, {
                    credentials: 'include'
                });
                
                if (!response.ok) {
                    throw new Error('채팅방 정보를 가져오는데 실패했습니다.');
                }

                const data = await response.json();
                setChatName(data.name);
            } catch (error) {
                console.error('채팅방 정보 로드 실패:', error);
            }
        };

        fetchChatRoomInfo();
    }, [id]);

    const handleCloseChat = () => {
        setShowChat(false);
    };

    return (
        <div className="chatroom-container">
            <Paint chatroomId={parseInt(id, 10)} />
            <ChatModal 
                show={showChat} 
                chatName={chatName} 
                chatroomId={id} 
                onClose={handleCloseChat} 
            />
        </div>
    );
}

export default ChatRoom;