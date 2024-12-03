// 메인 서버
// algorithm_ai/mainServer.js

// 모듈 선언
const express = require('express');
// Express 모듈
const cors = require('cors');
// CORS 모듈
const mysql = require('mysql2');
// MySQL 모듈
const cookieParser = require('cookie-parser');
// 쿠키 파서 모듈
const jwt = require('jsonwebtoken');
// JWT 모듈
const WebSocket = require('ws');
const http = require('http');
// WebSocket 모듈
const crypto = require('crypto');
// 암호화 모듈
const session = require('express-session');  // express-session 추가
const axios = require('axios');  // axios 추가
// require() 모듈 불러오기

// Express 인스턴스 생성
const app = express();

const server = http.createServer(app);
// JWT 시크릿 키(인증키)
const JWT_SECRET = 'your-secret-key';

// CORS 설정을 더 상세하게 지정
const corsOptions = {
    origin: ['http://183.105.171.41:3000', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    credentials: true,
    maxAge: 86400 // CORS 프리플라이트 요청 캐시 시간 (24시간)
};

// CORS 미들웨어 적용
app.use(cors(corsOptions));

// 모든 라우트에 대해 CORS 헤더 추가
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'http://183.105.171.41:3000');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    // OPTIONS 요청에 대한 처리
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    next();
});

// express.json() 미들웨어는 CORS 설정 후에 적용
app.use(express.json());

// 쿠키 파서(자료구조 빌드 및 문법검사) 미들웨어 추가
app.use(cookieParser());

// Express 세션 미들웨어 설정
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    name: 'sessionId',  // 세션 쿠키 이름
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000, // 24시간
        sameSite: 'strict'
    },
    store: new session.MemoryStore()  // 메모리에 세션 저장
}));

// 토큰 검증 미들웨어
const verifyToken = (req, res, next) => { // 미들웨어 추가
    const token = req.cookies.token; // 쿠키에서 토큰 추출
    
    if (!token) { // 토큰이 없는 경우
        return res.status(401).json({ // 401 상태 코드와 함께 JSON 응답
            isAuthenticated: false, // 인증 여부
            message: '인증이 필요합니다.' // 인증 필요 메시지
        });
    }
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        // 토큰에서 추출한 정보를 req.user에 저장
        req.user = {
            userId: decoded.userId,
            username: decoded.username ,
            forename: decoded.forename         
        };
        next();
    } catch (err) {
        return res.status(401).json({ // 401 상태 코드와 함께 JSON 응답
            isAuthenticated: false, // 인증 여부
            message: '유효하지 않은 토큰입니다.' // 유효하지 않은 토큰 메시지
        });
    }
};

// MySQL 연결 설정
const db = mysql.createConnection({
    host: 'db-2vusd7-kr.vpc-pub-cdb.ntruss.com', // 데이터베이스 호스트
    port: 3306, // 데이터베이스 포트
    user: 'aluser1', // 데이터베이스 사용자
    password: 'alpassword2450!', // 데이터베이스 비밀번호
    database: 'basicdb' // 이베이스 이름
});

// 데이터베이스 연결
db.connect((err) => {
    if (err) {
        console.error('데이터베이스 연결 실패:', err);
        return;
    }
    console.log('데이터베이스 연결 성공');
});

// 세션 생성 및 로그인 기록 함수
const createSessionAndRecordLogin = async (userId, token, ipAddress, userAgent, req) => {
    console.log('세션 생성 시도:', { userId, tokenLength: token?.length });

    // DB에 세션 기록
    const sessionId = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 1);

    const sessionQuery = `
        INSERT INTO sessions 
        (session_id, user_id, token, ip_address, user_agent, is_valid, expires_at) 
        VALUES (?, ?, ?, ?, ?, 1, ?)`;

    const sessionParams = [
        sessionId, // 세션 ID
        userId, // 사용자 ID     
        token, // 토큰
        ipAddress, // 클라이언트 IP 주소
        userAgent, // 클라이언트 사용자 에이전트
        expiresAt.toISOString().slice(0, 19).replace('T', ' ') // 만료 시간
    ];

    console.log('세션 쿼리 파라미터:', sessionParams);

    db.query(sessionQuery, sessionParams, (err) => {
        if (err) {
            console.error('세션 생성 실패:', err);
            return;
        }

        console.log('세션 생성 성공. 로그인 기록 시도...');

        const loginHistoryQuery = `
            INSERT INTO login_history 
            (user_id, session_id, ip_address, login_status) 
            VALUES (?, ?, ?, 'success')
        `; // 로그인 기록 쿼리

        db.query(
            loginHistoryQuery, // 로그인 기록 쿼리
            [userId, sessionId, ipAddress], // 쿼리 파라미터
            (err) => {
                if (err) {
                    console.error('로그인 기록 저장 실패:', err);
                    return;
                }
                console.log('로그인 기록 저장 성공');
            }
        );
    });

    // Express 세션에 사용자 정보 저장 (req가 있을 때만)
    if (req && req.session) {
        req.session.user = {
            id: userId,
            sessionId: sessionId
        };
    }
    
    return sessionId;
};
// 세션 확인용 테스트 엔드포인트
app.get('/api/check-session', verifyToken, (req, res) => {
    res.json({
        session: req.session,
        user: req.user,
        token: req.cookies.token
    });
});

