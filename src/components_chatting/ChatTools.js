// src/components_chatting/ChatTools.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaSearch } from 'react-icons/fa';
import ChatroomModal from './ChatroomModal';
import ChatModal from './ChatModal';
import SearchResultModal from './SearchResultModal';
import './ChatTools.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://183.105.171.41:8080';

function ChatTools({ ws, onChatToggle, onChatSelect }) {
    const [isChatting, setIsChatting] = useState(false);
    const [chatName, setChatName] = useState('');
    const [chatRooms, setChatRooms] = useState([]);
    const [showChatroomModal, setShowChatroomModal] = useState(false);
    const [showChatModal, setShowChatModal] = useState(false);
    const [searchText, setSearchText] = useState('');    
    const [searchResults, setSearchResults] = useState([]);
    const [showSearchModal, setShowSearchModal] = useState(false);

    // 채팅방 목록 조회
    useEffect(() => {
        const fetchChatRooms = async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/api/my-chatrooms`, {
                    withCredentials: true
                });
                setChatRooms(response.data);
            } catch (error) {
                console.error('채팅방 목록 조회 실패:', error);
            }
        };
        fetchChatRooms();
    }, []);

    // 채팅방 생성 핸들러
    const handleAddChatRoom = async (chatroomData) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/api/chatrooms`, {
                chatname: chatroomData.name,
                name: chatroomData.name,
                description: `${chatroomData.name}의 채팅방입니다.`,
                is_group: false,
                password: chatroomData.password || null
            }, {
                withCredentials: true,
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.data.success) {
                const updatedRooms = await axios.get(`${API_BASE_URL}/api/my-chatrooms`, {
                    withCredentials: true
                });
                setChatRooms(updatedRooms.data);
                setShowChatroomModal(false);
                alert(response.data.message || '채팅방이 생성되었습니다.');
            }
        } catch (error) {
            console.error('채팅방 생성 실패:', error);
            alert(error.response?.data?.error || '채팅방 생성에 실패했습니다.');
        }
    };

    // 채팅방 삭제/나가기
    const handleDeleteChatRoom = async () => {
        if (!chatName) return;
        
        try {
            const response = await axios.delete(`${API_BASE_URL}/api/chatrooms/${chatName}`, {
                withCredentials: true
            });
            
            const updatedRooms = await axios.get(`${API_BASE_URL}/api/my-chatrooms`, {
                withCredentials: true
            });
            setChatRooms(updatedRooms.data);
            setChatName('');
            alert(response.data.message);
        } catch (error) {
            console.error('채팅방 삭제/나가기 실패:', error);
            alert(error.response?.status === 403 ? '권한이 없습니다.' : 
                  error.response?.status === 404 ? '채팅방을 찾을 수 없습니다.' : 
                  '처리에 실패했습니다.');
        }
    };

    // 채팅방 선택 핸들러
    const handleChatRoomChange = (e) => {
        const newChatName = e.target.value;
        setChatName(newChatName);
        
        if (ws?.readyState === WebSocket.OPEN && newChatName) {
            ws.send(JSON.stringify({
                type: 'join',
                chatroomId: parseInt(newChatName, 10)
            }));
        }

        // onChatSelect가 props로 전달된 경우에만 실행
        if (onChatSelect) {
            onChatSelect(parseInt(newChatName, 10));
        }
    };

    // 채팅방 입장 핸들러
    const handleJoinChat = async (chatroomId) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/api/chatrooms/${chatroomId}/join`, {}, {
                withCredentials: true
            });
            
            if (response.data.success) {
                alert('채팅방에 입장했습니다.');
                setShowSearchModal(false);
                // 채팅방 목록 새로고침
                const updatedRooms = await axios.get(`${API_BASE_URL}/api/my-chatrooms`, {
                    withCredentials: true
                });
                setChatRooms(updatedRooms.data);
            }
        } catch (error) {
            console.error('채팅방 입장 실패:', error);
            alert(error.response?.data?.error || '채팅방 입장에 실패했습니다.');
        }
    };
    
    // Chat In/Out 핸들러
    const handleChatToggle = () => {
        if (!chatName && !isChatting) {
            alert('목차를 선택해주세요.');
            return;
        }

        setIsChatting(!isChatting);
        setShowChatModal(!isChatting);
        onChatToggle(!isChatting, parseInt(chatName, 10));
    };

    // 검색 핸들러
    const handleSearch = async () => {
        if (!searchText.trim()) {
            alert('검색어를 입력해주세요.');
            return;
        }
        
        try {
            const response = await axios.get(`${API_BASE_URL}/api/chatrooms/search`, {
                params: { keyword: searchText },
                withCredentials: true
            });
            
            setSearchResults(response.data);
            setShowSearchModal(true);
        } catch (error) {
            console.error('검색 실패:', error);
            alert('검색에 실패했습니다.');
        }
    };

    return (
        <div className="chat-tools">
            <button 
                className={`chat-button ${isChatting ? 'active' : ''}`}
                onClick={handleChatToggle}
                title={isChatting ? 'Chat Out' : 'Chat In'}
            >
                <span className="button-text">{isChatting ? 'Chat Out' : 'Chat In'}</span>
                <span className="button-icon">{isChatting ? '⟲' : '⟳'}</span>
            </button>
            <select
                className="chat-name"
                value={chatName}
                onChange={handleChatRoomChange}
                disabled={isChatting}
                title="Select Chat"
            >
                <option value="">채팅방</option>
                {chatRooms.map(room => (
                    <option key={room.chatroom_id} value={room.chatroom_id}>
                        {room.chatname}
                    </option>
                ))}
            </select>
            <input
                type="text"
                className="search-field"
                placeholder="검색..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button 
                className="search-button"
                onClick={handleSearch}
                title="Search"
            >
                <FaSearch />
            </button>
            <button 
                className="chat-add-button"
                onClick={() => setShowChatroomModal(true)}
                title="Add Chatroom"
            >
                <span className="button-text">Add</span>
                <span className="button-icon">+</span>
            </button>
            <button 
                className="chat-delete-button"
                onClick={handleDeleteChatRoom}
                disabled={!chatName}
                title="Delete Chatroom"
            >
                <span className="button-text">Del</span>
                <span className="button-icon">-</span>
            </button>

            {/* 모달 컴포넌트들 */}
            <ChatroomModal
                show={showChatroomModal}
                onClose={() => setShowChatroomModal(false)}
                onSubmit={handleAddChatRoom}
            />
            <ChatModal
                show={isChatting && showChatModal}
                chatName={chatRooms.find(room => room.chatroom_id === Number(chatName))?.chatname}
                chatroomId={Number(chatName)}
                onClose={() => {
                    setShowChatModal(false);
                    setIsChatting(false);
                }}
            />
            <SearchResultModal
                show={showSearchModal}
                onClose={() => setShowSearchModal(false)}
                searchResults={searchResults}
                onJoinChat={handleJoinChat}
            />
        </div>
    );
}

export default ChatTools;