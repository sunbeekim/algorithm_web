// server/codingServer.js

const express = require('express');
const { exec } = require('child_process');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 8090;

console.log('=================================');
console.log('서버 초기화 시작');

// tempDir을 전역 변수로 선언
let tempDir;

try {
    // 임시 디렉토리 경로 설정 수정 (server 한 번만 포함)
    tempDir = path.join(process.cwd(), 'temp');
    console.log('[DEBUG] tempDir 설정됨:', tempDir);

    // 디렉토리 존재 여부 확인
    console.log('[DEBUG] 디렉토리 존재 여부 확인 시작');
    const exists = fs.existsSync(tempDir);
    console.log('[DEBUG] 디렉토리 존재 여부:', exists);

    // temp 디렉토리가 없으면 생성
    if (!exists) {
        console.log('[DEBUG] 임시 디렉토리가 없습니다. 새로 생성합니다...');
        fs.mkdirSync(tempDir, { recursive: true });
        console.log('[DEBUG] 임시 디렉토리 생성 성공:', tempDir);
    } else {
        console.log('[DEBUG] 기존 임시 디렉토리를 사용합니다:', tempDir);
    }

    // 디렉토리 접근 권한 확인
    try {
        fs.accessSync(tempDir, fs.constants.R_OK | fs.constants.W_OK);
        console.log('[DEBUG] 디렉토리 접근 권한 확인 완료');
    } catch (err) {
        console.error('[DEBUG] 디렉토리 접근 권한 없음:', err);
    }

} catch (error) {
    console.error('초기화 과정 중 에러 발생:', error);
}

console.log('서버 초기화 완료');
console.log('=================================');

// CORS 설정
app.use(cors({
    origin: 'http://183.105.171.41:3000',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept'],
    credentials: true
}));

app.use(bodyParser.json());

// 코드 실행 함수에 로깅 추가
const executeCode = (language, code) => {
    return new Promise((resolve, reject) => {
        let dockerCommand;
        
        console.log('실행 요청:', { language, code });

        switch(language) {
            case 'javascript':
                dockerCommand = `docker run --rm node:14-alpine node -e "${code.replace(/"/g, '\\"')}"`;
                break;
            case 'python':
                dockerCommand = `docker run --rm python:3.9-alpine python3 -c "${code.replace(/"/g, '\\"')}"`;
                break;
            case 'java':
                // Main.java 파일 생성
                const javaFilePath = path.join(tempDir, 'Main.java');
                fs.writeFileSync(javaFilePath, code);
                
                // Docker 명령어 구성
                dockerCommand = `docker run --rm -v "${tempDir}:/app" eclipse-temurin:11-jdk-alpine /bin/sh -c "cd /app && javac Main.java && java Main"`;
                break;
            default:
                reject(new Error('지원하지 않는 언어입니다.'));
                return;
        }

        console.log('Docker 명령어:', dockerCommand);

        exec(dockerCommand, { timeout: 5000 }, (error, stdout, stderr) => {
            if (error) {
                console.error('실행 에러:', error);
                console.error('stderr:', stderr);
                reject(stderr || error.message);
                return;
            }
            console.log('실행 결과:', stdout);
            resolve(stdout);
            
            // Java 실행 후 임시 파일 삭제
            if (language === 'java') {
                try {
                    console.log('[DEBUG] 임시 파일 삭제 시도');
                    fs.unlinkSync(path.join(tempDir, 'Main.java'));
                    console.log('[DEBUG] Main.java 삭제 완료');
                    fs.unlinkSync(path.join(tempDir, 'Main.class'));
                    console.log('[DEBUG] Main.class 삭제 완료');
                } catch (err) {
                    console.error('[DEBUG] 임시 파일 삭제 실패:', err);
                }
            }
        });
    });
};

// API 엔드포인트에 로깅 추가
app.post('/api/execute', async (req, res) => {
    console.log('요청 받음:', req.body);  // 로깅 추가

    try {
        const { language, code } = req.body;
        
        if (!language || !code) {
            throw new Error('언어와 코드는 필수 입력값입니다.');
        }

        const output = await executeCode(language, code);
        res.json({ success: true, output });
    } catch (error) {
        console.error('API 에러:', error);  // 로깅 추가
        res.status(400).json({ 
            success: false, 
            error: error.toString(),
            details: error.message
        });
    }
});

// 에러 핸들링
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        error: '서버 에러가 발생했습니다.'
    });
});

// 모든 IP에서의 접속을 허용
app.listen(port, '0.0.0.0', () => {
    console.log('=================================');
    console.log(`코딩 서버가 포트 ${port}에서 실행 중입니다.`);
    console.log('서버 IP:', '0.0.0.0');
    console.log('현재 작업 디렉토리:', process.cwd());
    console.log('임시 디렉토리 위치:', tempDir);
    console.log('=================================');
});