// 인증 체크 엔드포인트
app.get('/api/check-auth', (req, res) => { // 엔드포인트 추가
    const token = req.cookies.token; // 쿠키에서 토큰 추출
    
    if (!token) {
        return res.json({ 
            isAuthenticated: false, // 인증 여부
            user: null // 사용자 정보
        });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        res.json({
            isAuthenticated: true, // 인증 여부
            user: decoded // 사용자 정보
        });
    } catch (err) {
        res.json({ 
            isAuthenticated: false, // 인증 여부
            user: null // 사용자 정보
        });
    }
});

// 로그인 엔드포인트
app.post('/api/login', (req, res) => {
  console.log('로그인 요청 데이터:', req.body); // 로그인 요청 데이터 로깅

  const { id: username, pw: password } = req.body; // 요청 본문에서 사용자 이름과 비밀번호 추출
  const ipAddress = req.ip; // 클라이언트 IP 주소
  const userAgent = req.headers['user-agent']; // 클라이언트 사용자 에이전트

  console.log('로그인 시도:', { username, ipAddress });

  // 1. 먼저 users 테이블에서 사용자 ID 조회
  const userQuery = 'SELECT user_id, username, password, forename ,role_id FROM users WHERE username = ?';
  
  db.query(userQuery, [username], (err, users) => { // 사용자 조회
    if (err) {
      console.error('사용자 조회 실패:', err);
      return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
    }

    if (users.length === 0) {
      // 사용자가 없는 경우 로그인 실패 기록
      const failHistoryQuery = `
        INSERT INTO login_history 
        (user_id, session_id, ip_address, login_status, fail_reason) 
        VALUES (NULL, NULL, ?, 'fail', ?)
      `;
      db.query(failHistoryQuery, [ipAddress, '사용자를 찾을 수 없음']);
      return res.status(401).json({ error: '사용자를 찾을 수 없습니다.' });
    }

    const user = users[0]; // 사용자 정보
    const userId = user.user_id; // 사용자 ID

    if (password !== user.password) { // 비밀번호 불일치 검사
      // 비밀번호 불일치 로그인 실패 기록
      const failHistoryQuery = `
        INSERT INTO login_history 
        (user_id, session_id, ip_address, login_status, fail_reason) 
        VALUES (?, NULL, ?, 'fail', ?)
      `;
      db.query(failHistoryQuery, [userId, ipAddress, '비밀번호 불일치']);
      return res.status(401).json({ error: '비밀번호가 일치하지 않습니다.' });
    }

    // JWT 토큰 생성
    const token = jwt.sign(
      { 
        userId: user.user_id,
        username: user.username,
        forename: user.forename,
        roleId: user.role_id
      },
      JWT_SECRET,
      { expiresIn: '24h' }
      
    );

    console.log('JWT 토큰 생성 완료');

    // 세션 생성
    const sessionId = createSessionAndRecordLogin(userId, token, ipAddress, userAgent, req);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000
    });

        console.log('로그인 완료:', { userId});
        res.json({
            success: true,
            message: '로그인 성공',
            user: { 
                userId: user.user_id,
                username: user.username,
                forename: user.forename,
                roleId: user.role_id
            }
        });
    });
});

// 로그아웃 엔드포인트
app.post('/api/logout', (req, res) => { // 엔드포인트 추가
    console.log('로그아웃 요청:', {
        token: req.cookies.token?.substring(0, 20) + '...', // 토큰 추출
        ip: req.ip 
    });

    const token = req.cookies.token;
    
    if (!token) {
        console.log('로그아웃 실패: 토큰 없음'); 
        return res.status(401).json({ error: '로그인되어 있지 않니다.' });
    }

    // 1. 유효한 세션 찾기
    const findSessionQuery = `
        SELECT session_id, user_id 
        FROM sessions 
        WHERE token = ? AND is_valid = 1
    `; // 세션 조회 쿼리
    console.log('세션 조회 쿼리 실행');

    db.query(findSessionQuery, [token], (err, sessions) => {
        if (err) {
            console.error('세션 조회 실패:', err);
            return res.status(500).json({ error: '서버 오류가 발생했습니다.' }); // 서버 오류 응답
        }
        console.log('세션 조회 결과:', { found: sessions.length > 0 }); // 세션 조회 결과 로깅

        if (sessions.length === 0) {
            console.log('유효한 세션 없음, 쿠키만 제거'); // 유효한 세션 없음 로깅
            res.clearCookie('token'); // 쿠키 제거
            return res.json({ message: '로그아웃되었습니다.' }); // 로그아웃 응답
        }

        const session = sessions[0]; // 세션 조회한 결과를 저장
        console.log('유효한 세션 찾음:', { sessionId: session.id, userId: session.user_id }); // 유효한 세션 찾음 로깅

        // 2. 세션 무효화
        const invalidateSessionQuery = `
            UPDATE sessions 
            SET is_valid = 0, 
                last_activity = CURRENT_TIMESTAMP 
            WHERE session_id = ?
        `; // 세션 무효화 쿼리
        console.log('세션 무효화 쿼리 실행:', { sessionId: session.id }); // 세션 무효화 쿼리 실행 로깅

        db.query(invalidateSessionQuery, [session.id], (err) => {
            if (err) {
                console.error('세션 무효화 실패:', err);
                return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
            }
            console.log('세션 무효화 성공');

            // 3. 로그아웃 시간 기록
            const updateLoginHistoryQuery = `
                UPDATE login_history 
                SET logout_time = CURRENT_TIMESTAMP 
                WHERE session_id = ? 
                AND logout_time IS NULL
            `;
            console.log('로그아웃 시간 기록 쿼리 실행:', { sessionId: session.id });

            db.query(updateLoginHistoryQuery, [session.id], (err) => {
                if (err) {
                    console.error('로그아웃 시간 기록 실패:', err);
                } else {
                    console.log('로그아웃 시간 기록 성공');
                } 

                console.log('로그아웃 완료:', {
                    sessionId: session.id,
                    userId: session.user_id
                });

                res.clearCookie('token');
                res.json({ message: '로그아웃되었습니다.' });
            });
        });
    });
});

