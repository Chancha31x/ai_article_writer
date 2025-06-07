# ai_article_writer
# คำถามที่พบบ่อย (FAQ) - AI Content Buddy 🌟

ยินดีต้อนรับสู่ส่วนคำถามที่พบบ่อยสำหรับ **AI Content Buddy**!
ที่นี่เราได้รวบรวมคำตอบสำหรับคำถามทั่วไปที่คุณอาจมีเกี่ยวกับการติดตั้ง การใช้งาน และการมีส่วนร่วมกับโปรเจกต์ของเรา

---

## 📜 ทั่วไป (General)

<details>
<summary><strong>Q: AI Content Buddy คืออะไร?</strong></summary>
<br>
A: AI Content Buddy คือ <em>เครื่องมือช่วยสร้างสรรค์เนื้อหาและบทความด้วย AI ที่จะช่วยให้คุณสร้างเนื้อหาคุณภาพสูงได้อย่างรวดเร็วและง่ายดาย รองรับการทำงานร่วมกับโมเดล AI ชั้นนำอย่าง Gemini และ DeepSeek</em>
</details>

<details>
<summary><strong>Q: โปรเจกต์นี้มีฟีเจอร์หลักอะไรบ้าง?</strong></summary>
<br>
A:
<ul>
    <li><strong>การสร้างเนื้อหาจาก Prompt:</strong> ป้อนคำสั่งหรือหัวข้อเพื่อให้ AI สร้างบทความหรือเนื้อหาตามต้องการ</li>
    <li><strong>เลือกโมเดล AI:</strong> สามารถเลือกใช้งานระหว่าง Gemini Flash และ DeepSeek Coder</li>
    <li><strong>เครื่องมือช่วยปรับแต่งเนื้อหา:</strong> ย่อเนื้อหา, ขยายเนื้อหา, ปรับโทนภาษา (ทางการ/เป็นกันเอง)</li>
    <li><strong>Prompt Templates:</strong> มีตัวอย่าง Prompt เริ่มต้นหลากหลายรูปแบบ และสามารถบันทึก Prompt ที่ใช้บ่อยได้</li>
    <li><strong>ประวัติการใช้งาน:</strong> ดูและโหลดประวัติการสร้างเนื้อหาที่ผ่านมาได้</li>
</ul>
</details>

<details>
<summary><strong>Q: โปรเจกต์นี้ช่วยแก้ปัญหาอะไร?</strong></summary>
<br>
A: <em>ช่วยลดเวลาและความยุ่งยากในการสร้างสรรค์เนื้อหาคุณภาพสูง ทำให้ผู้ใช้สามารถผลิตบทความ, Q&A, หรือเนื้อหาตามรูปแบบที่ต้องการได้อย่างรวดเร็วและมีประสิทธิภาพมากขึ้น</em>
</details>

<details>
<summary><strong>Q: โปรเจกต์นี้เหมาะกับใคร?</strong></summary>
<br>
A: <em>นักการตลาด, บล็อกเกอร์, นักเขียนคอนเทนต์, ผู้ดูแลเว็บไซต์, นักเรียนนักศึกษา, หรือใครก็ตามที่ต้องการเครื่องมือช่วยในการสร้างเนื้อหาที่ขับเคลื่อนด้วย AI</em>
</details>

---

## ⚙️ การติดตั้งและตั้งค่า (Installation & Setup)
<details>
<summary><strong>Q: ฉันต้องมีอะไรบ้างก่อนติดตั้ง? (Prerequisites)</strong></summary>
<br>
A: ก่อนเริ่มการติดตั้ง โปรดตรวจสอบให้แน่ใจว่าคุณมี:
<ul>
    <li><strong>Node.js:</strong> เวอร์ชั่น 18.x ขึ้นไป (สำหรับรัน Backend Server)</li>
    <li><strong>npm:</strong> (มาพร้อมกับ Node.js) สำหรับจัดการ Dependencies</li>
    <li><strong>API Keys:</strong>
        <ul>
            <li>Gemini API Key จาก Google AI Studio</li>
            <li>DeepSeek API Key จาก DeepSeek Platform</li>
        </ul>
    </li>
    <li><strong>Git:</strong> (แนะนำ) สำหรับ Clone โปรเจกต์</li>
    <li><strong>PM2:</strong> (แนะนำ) สำหรับรัน Backend Server ในระยะยาว (ติดตั้งด้วย <code>sudo npm install pm2 -g</code>)</li>
