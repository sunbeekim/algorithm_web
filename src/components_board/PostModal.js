// 게시물 모달 컴포넌트
// src/components_board/PostModal.js
import React, { useState, useEffect } from 'react';
import './PostModal.css';

function PostModal({ post, onClose, onEdit, onDelete, isAuthenticated, currentUser }) {
    const [isEditing, setIsEditing] = useState(false);
    const [editedPost, setEditedPost] = useState({ 
        ...post,  // 모든 속성을 복사
        post_id: post.post_id  // post_id 명시적으로 포함
    });

    // 디버깅을 위한 콘솔 로그 수정
    useEffect(() => {
        console.log('Auth Status:', {
            isAuthenticated,
            currentUser,
            postAuthor: post.author,
            canModify: isAuthenticated && currentUser?.username && post.author === currentUser.username
        });
    }, [isAuthenticated, currentUser, post.author]);

    // canModify 조건 수정
    const canModify = isAuthenticated && currentUser?.username && post.author === currentUser.username;

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('수정 요청:', editedPost);  // 디버깅용 로그 추가
        onEdit(post.post_id, editedPost);
        setIsEditing(false);
    };

    return (
        <div className="post-modal-overlay" onClick={onClose}>
            <div className="post-modal-content" onClick={e => e.stopPropagation()}>
                <div className="post-modal-header">
                    <h2>{isEditing ? "게시글 수정" : post.title}</h2>
                    <div className="post-modal-controls">
                        {canModify && !isEditing && (
                            <div className="post-actions">
                                <button className="edit-btn" onClick={() => setIsEditing(true)}>수정</button>
                                <button className="delete-btn" onClick={() => onDelete()}>삭제</button>
                            </div>
                        )}
                        <button className="close-btn" onClick={onClose}>&times;</button>
                    </div>
                </div>

                {isEditing ? (
                    <form onSubmit={handleSubmit} className="edit-form">
                        <div className="input-group">
                            <input
                                type="text"
                                value={editedPost.title}
                                onChange={e => setEditedPost({...editedPost, title: e.target.value})}
                                placeholder="제목"
                            />
                        </div>
                        <div className="input-group">
                            <textarea
                                value={editedPost.content}
                                onChange={e => setEditedPost({...editedPost, content: e.target.value})}
                                placeholder="내용"
                            />
                        </div>
                        <div className="button-group">
                            <button type="submit" className="save-btn">저장</button>
                            <button type="button" className="cancel-btn" onClick={() => setIsEditing(false)}>취소</button>
                        </div>
                    </form>
                ) : (
                    <div className="post-content">
                        <p>{post.content}</p>
                        <div className="post-info">
                            <span>작성자: {post.author}</span>
                            <span>작성일: {new Date(post.created_at).toLocaleDateString()}</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default PostModal;