// 게시글 목록 조회
app.get('/api/posts', (req, res) => {
    console.log('게시글 목록 조회 요청');
    const query = 'SELECT * FROM posts ORDER BY created_at DESC';
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('게시글 조회 실패:', err);
            return res.status(500).json({ error: '게시글 조회에 실패했습니다.' });
        }
        console.log('게시글 조회 성공:', results ? results.length : 0, '개');
        res.json(results || []);
    });
});

// 게시글 작성 (회원 전용)
app.post('/api/posts', verifyToken, (req, res) => {
    const { title, content, category } = req.body;
    const author = req.user.username; // 토큰에서 사용자 ID 추출
    const userId = req.user.userId; // 토큰에서 사용자 ID 추출
    const query = 'INSERT INTO posts (title, content, author, category, user_id) VALUES (?, ?, ?, ?, ?)';
    db.query(query, [title, content, author, category, userId], (err, result) => {
        if (err) {
            console.error('게시글 작성 실패:', err);
            return res.status(500).json({ error: '게시글 작성에 실패했습니.' });
        }
        res.json({ 
            id: result.insertId,
            message: '게시글이 작성되었습니다.'
        });
    });
});

// 게시글 수정 (작성자 전용)
app.put('/api/posts/:id', verifyToken, (req, res) => {
    const postId = req.params.id;
    const { title, content, category } = req.body;
    const username = req.user.username;  // 토큰에서 username 가져오기

    console.log('게시글 수정 요청:', { postId, username, body: req.body });  // 요청 데이터 로깅

    // 작성자 확인
    db.query('SELECT * FROM posts WHERE post_id = ?', [postId], (err, results) => {
        if (err) {
            console.error('게시글 조회 실패:', err);
            return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: '게시글을 찾을 수 없습니다.' });
        }

        const post = results[0];
        console.log('권한 체크:', { 
            postAuthor: post.author, 
            requestUser: username,
            isMatch: post.author === username 
        });

        if (post.author !== username) {
            return res.status(403).json({ error: '수정 권한이 없습니다.' });
        }

        // 게글 수정
        const query = 'UPDATE posts SET title = ?, content = ?, category = ? WHERE post_id = ?';
        db.query(query, [title, content, category, postId], (err) => {
            if (err) {
                console.error('게시글 수정 실패:', err);
                return res.status(500).json({ error: '게시글 수정에 실패했습니다.' });
            }
            res.json({ message: '게시글이 수정되었습니다.' });
        });
    });
});

// 게시글 삭제 (작성자 전용) api/posts/:id (api경로)
// express()객체의 delete()메소드를 오버로딩? 자값은 (path, middleware/선택(일종의 조건문같은 느낌), handler - 여기서는 callback 씀) 
app.delete('/api/posts/:id', verifyToken, (req, res) => {// 드포인트 추가
    // 미들웨어를 안쓰면 바로 callback 함수 호출
    // 미들웨어를 쓰면 미들웨어 호출 후 callback 함수 호출
    // 미들웨어에서 토큰 검증 실패시 401 상태 코드와 함께 JSON 응답
    // 토큰 검증 성공시 다음 콜백 함수 호출
    const postId = req.params.id;// 클라이언트가 게시글 아이디를 전달
    const username = req.user.username;// 토큰에서 사용자 ID 추출
    console.log('게시글 삭제 요청:', { postId, username });
    // app.delete() 가 호출되면 express()가 가지고 있는 req, res 객체를 callback 함수의 인자로 전달
    // 클라이언트가 서버에 요청을 보낼 때, Express.js가 요청의 내용을 req 객체에 담아 서버로 전달
    // ex) delete 버튼을 누른 시점에 app이 가지고 있는 req[params, query, body, headers]에 요청의 내용이 담김
    // 클라이언트가 서버로 요청을 보낼 때 CORS 설정에 의해 허용된 출처가 아니면 요청 자체가 차단됨
    // ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'] 메소드 중 하나로 요청이 야 서버가 응답함
    // (req, res) => {} 는 req객체정보를 이용해서 작업을 수행하고 callback 함수이기에 작업 결과를 res 객체에 담아 응답
    // 결국 delete 메서드는 req를 가지고 null인 res를 데이터를 가진 객체로 반환하는 메서드
    // res는 작업이 아닌 작업결과를 응답하는 객체
    // 나같은 경우 작성자와 일치할 때 수정 삭제가 가능해야 해서 조건으로 쿠키.토큰 검증 미들웨어를 사용
    
    // 그런데 굳이 DB에서 매번 SELECT 쿼리를 할 필요가 없다고 생각함
    // 사용자들의 데이터는 필요하기에 DB에 저장은 해야하니까
    // post를 생성할 때 DB에 삽입하고 JSON 형태로 웹 내에서 보관
    // 그러면 삭제할 때도 쿠키.토큰 검증 미들웨어를 통해 사용자 인증 후 삭제 가능
    // 삭제는 DB에서 삭제가 아니라 JSON 형태로 웹 내에서 삭제만 하면 됨
    // 그러면 쿼리를 한번 줄일 수 있어서 좋다고 생각함
    // 수정할때도 마찬지로 수정한 값을 DB에 저장하고
    // 수정 값은 JSON 형태로 웹 내에서 보관
    // 그러면 게시판 조회 시 쿼리를 안보내고 JSON 형태로 조회만 하면 됨
    // 결론은 삽입, 수정 시에만 DB에 저장하고 조회, 삭제는 웹 내에서 처리
    // 그런데 사용량이 많아야 쿼리 줄이는 것이 의미가 있을 듯
    // 사용량이 적어서 웹 내에서 처리하는 게 낫지만, 이미 만든거 굳이 바꿀 필요는 없음

    // 작성자 확
    db.query('SELECT * FROM posts WHERE post_id = ?', [postId], (err, results) => {
        if (err) {
            console.error('게시글 조회 실패:', err);
            return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
        }

        // 영향받은 행이 없다면 권한이 없거나 게시글이 없는 경우
        if (results.length === 0) {
            return res.status(404).json({ error: '게시글을 찾을 수 없습니다.' });
        }

        const post = results[0];
        console.log('게시글 정보:', { postId, username });

        // user_id 대신 author로 권한 체크
        if (post.author !== username) {
            return res.status(403).json({ error: '삭제 권한이 없습니다.' });
        }

        // 게시글 삭제
        const query = 'DELETE FROM posts WHERE post_id = ?';
        db.query(query, [postId], (err) => {
            if (err) {
                console.error('게시글 삭제 실패:', err);
                return res.status(500).json({ error: '게시글 삭제에 실패했습니다.' });
            }
            res.json({ message: '게시글이 삭제되었습니다.' });
        });
    });
});
//============================================================//
// GET 요청 예제
app.get('/api/test/get', (req, res) => {
    const testParam = req.params.test;
    res.json({ 
        message: 'GET 요청 성공',
        parameter: testParam 
    });
    console.log('받은 파라미터:', testParam);
});

