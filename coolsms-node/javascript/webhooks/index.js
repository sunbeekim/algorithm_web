// coolsms-node/javascript/webhooks/index.js

const express = require('express')
const bodyParser = require('body-parser')
const asyncify = require('express-asyncify')
const coolsms = require('coolsms-node-sdk').default
const axios = require('axios')
const cors = require('cors')

const messageService = new coolsms('NCS1IDLQ1RWDURVH', 'X1PBIBN03QJO531HIUGGREON2LWIB5VD')
const SPRING_SERVER = 'http://183.105.171.41:8083'// 

const app = asyncify(express())

app.use(cors({
  origin: '*',
  credentials: true
}));

app.use(bodyParser.json({ extended: false }))
app.use(bodyParser.urlencoded({ extended: false }))

// SMS 발송 요청 처리
app.post('/send-sms', async (req, res) => {
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

    if (result.statusCode === '2000') {  // Coolsms 성공 상태 코드
      // Spring 서버에 인증번호 저장
      try {
        await axios.post(`${SPRING_SERVER}/api/verification/save`, {
          phoneNumber,
          code: verificationCode,
          expireTime: new Date(Date.now() + 5 * 60000)
        });

        res.json({ 
          success: true, 
          message: 'SMS sent successfully',
          code: verificationCode  // 개발 환경에서만 포함
        });
      } catch (springError) {
        console.error('Spring 서버 저장 실패:', springError);
        res.json({ 
          success: true,  // SMS는 성공했으므로 true
          message: 'SMS sent but verification save failed'
        });
      }
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
app.post('/verify-code', async (req, res) => {
  try {
    const { phoneNumber, code } = req.body

    // Spring 서버에 인증번호 확인 요청
    const response = await axios.post(`${SPRING_SERVER}/api/verification/verify`, {
      phoneNumber,
      code
    })

    res.json(response.data)
  } catch (error) {
    console.error('인증번호 확인 오류:', error)
    res.status(500).json({ success: false, error: error.message })
  }
})


// webhook 처리
app.post('/report', async (req, res) => {
  try {
    for (const groupInfo of req.body) {
      const result = await messageService.getGroupMessages(groupInfo.groupId)
      
      // Spring 서버에 발송 결과 전달
      await axios.post(`${SPRING_SERVER}/api/sms/report`, {
        messageList: result.messageList
      })
    }
    res.status(200).json({})
  } catch (error) {
    console.error('Webhook 처리 오류:', error)
    res.status(500).json({ error: error.message })
  }
})


