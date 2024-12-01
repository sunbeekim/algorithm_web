// 글쓰기 모달 컴포넌트
// src/components_board/WriteModal.js
import React, { Component } from 'react';
import './WriteModal.css';

class WriteModal extends Component {
  state = {
    title: '',
    content: '',
    category: '',
    file: null
  }

  handleSubmit = (e) => {
    e.preventDefault();
    
    // 입력값 검증
    if (!this.state.title.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }
    if (!this.state.content.trim()) {
      alert('내용을 입력해주세요.');
      return;
    }
    if (!this.state.category) {
      alert('카테고리를 선택해주세요.');
      return;
    }

    // 부모 컴포넌트로 데이터 전달
    this.props.onSubmit({
      title: this.state.title,
      content: this.state.content,
      category: this.state.category,
      file: this.state.file
    });

    // 입력 필드 초기화
    this.setState({
      title: '',
      content: '',
      category: '',
      file: null
    });
  }

  render() {
    if (!this.props.show) {
      return null;
    }

    return (
      <div className="write-modal-overlay" onClick={this.props.onClose}>
        <div className="write-modal-content" onClick={e => e.stopPropagation()}>
          <div className="write-modal-header">
            <h2>글쓰기</h2>
            <button className="close-button" onClick={this.props.onClose}>&times;</button>
          </div>

          <form onSubmit={this.handleSubmit}>
            <div className="write-modal-body">
              <div className="input-group">
                <select 
                  className="category-select"
                  value={this.state.category}
                  onChange={e => this.setState({category: e.target.value})}
                  required
                >
                  <option value="">카테고리 선택</option>
                  <option value="notice">공지사항</option>
                  <option value="general">일반</option>
                  <option value="question">질문</option>
                </select>
              </div>

              <div className="input-group">
                <input 
                  type="text" 
                  placeholder="제목을 입력하세요" 
                  value={this.state.title}
                  onChange={e => this.setState({title: e.target.value})}
                  required
                />
              </div>

              <div className="input-group">
                <textarea 
                  placeholder="내용을 입력하세요" 
                  value={this.state.content}
                  onChange={e => this.setState({content: e.target.value})}
                  required
                />
              </div>

              <div className="file-upload">
                <label className="file-label">
                  <input 
                    type="file" 
                    onChange={e => this.setState({file: e.target.files[0]})}
                    multiple
                  />
                  <span>파일 첨부</span>
                </label>
                {this.state.file && <span className="file-name">{this.state.file.name}</span>}
              </div>
            </div>

            <div className="write-modal-footer">
              <button type="button" className="cancel-btn" onClick={this.props.onClose}>취소</button>
              <button type="submit" className="submit-btn">등록</button>
            </div>
          </form>
        </div>
      </div>
    );
  }
}

export default WriteModal;