// POST 요청 예제
app.post('/api/test', (req, res) => {
    const { data } = req.body;
    res.json({ 
        message: 'POST 요청 성공',
        receivedData: data 
    });
    console.log('받은 데이터:', data);
});

// 파라미터 여러 개 받기
app.get('/api/test/:param1/:param2', (req, res) => {
    const { param1, param2 } = req.params;
    res.json({
        message: '다중 파라미터 요청 성공',
        parameters: {
            param1,
            param2
        }
    });
    console.log('파라미터1:', param1);
    console.log('파라미터2:', param2);
});

// 쿼리 파라미터 받기
app.get('/api/test', (req, res) => {
    const { query1, query2 } = req.query;
    res.json({
        message: '쿼리 파라미터 요청 성공',
        queries: {
            query1,
            query2
        }
    });
    console.log('쿼리1:', query1);
    console.log('쿼리2:', query2);
});
//============================================================//
// 회원가입 username 중복확인
app.get('/api/users/check-username', (req, res) => {  // POST → GET으로 변경, URL 파라미터 제거
    const username = req.query.username;  // query parameter로 받기
    console.log('username 중복확인 요청:', username);

    const query = 'SELECT * FROM users WHERE username = ?';
    db.query(query, [username], (err, result) => {
        if(err){
            console.error('username 중복확인 실패:', err);
            return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
        }
        if(result.length > 0){
            return res.status(400).json({ error: '이미 사용 중인 아이디입니다.' });
        }
        res.json({ isAvailable: true });
    });
});
//============================================================//
//============================================================//
// 게시글 상세 조회
app.get('/api/posts/:id', (req, res) => {// 엔드포인트 // 조회는 권한이 필요 없기에 조건(미들웨어) 없음
    const postId = req.params.id;
    console.log('게시글 상세 조회:', postId);

    const query = 'SELECT * FROM posts WHERE post_id = ?';
    db.query(query, [postId], (err, results) => {
        if (err) {
            console.error('게시글 상세 조회 실패:', err);
            return res.status(500).json({ error: '게시글 조회에 실패했습니다.' });
        }
        if (!results || results.length === 0) {
            return res.status(404).json({ error: '게시글을 찾을 수 없습니다.' });
        }
        
        console.log('조회된 게시글:', results[0]);
        res.json(results[0]);
    });
});

// 조회수 증가
app.put('/api/posts/:id/views', (req, res) => {
    const postId = req.params.id;
    console.log('조회수 증가 요청:', postId);

    // 먼저 게시글 존재 여부 확인
    db.query('SELECT post_id FROM posts WHERE post_id = ?', [postId], (err, results) => {
        if (err) {
            console.error('게시글 조회 실패:', err);
            return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: '시글을 찾을 수 없습니다.' });
        }

        // 조회수 증가
        const query = 'UPDATE posts SET views = COALESCE(views, 0) + 1 WHERE post_id = ?';
        db.query(query, [postId], (err) => {
            if (err) {
                console.error('조회수 증가 실패:', err);
                return res.status(500).json({ error: '조회수 업데이트에 실패했습니다.' });
            }
            res.json({ message: '조회수가 증가되었습니다.' });
        });
    });
});

