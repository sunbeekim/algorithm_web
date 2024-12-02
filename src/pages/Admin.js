import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Admin.css';

const API_BASE_URL = 'http://183.105.171.41:8080';

const Admin = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/admin/users`, {
        withCredentials: true
      });
      setUsers(response.data);
      setLoading(false);
    } catch (error) {
      setError('사용자 목록을 불러오는데 실패했습니다.');
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRoleId) => {
    try {
      await axios.put(`${API_BASE_URL}/api/admin/users/${userId}/role`, {
        roleId: newRoleId
      }, {
        withCredentials: true
      });
      fetchUsers();  // 목록 새로고침
    } catch (error) {
      alert('권한 변경에 실패했습니다.');
    }
  };

  const handleStatusChange = async (userId) => {
    try {
      const user = users.find(u => u.user_id === userId);
      const newStatus = user.status === 'active' ? 'inactive' : 'active';
      
      await axios.put(`${API_BASE_URL}/api/admin/users/${userId}/status`, {
        status: newStatus
      }, {
        withCredentials: true
      });
      fetchUsers();  // 목록 새로고침
    } catch (error) {
      alert('상태 변경에 실패했습니다.');
    }
  };

  if (loading) return <div>로딩 중...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="admin-container">
      <h2>사용자 관리</h2>
      <table className="users-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>사용자명</th>
            <th>이메일</th>
            <th>권한</th>
            <th>상태</th>
            <th>가입일</th>
            <th>권한 변경</th>
            <th>상태 변경</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.user_id}>
              <td>{user.user_id}</td>
              <td>{user.username}</td>
              <td>{user.email}</td>
              <td>{user.role_name}</td>
              <td>{user.status}</td>
              <td>{new Date(user.created_at).toLocaleDateString()}</td>
              <td>
                <select
                  value={user.role_id}
                  onChange={(e) => handleRoleChange(user.user_id, e.target.value)}
                >
                  <option value="1">관리자</option>
                  <option value="2">일반 사용자</option>
                </select>
                <button onClick={() => handleRoleChange(user.user_id, user.role_id === 1 ? 2 : 1)}>
                  {user.role_id === 1 ? '일반 사용자로 변경' : '관리자로 변경'}
                </button>
              </td>
              <td>
                <button onClick={() => handleStatusChange(user.user_id)}>
                  {user.status === 'active' ? '비활성화' : '활성화'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Admin; 