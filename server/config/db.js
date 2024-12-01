// 데이터베이스 연결 설정
// server/config/db.js
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: 'db-2vusd7-kr.vpc-pub-cdb.ntruss.com',
    port: 3306,
    user: 'aluser1',
    password: 'alpassword2450!',
    database: 'basicdb',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = pool; 