// 게시글 검색
app.get('/api/search', (req, res) => {
    const { type, keyword } = req.query;
    console.log('게시글 검색:', { type, keyword });

    let query;
    let params;

    if (!keyword || keyword.trim() === '') {
        // 검색어가 없을 경우 전체 게시글 조회
        query = 'SELECT * FROM posts ORDER BY created_at DESC';
        params = [];
    } else {
        // 검색어가 있을 경우 MATCH AGAINST 사용
        switch(type) {
            case 'title':
                query = 'SELECT * FROM posts WHERE MATCH(title) AGAINST(? IN BOOLEAN MODE) ORDER BY created_at DESC';
                break;
            case 'content':
                query = 'SELECT * FROM posts WHERE MATCH(content) AGAINST(? IN BOOLEAN MODE) ORDER BY created_at DESC';
                break;
            case 'author':
                query = 'SELECT * FROM posts WHERE author LIKE ? ORDER BY created_at DESC';
                break;
            default:
                query = 'SELECT * FROM posts WHERE MATCH(title) AGAINST(? IN BOOLEAN MODE) ORDER BY created_at DESC';
        }
        params = [type === 'author' ? `%${keyword}%` : `${keyword}*`];
    }
    
    db.query(query, params, (err, results) => {
        if (err) {
            console.error('게시글 검색 실패:', err);
            return res.status(500).json({ error: '게시글 검색에 실패했습니다.' });
        }
        res.json(results || []);
    });
});

// WebSocket 서버를 8081 포트로 생성
const wss = new WebSocket.Server({ 
  server: server,  
  path: '/ws',
  cors: {
      origin: ['http://183.105.171.41:3000', 'http://localhost:3000'],
      methods: ['GET', 'POST']
  }
});

// 캔버스 상태를 저장할 객체
const canvasStates = new Map();
const canvasList = new Set();
// 메시지 중복 방지를 위한 Set
const recentMessages = new Set();

wss.on('connection', function connection(ws, req) {
    const clientIp = req.socket.remoteAddress;
    console.log('새로운 클라이언트 연결됨. IP:', clientIp);
    
    ws.on('message', function incoming(data) {
        try {
            const message = JSON.parse(data);
            console.log('WebSocket 메시지 수신:', {
                type: message.type,
                chatroomId: message.chatroomId,
                clientChatroomId: ws.chatroomId,
                messageData: message
            });

            if (message.type === 'draw') {
                console.log('그리기 데이터:', {
                    senderChatroomId: message.chatroomId,
                    currentChatroomId: ws.chatroomId,
                    canvasId: message.canvasId
                });
            }

            // 채팅방 ID 저장
            if (message.type === 'join') {
                ws.chatroomId = message.chatroomId;
                console.log(`클라이언트가 채팅방 ${message.chatroomId}에 입장`);
            }

            // 그림판 관련 메시지는 같은 채팅방 사용자에게만 전송
            if (['draw', 'clear', 'addCanvas', 'deleteCanvas'].includes(message.type)) {
                wss.clients.forEach(function each(client) {
                    if (client.chatroomId === ws.chatroomId && client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify(message));
                    }
                });

                // 캔버스 상태 저장
                if (message.type === 'draw') {
                    if (!canvasStates.has(message.canvasId)) {
                        canvasStates.set(message.canvasId, []);
                    }
                    canvasStates.get(message.canvasId).push(message);
                } else if (message.type === 'clear') {
                    canvasStates.set(message.canvasId, []);
                }
            }
        } catch (error) {
            console.error('메시지 처리 중 오류:', error);
        }
    });

    ws.on('error', function(error) {
        console.error('WebSocket 에러:', error);
    });

    ws.on('close', function() {
        console.log('클라이언트 연결 해제됨');
    });
});
// 주기적으로 오래된 메시지 정리
setInterval(() => {
    recentMessages.clear();
}, 1000);

wss.on('error', function(error) {
    console.error('WebSocket 서버 에러:', error);
});

console.log('WebSocket 서버가 8081 포트에서 실행 중입니다.');



// SMS 관련 설정
const coolsms = require('coolsms-node-sdk').default;
const messageService = new coolsms('NCS1IDLQ1RWDURVH', 'X1PBIBN03QJO531HIUGGREON2LWIB5VD');
const SPRING_SERVER = 'http://183.105.171.41:8083';

// 인증번호 저장을 위한 임시 저장소
const otpStore = new Map();  // { phoneNumber: { code: string, expireTime: Date } }

// SMS 발송 요청 처리
app.post('/api/send-sms', async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    const verificationCode = Math.floor(100000 + Math.random() * 900000);

    console.log('SMS 발송 시도:', { phoneNumber, verificationCode });

    // coolsms로 SMS 발송
    const result = await messageService.sendOne({
      to: phoneNumber,
      from: '010-6587-7718',
      text: `인증번호는 [${verificationCode}] 입니다.`
    });

    console.log('Coolsms 응답:', result);

    if (result.statusCode === '2000') {
      // 인증번호 저장
      otpStore.set(phoneNumber, {
        code: verificationCode.toString(),
        expireTime: new Date(Date.now() + 5 * 60000)  // 5분 후 만료
      });

      res.json({ 
        success: true, 
        message: 'SMS sent successfully',
        code: verificationCode
      });
    } else {
      throw new Error('SMS 발송 실패');
    }
  } catch (error) {
    console.error('SMS 발송 오류:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || '인증번호 발송에 실패했습니다.' 
    });
  }
});

