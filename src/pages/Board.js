// 게시판 페이지
// src/pages/Board.js
import React, { Component} from 'react';
import './Board.css';
import WriteModal from '../components_board/WriteModal';
import PostModal from '../components_board/PostModal';
import { useAuth } from '../context/AuthContext';  // 인증 컨텍스트 추가
import Body from '../components/Body';


class Board extends Component {
  

  state = {
    posts: [],
    showWriteModal: false,
    showPostModal: false,
    selectedPost: null,
    postsPerPage: 10,
    currentPage: 1,
    loading: false,
    error: null,
    searchType: 'title',  // 검색 타입 (제목, 내용, 작성자)
    searchKeyword: '',    // 검색어
    isEditing: false,  // 수정 모드 여부
  }

// ============================================================
  test = async () => {
    try {
      const response = await fetch('http://183.105.171.41:8080/api/test/get', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include'
      });
      console.log('test');
    } catch (error) {
      console.error('test 에러:', error);
    }
  }
// ============================================================

  componentDidMount() {// 컴포넌트 마운트 시 한 번만 실행
    this.fetchPosts();    
    console.log('Auth props:', this.props.auth);
  }

  // 게시글 목록 조회
  fetchPosts = async () => {
    this.setState({ loading: true });
    try {
      console.log('게시글 목록 요청 시작');
      const response = await fetch('http://183.105.171.41:8080/api/posts', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include'  // 쿠키를 포함하여 요청
      });
      
      console.log('서버 응답:', response.status, response.statusText);
      
      if (!response.ok) {
        throw new Error(`서버 응답 오류: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('받은 데이터:', data);
      
      this.setState({ 
        posts: Array.isArray(data) ? data : [],
        loading: false,
        error: null  // 성공 시 에러 상태 초기화
      });
    } catch (error) {
      console.error('게시글 조회 중 오류 발생:', error);
      this.setState({ 
        error: '게시글을 불러오는데 실패했습니다.', 
        loading: false,
        posts: []
      });
    }
  }

  // 게시글 작성
  handleAddPost = async (newPost) => {
    try {
      const response = await fetch('http://183.105.171.41:8080/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',  // 쿠키를 포함하여 요청
        body: JSON.stringify({
          title: newPost.title,
          content: newPost.content,
          author: '작성자',
          category: newPost.category
        })
      });

      if (!response.ok) {
        throw new Error(`서버 응답 오류: ${response.status}`);
      }

      const result = await response.json();
      console.log('게시글 작성 결과:', result);

      this.fetchPosts();
      this.setState({ showWriteModal: false });
    } catch (error) {
      console.error('게시글 작성 중 오류 발생:', error);
      alert('게시글 작성에 실패했습니다.');
    }
  }
  
  // 게시글 상세 조회
  handlePostClick = async (post) => {
    try {
        // post.id가 undefined가 아닌지 확인
        if (!post.post_id) {  // post_id로 수정
            throw new Error('게시글 ID가 없습니다.');
        }

        // 조회수 증가
        const viewResponse = await fetch(`http://183.105.171.41:8080/api/posts/${post.post_id}/views`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            credentials: 'include'
        });

        if (!viewResponse.ok) {
            throw new Error(`조회수 증가 실패: ${viewResponse.status}`);
        }

        // 게시글 상세 정보 조회
        const postResponse = await fetch(`http://183.105.171.41:8080/api/posts/${post.post_id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            credentials: 'include'
        });

        if (!postResponse.ok) {
            throw new Error(`게시글 조회 실패: ${postResponse.status}`);
        }

        const postData = await postResponse.json();
        console.log('게시글 상세 데이터:', postData);
        
        if (!postData) {
            throw new Error('게시글 데이터가 없습니다.');
        }

        this.setState({
            selectedPost: postData,
            showPostModal: true,
            error: null
        });
    } catch (error) {
        console.error('게시글 조회 중 오류 발생:', error);
        alert(error.message);
    }
  }

  // 페이지당 게시글 수 변경 핸들러
  handlePostsPerPageChange = (e) => {
    this.setState({
      postsPerPage: parseInt(e.target.value),
      currentPage: 1  // 페이지 수가 변경되면 첫 페이지로 이동
    });
  }

  // 페이지 변경 핸들러
  handlePageChange = (pageNumber) => {
    this.setState({
      currentPage: pageNumber
    });
  }

  // 현재 페이지의 게시글만 반환하는 함수
  getCurrentPosts = () => {
    const { posts, currentPage, postsPerPage } = this.state;
    
    // posts가 배열이 아니면 빈 배열 반환
    if (!Array.isArray(posts)) {
      console.error('posts is not an array:', posts);
      return [];
    }

    const indexOfLastPost = currentPage * postsPerPage;
    const indexOfFirstPost = indexOfLastPost - postsPerPage;
    return posts.slice(indexOfFirstPost, indexOfLastPost);
  }

  // 전체 페이지 수 계산
  getTotalPages = () => {
    return Math.ceil(this.state.posts.length / this.state.postsPerPage);
  }

  // 글쓰기 모달 토글 함수 추가
  toggleWriteModal = () => {
    this.setState(prevState => ({
      showWriteModal: !prevState.showWriteModal
    }));
  }

  // 게시글 상세보기 모달 닫기 함수 추가
  closePostModal = () => {
    this.setState({
      showPostModal: false,
      selectedPost: null
    });
  }

  // 검색 타입 변경 핸들러
  handleSearchTypeChange = (e) => {
    this.setState({ searchType: e.target.value });
  }

  // 검색어 입력 핸들러
  handleSearchKeywordChange = (e) => {
    this.setState({ searchKeyword: e.target.value });
  }

  // 검색 실행 핸들러
  handleSearch = async () => {
    const { searchType, searchKeyword } = this.state;
    //검색버튼을 누르면 State에 있는 searchType과 searchKeyword를 쿼리에 포함하여 req 요청을 보냄
    this.setState({ loading: true });

    try {
        // 검색 요청 URL 생성
        const url = `http://183.105.171.41:8080/api/search?type=${searchType}&keyword=${encodeURIComponent(searchKeyword)}`;
        console.log('검색 요청 URL:', url);

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            credentials: 'include'  // 쿠키를 포함하여 요청
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('검색 결과:', data);

        this.setState({
            posts: Array.isArray(data) ? data : [],
            currentPage: 1,
            loading: false
        });

        if (Array.isArray(data) && data.length === 0) {
            alert('검색 결과가 없습니다.');
        }

    } catch (error) {
        console.error('검색 중 오류 발생:', error);
        this.setState({
            loading: false,
            error: '검색 중 오류가 발생했습니다.',
            posts: []
        });
        alert('검색 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  }

  // 검색 초기화
  handleResetSearch = () => {
    this.setState({
        searchType: 'title',
        searchKeyword: '',
        currentPage: 1
    }, () => {
        this.fetchPosts();  // 전체 게시글 다시 불러오기
    });
  }

  // Enter 키 입력 시 검색 실행
  handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      this.handleSearch();
    }
  }

  // 게시글 수정
  handleEditPost = async (postId, editedPost) => {
    try {
        console.log('수정 시도:', { 
            postId, 
            editedPost,
            currentUser: this.props.auth.state.user  // 현재 사용자 정보 추가
        });

        const response = await fetch(`http://183.105.171.41:8080/api/posts/${postId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                title: editedPost.title,
                content: editedPost.content,
                category: editedPost.category || 'general',
                author: editedPost.author  // 작성자 정보 추가
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('서버 응답:', errorData);  // 서버 에러 메시지 출력
            throw new Error(errorData.error || '게시글 수정에 실패했습니다.');
        }

        await this.fetchPosts();
        this.setState({ 
            showPostModal: false,
            selectedPost: null,
            isEditing: false
        });
        alert('게시글이 수정되었습니다.');
    } catch (error) {
        console.error('수정 오류:', error);  // 디버깅용 로그 추가
        alert(error.message);
    }
  }

  // 게시글 삭제
  handleDeletePost = async () => {
    if (!window.confirm('정말로 이 게시글을 삭제하시겠습니까?')) {
        return;
    }

    try {
        // 현재 로그인한 사용자와 게시글 작성자가 같은지 확인
        const currentUser = this.props.auth.state.user;
        const post = this.state.selectedPost;

        console.log('삭제 요청:', {
            postId: post.post_id,
            postAuthor: post.author,
            currentUser: currentUser.username  // username으로 비교
        });

        // 작성자 이름으로 비교
        if (post.author !== currentUser.username) {
            throw new Error('자신이 작성한 게시글만 삭제할 수 있습니다.');
        }

        const response = await fetch(`http://183.105.171.41:8080/api/posts/${post.post_id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            credentials: 'include'
        });

        if (!response.ok) {
            if (response.status === 403) {
                throw new Error('삭제 권한이 없습니다.');
            }
            const error = await response.json();
            throw new Error(error.message || '게시글 삭제에 실패했습니다.');
        }

        await this.fetchPosts();
        this.setState({ 
            showPostModal: false,
            selectedPost: null
        });
        alert('게시글이 삭제되었습니다.');
    } catch (error) {
        alert(error.message);
    }
  }

  renderPageNumbers = () => {
    const totalPages = this.getTotalPages();
    const currentPage = this.state.currentPage;
    
    // 한 번에 보여줄 페이지 버튼 수
    const pageButtonLimit = 10;
    
    // 현재 페이지를 중심으로 시작과 끝 페이지 계산
    let startPage = Math.max(1, Math.floor((currentPage - 1) / pageButtonLimit) * pageButtonLimit + 1);
    let endPage = Math.min(totalPages, startPage + pageButtonLimit - 1);

    return (
      <div className="pagination">
        {/* 이전 페이지 그룹으로 이동 */}
        <button 
          className="page-control"
          onClick={() => this.handlePageChange(Math.max(1, startPage - pageButtonLimit))}
          disabled={startPage === 1}
        >
          &lt;&lt;
        </button>
        
        {/* 이전 페이지 */}
        <button 
          className="page-control"
          onClick={() => this.handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          &lt;
        </button>

        {/* 페이지 번호들 */}
        {Array.from(
          { length: endPage - startPage + 1 }, 
          (_, i) => startPage + i
        ).map(page => (
          <button
            key={page}
            onClick={() => this.handlePageChange(page)}
            className={currentPage === page ? 'active' : ''}
          >
            {page}
          </button>
        ))}

        {/* 다음 페이지 */}
        <button 
          className="page-control"
          onClick={() => this.handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          &gt;
        </button>

        {/* 다음 페이지 그룹으로 이동 */}
        <button 
          className="page-control"
          onClick={() => this.handlePageChange(Math.min(totalPages, startPage + pageButtonLimit))}
          disabled={endPage === totalPages}
        >
          &gt;&gt;
        </button>
      </div>
    );
  }

  render() {
    const { loading, error, showWriteModal, showPostModal, selectedPost } = this.state;
    const currentPosts = this.getCurrentPosts();
    const { auth } = this.props;

    return (
      
        <div className="board-container">
          <div className="board-wrapper">
            <h1 className="board-title">게시판</h1>
            
            {/* 검색 영역 */}
            <div className="search-container">
              <select 
                value={this.state.searchType} 
                onChange={this.handleSearchTypeChange}
              >
                <option value="title">제목</option>
                <option value="content">내용</option>
                <option value="author">작성자</option>
              </select>
              <input 
                type="text" 
                value={this.state.searchKeyword}
                onChange={this.handleSearchKeywordChange}
                onKeyDown={(e) => e.key === 'Enter' && this.handleSearch()}
                placeholder="검색어를 입력하세요"
              />
              <button onClick={this.handleSearch}>검색</button>
              <button onClick={this.handleResetSearch}>초기화</button>
            </div>

            {/* 게시글 목록 */}
            <div className="board-content">
              <table className="board-table">
                <thead>
                  <tr>
                    <th>번호</th>
                    <th>제목</th>
                    <th>작성자</th>
                    <th>작성일</th>
                    <th>조회수</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="loading-message">
                        게시글을 불러오는 중입니다...
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan="5" className="error-message">
                        {error}
                        <button onClick={this.fetchPosts} className="retry-button">
                          다시 시도
                        </button>
                      </td>
                    </tr>
                  ) : currentPosts.length > 0 ? (
                    currentPosts.map(post => (
                      <tr key={post.post_id} onClick={() => this.handlePostClick(post)}>
                        <td>{post.post_id}</td>
                        <td>{post.title}</td>
                        <td>{post.author}</td>
                        <td>{new Date(post.created_at).toLocaleDateString()}</td>
                        <td>{post.views}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="no-posts-message">
                        게시글이 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* 페이지네이션 */}
              {!loading && !error && (
                <div className="pagination-container">
                  {this.renderPageNumbers()}
                </div>
              )}
            </div>

            {/* 글쓰기 버튼 - auth.state 사용 */}
            {auth.state.isAuthenticated && (
              <div className="write-button-container">
                <button onClick={this.toggleWriteModal}>글쓰기</button>
              </div>
            )}
          </div>

          {/* 모달 */}
          {showWriteModal && auth.state.isAuthenticated && (
            <WriteModal 
              show={showWriteModal}
              onClose={this.toggleWriteModal}
              onSubmit={this.handleAddPost}
            />
          )}
          {showPostModal && selectedPost && (
            <PostModal 
              show={showPostModal}
              post={selectedPost}
              onClose={this.closePostModal}
              onEdit={this.handleEditPost}
              onDelete={this.handleDeletePost}
              isAuthenticated={auth.state.isAuthenticated}
              currentUser={auth.state.user}
            />
          )}
        </div>
      
    );
  }
}


// HOC를 사용하여 인증 컨텍스트 주입
export default function BoardWithAuth(props) {
  const auth = useAuth();
  return <Board {...props} auth={auth} />;
}
