// server.js
require('dotenv').config(); // โหลด environment variables จาก .env
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { OpenAI } = require('openai'); // OpenAI SDK is used for DeepSeek (OpenAI-compatible API)
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 8080; // เปลี่ยนเป็น Port ที่ต้องการ เช่น 8080

// --- ดึง API Keys จาก .env ---
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

// --- ตรวจสอบว่ามี API Keys ที่จำเป็น ---
if (!GEMINI_API_KEY) {
    console.error("CRITICAL ERROR: GEMINI_API_KEY is not set or is empty in .env file. Gemini models will not work.");
    // Consider exiting if Gemini is critical: process.exit(1);
}
if (!DEEPSEEK_API_KEY) {
    console.warn("WARNING: DEEPSEEK_API_KEY is not set or is empty in .env file. DeepSeek models will not work.");
    // Consider exiting if DeepSeek is critical: process.exit(1);
}

// --- ตั้งค่า CORS ---
// เพิ่ม IP Address สาธารณะของเซิร์ฟเวอร์ และทุก Origin สำหรับการทดสอบ (ถ้าจำเป็น)
const allowedOrigins = [
    'https://ai-content-buddy.netlify.app',
    'http://localhost:8080',
    'http://127.0.0.1:8080',
    'http://147.50.230.61:8080' // *** สำคัญ: เพิ่ม IP สาธารณะของคุณที่นี่ ***
];

// สำหรับการพัฒนา/ทดสอบ: อนุญาตทุก origin (ในบางกรณีอาจสะดวกกว่า)
// ใน Production ควรระบุ origin ที่แน่นอนเท่านั้นเพื่อความปลอดภัย
// app.use(cors()); // ถ้าต้องการอนุญาตทุก Origin ในการพัฒนา

app.use(cors({
  origin: function (origin, callback) {
    // อนุญาต origin ที่อยู่ใน whitelist หรือ origin ที่เป็น undefined (เช่น การเรียกจาก file:// หรือ REST tools)
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      console.warn(`CORS: Origin "${origin}" not allowed.`);
      callback(new Error('Not allowed by CORS'));
    }
  }
}));


// --- เพิ่ม: การตั้งค่าให้ Express เชื่อถือ Reverse Proxy ---
// หาก Node.js server ของคุณทำงานอยู่หลัง reverse proxy (เช่น Nginx)
// การตั้งค่านี้จะช่วยให้ Express ใช้ IP address จาก X-Forwarded-For header
// ซึ่งสำคัญสำหรับ rate limiting และ logging ให้ถูกต้อง
app.set('trust proxy', 1); // '1' หมายถึงเชื่อถือ hop แรก (ตัว reverse proxy ที่อยู่ใกล้ที่สุด)

// Middleware สำหรับการ Parse JSON Body
app.use(express.json());

// --- เพิ่ม: การตั้งค่า Rate Limiting ---
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 นาที
    max: 100, // จำกัดแต่ละ IP ให้เรียกได้ 100 ครั้งต่อ 15 นาที
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: { error: 'Too many requests from this IP, please try again after 15 minutes' }
});
app.use('/generate-content', apiLimiter); // ใช้ limiter กับ endpoint นี้

// --- เพิ่ม: การตั้งค่า Logging ด้วย Morgan ---
// สร้าง write stream (ในโหมด append) สำหรับไฟล์ access.log
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' });

// ใช้ morgan middleware เพื่อบันทึก HTTP requests ลงในไฟล์
// 'combined' format จะรวมถึง IP address ของผู้ใช้
app.use(morgan('combined', { stream: accessLogStream }));

// (Optional) คุณสามารถเพิ่ม morgan สำหรับแสดง Log ใน console ระหว่างการพัฒนาได้ด้วย
// app.use(morgan('dev'));
// --- จบ: การตั้งค่า Logging ---

// --- Initialize AI Clients ---
let genAI, deepseekAI;

if (GEMINI_API_KEY) {
    try {
        genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    } catch (error) {
        console.error("Error initializing GoogleGenerativeAI client:", error.message);
        genAI = null; // Ensure it's null if initialization fails
    }
}
if (DEEPSEEK_API_KEY) {
    deepseekAI = new OpenAI({ apiKey: DEEPSEEK_API_KEY, baseURL: 'https://api.deepseek.com/v1' });
}

// สร้าง API Endpoint สำหรับเรียก Gemini
app.post('/generate-content', async (req, res) => {
    const { prompt, model: selectedModel } = req.body; // รับ prompt และ model จาก Frontend

    if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required.' });
    }

    try {
        let generatedText = '';

        if (selectedModel.startsWith('gemini-')) {
            if (!genAI) {
                console.error('Attempted to use Gemini model, but Gemini AI client is not initialized.');
                return res.status(500).json({ error: 'Gemini AI client not initialized. Please check server logs and GEMINI_API_KEY.' });
            }
            // The selectedModel from frontend (e.g., "gemini-1.5-flash-latest") is used directly.
            const model = genAI.getGenerativeModel({ model: selectedModel });
            const result = await model.generateContent(prompt);
            const response = await result.response;
            generatedText = response.text();

        } else if (selectedModel.startsWith('deepseek-')) {
            if (!deepseekAI) {
                console.error('Attempted to use DeepSeek model, but DeepSeek AI client is not initialized.');
                return res.status(500).json({ error: 'DeepSeek AI client not initialized. Check DEEPSEEK_API_KEY.' });
            }
            // The `selectedModel` from frontend (e.g., "deepseek-coder") is used directly
            // as the model identifier for the DeepSeek API.
            const completion = await deepseekAI.chat.completions.create({
                model: selectedModel,
                messages: [{ role: "user", content: prompt }],
                // max_tokens: 1024, // Optional: configure as needed
                // stream: false, // Set to true if you want to handle streaming
            });
            generatedText = completion.choices[0].message.content;

        } else {
            return res.status(400).json({ error: `Unsupported model: ${selectedModel}` });
        }

        res.json({ text: generatedText }); // ส่งข้อความกลับไปให้ Frontend

    } catch (error) {
        // Log the full error for server-side debugging, including stack trace
        console.error(`Error processing request for model ${selectedModel}. Prompt: "${prompt.substring(0,100)}..."`, error.stack || error);

        let errorMessage = `Internal Server Error: ${error.message}`;
        if (error.response && error.response.data && error.response.data.error && error.response.data.error.message) {
            errorMessage = `AI API Error: ${error.response.data.error.message}`;
        }
        res.status(500).json({ error: "An error occurred while processing your request with the AI model." });
    }
});

    // เพิ่ม: Health Check Endpoint
    app.get('/health', (req, res) => {
      res.status(200).json({ status: 'ok', message: 'Backend is running!', timestamp: new Date().toISOString() });
    });

// กำหนด Host ที่จะให้ Server รับฟัง (0.0.0.0 หมายถึงทุก IPv4 interfaces)
const HOST = '0.0.0.0';
// เริ่มต้น Server
app.listen(PORT, HOST, () => { // เพิ่ม HOST ตรงนี้
    console.log(`Backend server running on http://${HOST}:${PORT}`); // ปรับปรุงข้อความ log ให้ชัดเจนขึ้น
    console.log(`Access logs will be written to ${path.join(__dirname, 'access.log')}`);
});