// 인증번호 확인
app.post('/api/verify-otp', (req, res) => {
  try {
    const { phoneNumber, otp } = req.body;
    console.log('인증번호 확인 요청:', { phoneNumber, otp });

    const storedData = otpStore.get(phoneNumber);
    if (!storedData) {
      return res.json({ 
        success: false, 
        message: '인증번호를 먼저 요청해주세요.' 
      });
    }

    if (new Date() > storedData.expireTime) {
      otpStore.delete(phoneNumber);
      return res.json({ 
        success: false, 
        message: '인증호가 만료되었습니다.' 
      });
    }

    if (storedData.code === otp) {
      otpStore.delete(phoneNumber);  // 사용한 인증번호 삭제
      return res.json({ 
        success: true, 
        message: '인증이 완료되었습니다.' 
      });
    }

    res.json({ 
      success: false, 
      message: '인증번호가 일치하지 않습니다.' 
    });
  } catch (error) {
    console.error('인증번호 확인 오류:', error);
    res.status(500).json({ 
      success: false, 
      error: '인증번호 확인에 실패했습니다.' 
    });
  }
});

// 회원가입 처리
app.post('/api/signup', async (req, res) => {
  try {
    const { 
      username, 
      password, 
      name, 
      email, 
      phone 
    } = req.body;

    // 필수 필드 검증
    if (!username || !password || !name || !email || !phone) {
      return res.status(400).json({ 
        success: false, 
        error: '모든 필수 항목을 입력해주세요.' 
      });
    }

    // 아이디 중복 확인
    const checkQuery = 'SELECT * FROM users WHERE username = ?';
    db.query(checkQuery, [username], (err, results) => {
      if (err) {
        console.error('사용자 조회 실패:', err);
        return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
      }

      if (results.length > 0) {
        return res.status(400).json({ error: '이미 사용 중인 아이디입니다.' });
      }

      // 새 사용자 추가
      const insertQuery = `
        INSERT INTO users (
          username, 
          password, 
          name, 
          email, 
          phone,
          role_id,
          status,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'active', NOW())
      `;

      db.query(
        insertQuery, 
        [
          username, 
          password, 
          name, 
          email, 
          phone,
          4  // 일반 사용자 role_id (관리자는 1)
        ],
        (err, result) => {
          if (err) {
            console.error('회원가입 실패:', err);
            return res.status(500).json({ error: '회원가입에 실패했습니다.' });
          }

          console.log('회원가입 성공:', { username, name });
          res.json({ 
            success: true, 
            message: '회원가입이 완료되었습니다.',
            userId: result.insertId 
          });
        }
      );
    });
  } catch (error) {
    console.error('회원가입 처리 중 오류:', error);
    res.status(500).json({ 
      success: false, 
      error: '회원가입 처리 중 오류가 발생했습니다.' 
    });
  }
});

// 관리자 권한 확인 미들웨어
const verifyAdmin = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ error: '인증이 필요합니다.' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const query = 'SELECT role_id FROM users WHERE user_id = ?';
    
    db.query(query, [decoded.userId], (err, results) => {
      if (err || !results.length) {
        return res.status(401).json({ error: '사용자를 찾을 수 없습니다.' });
      }
      
      if (results[0].role_id !== 1) {  // role_id가 1(admin)이 아닌 경우
        return res.status(403).json({ error: '관리자 권한이 필요합니다.' });
      }
      
      next();
    });
  } catch (error) {
    res.status(401).json({ error: '인증이 만료되었습니다.' });
  }
};

// 사용자 목록 조회 (관리자 전용)
app.get('/api/admin/users', verifyAdmin, (req, res) => {
  const query = `
    SELECT u.*, r.name as role_name 
    FROM users u 
    JOIN roles r ON u.role_id = r.id
    ORDER BY u.created_at DESC
  `;
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('사용자 목록 조회 실패:', err);
      return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
    }
    res.json(results);
  });
});

// 사용자 권한 변경 (관리자 전용)
app.put('/api/admin/users/:id/role', verifyAdmin, (req, res) => {
  const { id } = req.params;
  const { roleId } = req.body;
  
  const query = 'UPDATE users SET role_id = ? WHERE user_id = ?';
  db.query(query, [roleId, id], (err) => {
    if (err) {
      console.error('권한 변경 실패:', err);
      return res.status(500).json({ error: '권한 변경에 실패했습니다.' });
    }
    res.json({ message: '권한이 변경되었습니다.' });
  });
});

// 사용자 상태 변경 (관리자 전용)
app.put('/api/admin/users/:id/status', verifyAdmin, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  const query = 'UPDATE users SET status = ? WHERE user_id = ?';
  db.query(query, [status, id], (err) => {
    if (err) {
      console.error('상태 변경 실패:', err);
      return res.status(500).json({ error: '상태 변경에 실패했습니다.' });
    }
    res.json({ message: '상태가 변경되었습니다.' });
  });
});

