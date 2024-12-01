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
// WebSocket 모듈
const crypto = require('crypto');
// 암호화 모듈
const session = require('express-session');  // express-session 추가
// require() 모듈 불러오기

// Express 인스턴스 생성
const app = express();

// JWT 시크릿 키(인증키)
const JWT_SECRET = 'your-secret-key';

// CORS 설정을 가장 먼저 적용
// 모든 출처 허용
//(교차 출처 리소스 공유)의 약자로,
// 추가 HTTP 헤더를 사용하여 
//서로 다른 출처(도메인, 프로토콜, 포트)에 있는
// 웹 페이지나 서버가 서로의 자원에
// 접근할 수 있도록 허용하는 보안 메커니즘
app.use(cors({
    origin: true,  // 모든 origin 허용
    credentials: true, // 쿠키 포함 허용
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // 허용된 HTTP 메소드
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization', 'Cookie', 'X-Requested-With'], // 허용된 헤더
    optionsSuccessStatus: 200 // 옵션 요청 성공 상태 코드
}));

// WebSocket upgrade 요청 처리를 위한 미들웨어
// 변동사항을 추적하기 위해 사용
app.use((req, res, next) => { // 미들웨어 추가
    if (req.headers['upgrade'] !== undefined) { // 업그레이드 요청 확인
        res.end(); // 업그레이드 요청 처리
        return;
    }
    next(); // 다음 미들웨어 호출
});

// 기본 미들웨어
// app 객체(express 인스턴스)에 미들웨어 추가
// 요청 본문을 JSON으로 파싱
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
            username: decoded.username
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
    database: 'basicdb' // 데이터베이스 이름
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
        (id, user_id, token, ip_address, user_agent, is_valid, expires_at) 
        VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?)`;

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
app.post('/api/login', (req, res) => { // 엔드포인트 추가
    console.log('로그인 요청 데이터:', req.body); // 로그인 요청 데이터 로깅

    const { id: username, pw: password } = req.body; // 요청 본문에서 사용자 이름과 비밀번호 추출
    const ipAddress = req.ip; // 클라이언트 IP 주소
    const userAgent = req.headers['user-agent']; // 클라이언트 사용자 에이전트

    console.log('로그인 시도:', { username, ipAddress });

    // 1. 먼저 users 테이블에서 사용자 ID 조회
    const userQuery = 'SELECT user_id, username, password FROM users WHERE username = ?';
    
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
                userId: user.user_id,  // user_id를 userId로 저장
                username: user.username
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
                username: user.username
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
        return res.status(401).json({ error: '로그인되어 있지 않습니다.' });
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
            return res.status(500).json({ error: '게시글 작성에 실패했습니다.' });
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

        // 게시글 수정
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
// express()객체의 delete()메소드를 오버로딩? 인자값은 (path, middleware/선택(일종의 조건문같은 느낌), handler - 여기서는 callback 씀) 
app.delete('/api/posts/:id', verifyToken, (req, res) => {// 엔드포인트 추가
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
    // ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'] 메소드 중 하나로 요청이 와야 서버가 응답함
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
    // 수정할때도 마찬가지로 수정한 값을 DB에 저장하고
    // 수정 값은 JSON 형태로 웹 내에서 보관
    // 그러면 게시판 조회 시 쿼리를 안보내고 JSON 형태로 조회만 하면 됨
    // 결론은 삽입, 수정 시에만 DB에 저장하고 조회, 삭제는 웹 내에서 처리
    // 그런데 사용량이 많아야 쿼리 줄이는 것이 의미가 있을 듯
    // 사용량이 적어서 웹 내에서 처리하는 게 낫지만, 이미 만든거 굳이 바꿀 필요는 없음

    // 작성자 확인
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
            return res.status(404).json({ error: '게시글을 찾을 수 없습니다.' });
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
    port: 8081,
    perMessageDeflate: false  // 성능 향상을 위해 압축 비활성화
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
            
            // 메시지 중복 체크를 위한 키 생성
            const messageKey = JSON.stringify({
                type: message.type,
                canvasId: message.canvasId,
                x: message.x,
                y: message.y,
                lastX: message.lastX,
                lastY: message.lastY
            });

            // 이미 처리한 메시지면 무시
            if (recentMessages.has(messageKey)) {
                return;
            }

            // 새 메시지 추가 (100ms 후 삭제)
            recentMessages.add(messageKey);
            setTimeout(() => recentMessages.delete(messageKey), 100);
            
            switch(message.type) {
                case 'requestCanvasList':
                    ws.send(JSON.stringify({
                        type: 'canvasList',
                        canvases: Array.from(canvasList).map(id => ({ id }))
                    }));
                    break;
                    
                case 'addCanvas':
                    canvasList.add(message.id);
                    break;
                    
                case 'deleteCanvas':
                    canvasList.delete(message.id);
                    canvasStates.delete(message.id);
                    break;
                    
                case 'draw':
                    if (!canvasStates.has(message.canvasId)) {
                        canvasStates.set(message.canvasId, []);
                    }
                    canvasStates.get(message.canvasId).push(message);
                    // 다른 클라이언트에게만 전달
                    wss.clients.forEach(function each(client) {
                        if (client !== ws && client.readyState === WebSocket.OPEN) {
                            client.send(data);
                        }
                    });
                    break;
                    
                case 'clear':
                    canvasStates.set(message.canvasId, []);
                    // 다른 클라이언트에게만 전달
                    wss.clients.forEach(function each(client) {
                        if (client !== ws && client.readyState === WebSocket.OPEN) {
                            client.send(data);
                        }
                    });
                    break;
            }
        } catch (error) {
            console.error('메시지 처리 중 오류:', error);
        }
    });

    ws.on('close', function() {
        console.log('클라이언트 연결 해제됨');
    });

    ws.on('error', function(error) {
        console.error('WebSocket 에러:', error);
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

// CORS 설정 추가
app.use(cors({
    origin: '*',  // 모든 origin 허용 (개발 환경)
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// 서버 시작
const PORT = 8080;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
});
