// ChatroomModal.js
// src/components/ChatroomModal.js
import React, { useState } from 'react';
import './ChatroomModal.css';

function ChatroomModal({ show, onClose, onSubmit }) {
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({ name, password });
        setName('');
        setPassword('');
    };

    if (!show) return null;

    return (
        <div className="modal-overlay">
            <div className="chatroom-modal">
                <h2>Create Chatroom</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Chatroom Name:</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Password:</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <div className="button-group">
                        <button type="submit">생성</button>
                        <button type="button" onClick={onClose}>취소</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ChatroomModal; 