// 채팅방 생성
app.post('/api/chatrooms', verifyToken, (req, res) => {
  const { name, description, isGroup, password } = req.body;
  const userId = req.user.userId;
  const username = req.user.username;
  const forename = req.user.forename;  // JWT 토큰에서 forename 가져오기
  
  console.log('채팅방 생성 요청:', {
    name,
    userId,
    forename,  // 디버깅용 로그
    description
  });

  // 트랜잭션 시작
  db.beginTransaction(async (err) => {
    if (err) {
      console.error('트랜잭션 시작 실패:', err);
      return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
    }

    try {
      // 1. 채팅방 생성 (chatname으로 변경)
      const chatroomQuery = `
        INSERT INTO chatrooms (chatname, description, is_group, password, forename)
        VALUES (?, ?, ?, ?, ?)
      `;
      
      db.query(chatroomQuery, [name, description, isGroup ? 1 : 0, password, forename], (err, result) => {
        if (err) {
          return db.rollback(() => {
            console.error('채팅방 생성 실패:', err);
            res.status(500).json({ error: '채팅방 생성에 실패했습니다.' });
          });
        }

        const chatroomId = result.insertId;

        // 2. 채팅방 생성자를 chatroom_users에 추가 (관리자 권한으로)
        const userQuery = `
          INSERT INTO chatroom_users (chatroom_id, user_id, is_admin)
          VALUES (?, ?, 1)
        `;

        db.query(userQuery, [chatroomId, userId], (err) => {
          if (err) {
            return db.rollback(() => {
              console.error('채팅방 사용자 추가 실패:', err);
              res.status(500).json({ error: '채팅방 생성에 실패했습니다.' });
            });
          }

          // 트랜잭션 커밋
          db.commit((err) => {
            if (err) {
              return db.rollback(() => {
                console.error('커밋 실패:', err);
                res.status(500).json({ error: '채팅방 생성에 실패했습니다.' });
              });
            }

            res.json({ 
              success: true, 
              message: '채팅방이 생성되었습니다.',
              chatroomId: chatroomId 
            });
          });
        });
      });
    } catch (error) {
      return db.rollback(() => {
        console.error('채팅방 생성 중 오류:', error);
        res.status(500).json({ error: '채팅방 생성에 실패했습니다.' });
      });
    }
  });
});

// 채팅방 삭제/나가기
app.delete('/api/chatrooms/:chatroomId', verifyToken, async (req, res) => {
    const chatroomId = parseInt(req.params.chatroomId, 10);
    const userId = req.user.userId;

    try {
        // 채팅방 소가자 확인 및 역할 체크
        const checkUserQuery = `
            SELECT cu.user_id, cu.is_admin
            FROM chatroom_users cu
            WHERE cu.chatroom_id = ? AND cu.user_id = ?
        `;
        
        db.query(checkUserQuery, [chatroomId, userId], (err, results) => {
            if (err) {
                console.error('채팅방 조회 실패:', err);
                return res.status(500).json({ error: '채팅방 조회에 실패했습니다.' });
            }

            if (results.length === 0) {
                return res.status(404).json({ error: '채팅방을 찾을 수 없습니다.' });
            }

            // 관리자인 경우: 채팅방 완전 삭제
            if (results[0].is_admin) {
                const deleteQuery = `DELETE FROM chatrooms WHERE chatroom_id = ?`;
                db.query(deleteQuery, [chatroomId], (err) => {
                    if (err) {
                        console.error('채팅방 삭제 실패:', err);
                        return res.status(500).json({ error: '채팅방 삭제에 실패했습니다.' });
                    }
                    res.json({ message: '채팅방이 삭제되었습니다.' });
                });
            } 
            // 일반 참가자인 경우: chatroom_users에서만 삭제 (채팅방 나가기)
            else {
                const leaveQuery = `DELETE FROM chatroom_users WHERE chatroom_id = ? AND user_id = ?`;
                db.query(leaveQuery, [chatroomId, userId], (err) => {
                    if (err) {
                        console.error('채팅방 나가기 실패:', err);
                        return res.status(500).json({ error: '채팅방 나가기에 실패했습니다.' });
                    }
                    res.json({ message: '채팅방을 나갔습니다.' });
                });
            }
        });
    } catch (error) {
        console.error('채팅방 삭제/나가기 중 오류:', error);
        res.status(500).json({ error: '처리 중 오류가 발생했습니다.' });
    }
});

// 비로그인 사용자의 채팅방 목록 조회
app.get('/api/chatrooms/search', (req, res) => {
  const { keyword } = req.query;
  

  const query = `
    SELECT 
        c.chatroom_id,
        c.chatname,
        c.description,
        c.is_group,
        c.created_at,
        c.forename,
        EXISTS (
            SELECT 1 
            FROM chatroom_users 
            WHERE chatroom_id = c.chatroom_id 
            
        ) as is_joined
    FROM chatrooms c
    WHERE c.chatname LIKE ?
    ORDER BY 
        CASE 
            WHEN c.chatname LIKE ? THEN 0  -- 정확히 일치
            WHEN c.chatname LIKE ? THEN 1  -- 시작 부분 일치
            ELSE 2                         -- 부분 일치
        END,
        c.created_at DESC
  `;

  const searchPattern = `%${keyword}%`;
  const startPattern = `${keyword}%`;
  const exactPattern = keyword;
  
  db.query(query, [searchPattern, exactPattern, startPattern], (err, results) => {
    if (err) {
      console.error('채팅방 검색 실패:', err);
      return res.status(500).json({ error: '채팅방 검색에 실패했습니다.' });
    }

    const formattedResults = results.map(room => ({
      ...room,
      is_group: !!room.is_group,
      is_joined: !!room.is_joined,
      created_at: new Date(room.created_at).toISOString()
    }));

    res.json(formattedResults);
  });
});

