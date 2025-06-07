// server.js
require('dotenv').config(); // โหลด environment variables จาก .env
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { OpenAI } = require('openai'); // OpenAI SDK is used for DeepSeek (OpenAI-compatible API)
const morgan = require('morgan'); // <--- เพิ่ม: import morgan
const path = require('path');     // <--- เพิ่ม: import path
const fs = require('fs');         // <--- เพิ่ม: import fs

const app = express();
const PORT = process.env.PORT || 3001; // Port ที่เซิร์ฟเวอร์จะรัน

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

// ตั้งค่า CORS เพื่อให้ Frontend เรียกได้
// สำหรับการพัฒนา: อนุญาตทุกโดเมน
// สำหรับการผลิต: กำหนดโดเมนของ Frontend ที่แน่นอน
app.use(cors()); 

// Middleware สำหรับการ Parse JSON Body
app.use(express.json());

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
        // Log the full error for server-side debugging
        console.error(`Error processing request for model ${selectedModel}. Prompt: "${prompt.substring(0,100)}..."`, error.stack || error);

        let errorMessage = `Internal Server Error: ${error.message}`;
        if (error.response && error.response.data && error.response.data.error && error.response.data.error.message) {
            errorMessage = `AI API Error: ${error.response.data.error.message}`;
        } // Send a more generic error message to the client for security
        res.status(500).json({ error: "An error occurred while processing your request with the AI model." });
    }
});

// กำหนด Host ที่จะให้ Server รับฟัง (0.0.0.0 หมายถึงทุก IPv4 interfaces)
const HOST = '0.0.0.0';
// เริ่มต้น Server
app.listen(PORT, HOST, () => {
    console.log(`Backend server running on http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT} (accessible on all network interfaces)`);
    console.log(`Access logs will be written to ${path.join(__dirname, 'access.log')}`); // <--- เพิ่ม: แจ้งตำแหน่งไฟล์ Log
});
