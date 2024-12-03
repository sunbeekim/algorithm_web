// SearchResultModal.js
// src/components/SearchResultModal.js
import React from 'react';
import './SearchResultModal.css';

function SearchResultModal({ show, onClose, searchResults, onJoinChat }) {
    if (!show) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2>검색 결과</h2>
                    <button className="close-button" onClick={onClose}>×</button>
                </div>
                <div className="search-results">
                    <div className="search-result-header">
                        <span className="header-chatname">채팅방</span>
                        <span className="header-forename">만든이</span>
                        <span className="header-action"></span>
                    </div>
                    {searchResults.length > 0 ? (
                        searchResults.map(room => (
                            <div key={room.chatroom_id} className="search-result-item">
                                <span className="room-chatname">{room.chatname}</span>
                                <span className="room-forename">{room.forename}</span>
                                <button 
                                    className="join-button"
                                    onClick={() => onJoinChat(room.chatroom_id)}
                                >
                                    입장
                                </button>
                            </div>
                        ))
                    ) : (
                        <p>검색 결과가 없습니다.</p>
                    )}
                </div>
                <div className="modal-footer">
                    <button className="modal-button" onClick={onClose}>닫기</button>
                </div>
            </div>
        </div>
    );
}

export default SearchResultModal; 