// 채팅방 입장 API
app.post('/api/chatrooms/:id/join', verifyToken, (req, res) => {
    const chatroomId = req.params.id;
    const userId = req.user.userId;

    // 이미 참여 중인지 확인
    const checkQuery = `
        SELECT 1 FROM chatroom_users 
        WHERE chatroom_id = ? AND user_id = ?
    `;

    db.query(checkQuery, [chatroomId, userId], (err, results) => {
        if (err) {
            return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
        }

        if (results.length > 0) {
            return res.status(400).json({ error: '이미 참여 중인 채팅방입니다.' });
        }

        // 채팅방에 사용자 추가
        const joinQuery = `
            INSERT INTO chatroom_users (chatroom_id, user_id, is_admin)
            VALUES (?, ?, 0)
        `;

        db.query(joinQuery, [chatroomId, userId], (err) => {
            if (err) {
                return res.status(500).json({ error: '채팅방 입장에 실패했습니다.' });
            }

            res.json({ 
                success: true, 
                message: '채팅방에 입장했습니다.' 
            });
        });
    });
});

// 사용자가 참여하고 있는 채팅방 목록 조회
app.get('/api/my-chatrooms', verifyToken, (req, res) => {
    const userId = req.user.userId;
    
    const query = `
        SELECT 
            c.chatroom_id,
            c.chatname,
            c.description,
            c.is_group,
            c.created_at,
            c.forename,
            cu.is_admin,
            cu.joined_at
        FROM chatrooms c
        INNER JOIN chatroom_users cu ON c.chatroom_id = cu.chatroom_id
        WHERE cu.user_id = ?
        ORDER BY cu.joined_at DESC
    `;
    
    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('채팅방 목록 조회 실패:', err);
            return res.status(500).json({ 
                error: '채팅방 목록 조회에 실패했습니다.' 
            });
        }
        
        // 결과를 boolean으로 변환하고 날짜 포맷팅
        const formattedResults = results.map(room => ({
            chatroom_id: room.chatroom_id,
            chatname: room.chatname,
            description: room.description,
            is_group: !!room.is_group,
            created_at: new Date(room.created_at).toISOString(),
            forename: room.forename,
            is_admin: !!room.is_admin,
            joined_at: new Date(room.joined_at).toISOString()
        }));

        console.log('사용자의 채팅방 목록 조회 결과:', formattedResults);
        res.json(formattedResults);
    });
});

// 서버 시작
const PORT = 8080;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
});

//mainServer.js
// 메시지 저장 엔드포인트
app.post('/api/messages', verifyToken, async (req, res) => {
  const { chatroom_id, content, message_type = 'text' } = req.body;
  const sender_id = req.user.userId;

  try {
      const query = `
          INSERT INTO messages 
          (chatroom_id, sender_id, content, message_type, sent_at)
          VALUES (?, ?, ?, ?, NOW())
      `;

      db.query(query, [chatroom_id, sender_id, content, message_type], (err, result) => {
          if (err) {
              console.error('메시지 저장 실패:', err);
              return res.status(500).json({ error: '메시지 저장에 실패했습니다.' });
          }

          // 저장된 메시지 정보 조회
          const messageQuery = `
              SELECT 
                  m.*,
                  u.username,
                  u.forename
              FROM messages m
              JOIN users u ON m.sender_id = u.user_id
              WHERE m.message_id = ?
          `;

          db.query(messageQuery, [result.insertId], (err, messages) => {
              if (err) {
                  console.error('메시지 조회 실패:', err);
                  return res.status(500).json({ error: '메시지 조회에 실패했습니다.' });
              }

              const savedMessage = messages[0];
              
              // 웹소켓으로 메시지 브로드캐스트
              wss.clients.forEach(client => {
                  if (client.chatroomId === chatroom_id && client.readyState === WebSocket.OPEN) {
                      client.send(JSON.stringify({
                          type: 'message',
                          data: savedMessage
                      }));
                  }
              });

              res.json(savedMessage);
          });
      });
  } catch (error) {
      console.error('메시지 처리 중 오류:', error);
      res.status(500).json({ error: '메시지 처리 중 오류가 발생했습니다.' });
  }
});

// 채팅방 메시지 조회 API
app.get('/api/chatrooms/:chatroomId/messages', verifyToken, (req, res) => {
  const { chatroomId } = req.params;
  
  const query = `
      SELECT 
          m.*,
          u.username,
          u.forename
      FROM messages m
      JOIN users u ON m.sender_id = u.user_id
      WHERE m.chatroom_id = ?
      ORDER BY m.sent_at ASC
  `;

  db.query(query, [chatroomId], (err, messages) => {
      if (err) {
          console.error('메시지 조회 실패:', err);
          return res.status(500).json({ error: '메시지 조회에 실패했습니다.' });
      }
      res.json({ messages });
  });
});

// 메시지 읽음 처리 API
app.put('/api/messages/read', verifyToken, (req, res) => {
    const chatroomId = parseInt(req.body.chatroomId, 10); // 문자열을 숫자로 변환
    
    if (isNaN(chatroomId)) {
        return res.status(400).json({ error: '유효하지 않은 채팅방 ID입니다.' });
    }

    const query = `
        UPDATE messages
        SET is_read = true
        WHERE chatroom_id = ?
    `;

    db.query(query, [chatroomId], (err) => {
        if (err) {
            console.error('메시지 읽음 처리 실패:', err);
            return res.status(500).json({ error: '메시지 읽음 처리에 실패했습니다.' });
        }
        res.json({ success: true });
    });
});

// 서버 시작
server.listen(8081, '0.0.0.0', () => {
  console.log('서버가 8081 포트에서 실행 중입니다.');
});