</ul>
คุณสามารถดูรายละเอียดเพิ่มเติมได้ในไฟล์ <code>RUN_INSTRUCTIONS.md</code>
</details>

<details>
<summary><strong>Q: ฉันจะติดตั้ง AI Content Buddy ได้อย่างไร?</strong></summary>
<br>
A: ทำตามขั้นตอนต่อไปนี้:
<ol>
    <li><strong>Clone Repository (ถ้ามี):</strong> <pre><code>git clone [URL ของ Repository]</code></pre></li>
    <li><strong>ตั้งค่า Backend Server (ในไดเรกทอรี <code>ai-backend</code>):</strong>
        <ol>
            <li>เข้าไปที่ไดเรกทอรี: <pre><code>cd path/to/ai_article_writer/ai-backend</code></pre></li>
            <li>สร้างไฟล์ <code>.env</code> และใส่ API Keys ของคุณ (ดูหัวข้อถัดไป)</li>
            <li>ติดตั้ง Dependencies: <pre><code>npm install</code></pre></li>
            <li>รัน Server ด้วย PM2: <pre><code>pm2 start server.js --name "ai-backend-app"</code></pre> (หรือ <code>node server.js</code> สำหรับการพัฒนา)</li>
        </ol>
    </li>
    <li><strong>เปิด Frontend:</strong>
        <ol>
            <li>แก้ไขตัวแปร <code>BACKEND_API_URL</code> ในไฟล์ <code>script.js</code> (ในไดเรกทอรี <code>ai_article_writer</code>) ให้ชี้ไปยัง Backend Server ของคุณ (เช่น <code>http://localhost:3001/generate-content</code>)</li>
            <li>เปิดไฟล์ <code>index.html</code> (ในไดเรกทอรี <code>ai_article_writer</code>) ด้วยเว็บเบราว์เซอร์</li>
        </ol>
    </li>
</ol>
สำหรับคำแนะนำโดยละเอียด โปรดดูไฟล์ <code>RUN_INSTRUCTIONS.md</code>
</details>

<details>
<summary><strong>Q: ฉันต้องตั้งค่า Environment Variables อะไรบ้าง?</strong></summary>
<br>
A: คุณจำเป็นต้องสร้างไฟล์ <code>.env</code> ในไดเรกทอรี <code>ai-backend</code> และกำหนดค่าตัวแปรต่อไปนี้:
<pre><code># ตัวอย่าง .env ใน ai-backend/
GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
DEEPSEEK_API_KEY=YOUR_DEEPSEEK_API_KEY_HERE
PORT=3001
</code></pre>
<ul>
    <li><code>GEMINI_API_KEY</code>: API Key ของคุณจาก Google AI Studio สำหรับใช้งานโมเดล Gemini</li>
    <li><code>DEEPSEEK_API_KEY</code>: API Key ของคุณจาก DeepSeek Platform สำหรับใช้งานโมเดล DeepSeek</li>
    <li><code>PORT</code>: Port ที่ Backend Server จะทำงาน (ค่าเริ่มต้นคือ 3001)</li>
</ul>
</details>

---

## 🚀 การใช้งาน (Usage)

<details>
<summary><strong>Q: ฉันจะเริ่มใช้งาน AI Content Buddy ได้อย่างไร?</strong></summary>
<br>
A: หลังจากติดตั้งและตั้งค่า Backend Server และ Frontend เรียบร้อยแล้ว:
<ol>
    <li>ตรวจสอบให้แน่ใจว่า Backend Server (<code>ai-backend-app</code>) กำลังทำงาน (<code>pm2 list</code>)</li>
    <li>เปิดไฟล์ <code>index.html</code> ในเว็บเบราว์เซอร์ของคุณ</li>
    <li>ป้อน Prompt หรือเลือกจากตัวอย่าง, เลือกโมเดล AI, แล้วคลิก "สร้างเนื้อหา"</li>
</ol>
</details>

<details>
<summary><strong>Q: มีตัวอย่างการใช้งานง่ายๆ ไหม?</strong></summary>
<br>
A: แน่นอนครับ!
<ol>
    <li>เปิด AI Content Buddy ในเบราว์เซอร์</li>
    <li>ในช่อง "ใส่หัวข้อ, คำถาม, หรือคำสั่งของคุณที่นี่..." พิมพ์ว่า: <code>เขียนบทความ SEO เกี่ยวกับ ประโยชน์ของการทำสมาธิ</code></li>
    <li>เลือกโมเดล AI ที่ต้องการ (เช่น Gemini Flash)</li>
    <li>คลิกปุ่ม "สร้างเนื้อหา"</li>
    <li>รอสักครู่ เนื้อหาที่ AI สร้างจะปรากฏในกล่อง "ผลลัพธ์จาก AI"</li>
</ol>
คุณสามารถลองใช้ "ตัวอย่าง Prompt เริ่มต้น" ที่มีให้เพื่อดูแนวทางการใช้งานอื่นๆ ได้ครับ
</details>

---

## 🧑‍💻 การพัฒนาและการมีส่วนร่วม (Development & Contribution)

<details>
<summary><strong>Q: ฉันจะช่วยพัฒนาโปรเจกต์นี้ได้อย่างไร?</strong></summary>
<br>
A: เรายินดีต้อนรับทุกการมีส่วนร่วม! คุณสามารถช่วยเราได้โดย:
<ul>
    <li>รายงานบั๊กหรือเสนอแนะฟีเจอร์ใหม่ผ่านทาง <a href="https://github.com/chancharitsak/ai_article_writer/issues">GitHub Issues</a> ของโปรเจกต์</li>
    <li>Fork โปรเจกต์และส่ง Pull Request พร้อมการปรับปรุงหรือฟีเจอร์ใหม่ๆ ของคุณ</li>
    <li>ช่วยปรับปรุงเอกสาร (เช่น README นี้ หรือเอกสารอื่นๆ)</li>
</ul>
โปรดอ่าน <a href="CONTRIBUTING.md">แนวทางการมีส่วนร่วม (Contributing Guidelines)</a> (ถ้ามี) ของเราก่อนเริ่ม
</details>

<details>
<summary><strong>Q: ฉันจะตั้งค่าสภาพแวดล้อมสำหรับการพัฒนา (Development Environment) ได้อย่างไร?</strong></summary>
<br>
A: <em>(ส่วนนี้สามารถเพิ่มเติมรายละเอียดได้ เช่น การใช้ `npm run dev` สำหรับ backend ถ้ามีการตั้งค่า nodemon)</em>
<ol>
    <li>ทำตามขั้นตอนการติดตั้งปกติ</li>
    <li>สำหรับ Backend (ในไดเรกทอรี <code>ai-backend</code>) คุณสามารถรัน <code>npm run dev</code> (ถ้ามีใน <code>package.json</code> และติดตั้ง <code>nodemon</code> แล้ว) เพื่อให้เซิร์ฟเวอร์รีสตาร์ทอัตโนมัติเมื่อมีการแก้ไขโค้ด หรือรัน <code>node server.js</code> โดยตรง</li>
    <li>สำหรับ Frontend ให้เปิด <code>index.html</code> และแก้ไขไฟล์ <code>script.js</code> หรือ <code>style.css</code> ได้ตามต้องการ จากนั้นรีเฟรชเบราว์เซอร์เพื่อดูการเปลี่ยนแปลง</li>
</ol>
</details>
<details>
<summary><strong>Q: โครงสร้างของโปรเจกต์เป็นอย่างไร?</strong></summary>
<br>
A: โครงสร้างหลักของโปรเจกต์มีดังนี้:
<pre><code>
ai_article_writer/ (Root Directory)
├── ai-backend/         # ส่วน Backend Server (Node.js)
│   ├── .env            # (ไฟล์นี้คุณต้องสร้างเอง) เก็บ API Keys และ Port
│   ├── .gitignore      # ไฟล์ที่ Git จะไม่ติดตามในส่วน Backend
│   ├── access.log      # ไฟล์ Log การเข้าถึง (ถ้ามี)
│   ├── package.json    # กำหนด Dependencies และ Scripts ของ Backend
│   ├── package-lock.json
│   └── server.js       # โค้ดหลักของ Backend Server
├── index.html          # ไฟล์หลักของ Frontend
├── script.js           # JavaScript หลักของ Frontend
├── style.css           # CSS สำหรับ Frontend
├── README.md           # (ไฟล์นี้) คำถามที่พบบ่อยและข้อมูลโปรเจกต์
└── RUN_INSTRUCTIONS.md # คำแนะนำในการรันโปรเจกต์โดยละเอียด
</code></pre>
</details>

---

## 🛠️ การแก้ไขปัญหา (Troubleshooting)

<details>
<summary><strong>Q: ฉันพบปัญหา [<em>ระบุปัญหาทั่วไปที่อาจเกิดขึ้น เช่น "การเชื่อมต่อ API ล้มเหลว" หรือ "ไม่สามารถติดตั้ง dependencies ได้"</em>] ฉันควรทำอย่างไร?</strong></summary>
<br>
A:
<ul>
    <li><strong>ตรวจสอบการตั้งค่า Backend:</strong> ให้แน่ใจว่าคุณได้สร้างไฟล์ <code>ai-backend/.env</code> และใส่ <code>GEMINI_API_KEY</code> และ <code>DEEPSEEK_API_KEY</code> ที่ถูกต้องแล้ว</li>
    <li><strong>ตรวจสอบว่า Backend Server ทำงานอยู่:</strong> ใช้คำสั่ง <code>pm2 list</code> เพื่อดูสถานะของ <code>ai-backend-app</code> (ควรจะเป็น <code>online</code>)</li>
    <li><strong>ดู Log ของ Backend:</strong> ใช้คำสั่ง <code>pm2 logs ai-backend-app</code> เพื่อหาข้อความ error ที่อาจช่วยชี้เบาะแส</li>
    <li><strong>ตรวจสอบ <code>BACKEND_API_URL</code> ใน <code>script.js</code>:</strong> ให้แน่ใจว่า URL ชี้ไปยัง Backend Server ของคุณอย่างถูกต้อง (เช่น <code>http://localhost:3001/generate-content</code> สำหรับการทดสอบบนเครื่อง, หรือ URL จาก ngrok/deployed server)</li>
    <li><strong>ตรวจสอบ Developer Console ในเบราว์เซอร์:</strong> เปิด Developer Tools (F12) แล้วดูแท็บ "Console" และ "Network" เพื่อหา error message เพิ่มเติม</li>
    <li><strong>ค้นหาใน Issues:</strong> ลองค้นหาปัญหาที่คล้ายกันใน <a href="https://github.com/chancharitsak/ai_article_writer/issues">GitHub Issues</a> ของโปรเจกต์</li>
    <li><strong>อัปเดต Dependencies:</strong> ลองอัปเดต dependencies ของโปรเจกต์เป็นเวอร์ชันล่าสุด (<code>npm update</code> ในไดเรกทอรี <code>ai-backend</code>)</li>
    <li>หากยังแก้ไขไม่ได้ โปรด <a href="https://github.com/chancharitsak/ai_article_writer/issues/new">เปิด Issue ใหม่</a> พร้อมรายละเอียดของปัญหา, ขั้นตอนการทำให้เกิดปัญหาซ้ำ (steps to reproduce), และข้อความ error ที่คุณได้รับ</li>
</ul>
</details>

<details>
<summary><strong>Q: ฉันจะหาไฟล์ Log ได้จากที่ไหน?</strong></summary>
<br>
A: สำหรับ Backend Server:
<ul>
    <li><strong>PM2 Logs:</strong> ใช้คำสั่ง <code>pm2 logs ai-backend-app</code> เพื่อดู log แบบ real-time และ log ที่บันทึกไว้ (โดยทั่วไปจะอยู่ใน <code>~/.pm2/logs/</code>)</li>
    <li><strong>Access Log:</strong> ไฟล์ <code>ai-backend/access.log</code> จะบันทึก HTTP requests ที่เข้ามา (ถ้า Morgan ถูกตั้งค่าให้เขียนลงไฟล์)</li>
</ul>
</details>

---

หากคุณมีคำถามอื่นๆ ที่ไม่ได้อยู่ในนี้ โปรดอย่าลังเลที่จะ เปิด Issue ใหม่ หรือติดต่อเราผ่าน Telegram https://t.me/chancha31x
เราหวังว่า FAQ นี้จะเป็นประโยชน์กับคุณ!
