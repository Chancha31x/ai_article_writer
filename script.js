document.addEventListener('DOMContentLoaded', () => {
    // --- 1. Cache DOM Elements ---
    const elements = {
        container: document.querySelector('.container'),
        promptTemplatesGrid: document.getElementById('promptTemplatesGrid'), // For predefined templates
        promptInput: document.getElementById('promptInput'),
        aiModelSelect: document.getElementById('aiModel'),
        generateBtn: document.getElementById('generateBtn'),
        loadingIndicator: document.getElementById('loadingIndicator'),
        resultOutput: document.getElementById('resultOutput'),
        contentTools: document.getElementById('contentTools'),
        summarizeBtn: document.getElementById('summarizeBtn'),
        expandBtn: document.getElementById('expandBtn'),
        toneProfessionalBtn: document.getElementById('toneProfessionalBtn'),
        toneCasualBtn: document.getElementById('toneCasualBtn'),
        copyBtn: document.getElementById('copyBtn'),
        toastContainer: document.getElementById('toastContainer'),
        searchHistory: document.getElementById('searchHistory'),
        clearHistoryBtn: document.getElementById('clearHistoryBtn'),
        saveCustomPromptBtn: document.getElementById('saveCustomPromptBtn'),
        // Elements for "My Saved Prompts" section
        mySavedPromptsList: document.getElementById('mySavedPromptsList'),
        clearMySavedPromptsBtn: document.getElementById('clearMySavedPromptsBtn'),
        exportMySavedPromptsBtn: document.getElementById('exportMySavedPromptsBtn')
    };
    // เพิ่ม element สำหรับปีปัจจุบันใน footer
    elements.currentYearSpan = document.getElementById('currentYear');

    // ** สำคัญมาก: กำหนด URL ของ Backend Server ของคุณที่นี่ **
    // ** API Key ของ Gemini จะถูกเก็บไว้ที่ Backend Server **
    const BACKEND_API_URL = 'https://4bac-49-237-45-59.ngrok-free.app/generate-content'; // <--- อัปเดตเป็น HTTPS และ IP ของ Ubuntu Server (Port 443 เป็น default ไม่ต้องระบุ)
    // --- Global Variables ---
    let currentGeneratedText = '';
    const HISTORY_KEY = 'aiContentHistory';
    const CUSTOM_PROMPTS_KEY = 'aiCustomPrompts'; // Key สำหรับเก็บ Prompt ที่กำหนดเอง
    let history = [];
    let customPrompts = []; // Array สำหรับเก็บ Prompt ที่กำหนดเอง

    // --- 2. Helper Functions for UI ---

    function showToast(message, type) {
        if (!elements.toastContainer) return; // ป้องกัน error ถ้า toastContainer ไม่มีอยู่
        const toast = document.createElement('div');
        toast.classList.add('toast-message', type);
        toast.setAttribute('role', type === 'error' ? 'alert' : 'status'); // Accessibility improvement
        let icon = '';
        if (type === 'success') {
            icon = '<i class="fas fa-check-circle"></i>';
        } else if (type === 'error') {
            icon = '<i class="fas fa-times-circle"></i>';
        } else if (type === 'info') {
            icon = '<i class="fas fa-info-circle"></i>';
        }
        toast.innerHTML = `${icon} <span>${message}</span>`;
        elements.toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            toast.addEventListener('transitionend', () => toast.remove());
        }, 3000);
    }

    function toggleLoadingState(isLoading) {
        if (isLoading) {
            if (elements.loadingIndicator) elements.loadingIndicator.style.display = 'block';
            if (elements.generateBtn) {
                elements.generateBtn.disabled = true;
                elements.generateBtn.classList.add('loading');
            }
            if (elements.resultOutput) elements.resultOutput.innerHTML = '<p class="placeholder-text">กำลังคิดอยู่แป๊บ... โปรดรอสักครู่ ✨</p>';
            if (elements.copyBtn) elements.copyBtn.style.display = 'none';
            if (elements.contentTools) elements.contentTools.style.display = 'none';
        } else {
            if (elements.loadingIndicator) elements.loadingIndicator.style.display = 'none';
            if (elements.generateBtn) {
                elements.generateBtn.disabled = false;
                elements.generateBtn.classList.remove('loading');
            }
            if (currentGeneratedText && elements.copyBtn) { // ตรวจสอบ copyBtn ด้วย
                if (elements.contentTools) elements.contentTools.style.display = 'flex';
                elements.copyBtn.style.display = 'block';
            } else {
                if (elements.copyBtn) elements.copyBtn.style.display = 'none';
                if (elements.contentTools) elements.contentTools.style.display = 'none';
            }
        }
    }

    function displayTypewriterEffect(markdownText) {
        currentGeneratedText = markdownText; // เก็บ text ที่สร้างล่าสุด (เป็น Markdown)
        if (elements.resultOutput) {
            elements.resultOutput.innerHTML = ''; // เคลียร์เนื้อหาเก่า
            elements.resultOutput.style.opacity = '0'; // ซ่อนไว้ก่อนเพื่อการแสดงผลที่ราบรื่น
            elements.resultOutput.style.transition = 'opacity 0.5s ease-in';

        console.log('Markdown to parse:', typeof markdownText, markdownText); // เพิ่มบรรทัดนี้เพื่อ debug
            try {
                // ใช้ marked.parse() เพื่อแปลง Markdown เป็น HTML ดิบ
                const rawHtml = marked.parse(markdownText);
                // ใช้ DOMPurify เพื่อ sanitize HTML ก่อนนำไปแสดงผล
                elements.resultOutput.innerHTML = DOMPurify.sanitize(rawHtml);
            } catch (error) {
                console.error("Error parsing Markdown:", error);
                elements.resultOutput.innerHTML = "<p style='color:red;'>เกิดข้อผิดพลาดในการแสดงผล Markdown</p>";
            }
            elements.resultOutput.style.opacity = '1';
        }
        if (elements.contentTools) elements.contentTools.style.display = 'flex';
        if (elements.copyBtn) elements.copyBtn.style.display = 'block';
    }

    // --- 3. History Management Functions ---
    function saveHistory() {
        try {
            localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
        } catch (error) {
            console.error("Error saving history to localStorage:", error);
            showToast("ไม่สามารถบันทึกประวัติได้", "error");
        }
        renderHistory();
        toggleClearHistoryButton();
    }

    function loadHistory() {
        try {
            const storedHistory = localStorage.getItem(HISTORY_KEY);
            if (storedHistory) {
                history = JSON.parse(storedHistory);
            }
        } catch (error) {
            console.error("Error loading history from localStorage:", error);
            history = []; // Reset history on error
        }
        renderHistory(); // Always render, even if empty or error
        toggleClearHistoryButton();
    }

    function addPromptToHistory(prompt, response, model) {
        const timestamp = new Date().toLocaleString('th-TH', { 
            year: 'numeric', month: 'numeric', day: 'numeric', 
            hour: '2-digit', minute: '2-digit' 
        });
        history.unshift({ prompt, response, model, timestamp });
        if (history.length > 10) {
            history.pop();
        }
        saveHistory();
    }

    function renderHistory() {
        if (!elements.searchHistory) return;
        elements.searchHistory.innerHTML = '';
        if (history.length === 0) {
            elements.searchHistory.innerHTML = '<p class="placeholder-text">ยังไม่มีประวัติการสร้างเนื้อหา...</p>';
            toggleClearHistoryButton();
            return;
        }

        history.forEach((item, index) => {
            const historyItem = document.createElement('div');
            historyItem.classList.add('history-item');
            // --- ปรับปรุงการแสดงผล ---
            historyItem.innerHTML = `
                <div class="history-item-header">
                    <span class="history-prompt-preview"><strong>คำสั่ง:</strong> ${item.prompt.substring(0, 100)}${item.prompt.length > 100 ? '...' : ''}</span>
                    <span class="history-model-used"><strong>โมเดล:</strong> ${item.model}</span>
                </div>
                <div class="history-item-body">
                    <p class="history-response-preview"><strong>ผลลัพธ์ (ตัวอย่าง):</strong> ${item.response.substring(0, 120)}...</p>
                </div>
                <div class="history-item-footer">
                    <span class="history-timestamp">${item.timestamp}</span>
                </div>
            `;
            // --- สิ้นสุดการปรับปรุง ---
            historyItem.dataset.index = index;
            elements.searchHistory.appendChild(historyItem);
        });
        toggleClearHistoryButton();
    }

    function clearHistory() {
        if (confirm('คุณแน่ใจหรือไม่ว่าต้องการล้างประวัติทั้งหมด?')) {
            history = []; // Clear the array
            saveHistory();
            showToast('ล้างประวัติเรียบร้อยแล้ว!', 'info');
        }
    }

    function toggleClearHistoryButton() {
        if (elements.clearHistoryBtn) {
            elements.clearHistoryBtn.style.display = history.length > 0 ? 'block' : 'none';
        }
    }

    // --- 4. Predefined Prompt Templates ---
    const promptTemplates = [
        // *** ตัวอย่าง Prompt ที่ปรับปรุงแล้ว เพื่อให้ AI สร้าง Markdown และโครงสร้างละเอียดตามตัวอย่าง ***
        { name: "บทความ AEO (ตอบตรง)", prompt: `สร้างบทความแบบ Answer Engine Optimization (AEO) เกี่ยวกับ [หัวข้อ] ให้มีเนื้อหาประมาณ 600 คำ จัดโครงสร้างในรูปแบบ Markdown ที่แปลงเป็น HTML แล้วมีการใช้ H2, p, strong, ul, li เหมือนบทความจริง **และต้องมีส่วนคำถามที่พบบ่อย (FAQs) รวมถึงย่อหน้าสรุปที่ชัดเจนในตอนท้าย**:

## [H2: ชื่อบทความที่น่าสนใจและตอบคำถามหลักทันที]

[ย่อหน้าแรก (p): บทนำที่กระชับและน่าสนใจ โดยตอบคำถามหลักของหัวข้อโดยตรง (direct answer) และใช้ **ตัวหนา** เน้นคำสำคัญ] 

### คำถามหลักที่พบบ่อย (FAQs) - **ส่วนนี้ต้องมีและเป็นคำถามที่พบบ่อยเกี่ยวกับหัวข้อโดยตรง**
- **คำถาม 1:** [ตอบคำถามโดยตรงและกระชับในรูปแบบ p หรือ ul/li]
- **คำถาม 2:** [ตอบคำถามโดยตรงและกระชับในรูปแบบ p หรือ ul/li]
- **คำถาม 3:** [ตอบคำถามโดยตรงและกระชับในรูปแบบ p หรือ ul/li]
- **คำถาม 4:** [ตอบคำถามโดยตรงและกระชับในรูปแบบ p หรือ ul/li]

## [H2: หัวข้อหลักที่ 1: ขยายความและข้อมูลเชิงลึก]
[ย่อหน้า (p): ขยายความประเด็นแรก และใช้ **ตัวหนา** เน้นข้อมูลสำคัญ]
- [li: ประเด็นย่อย 1 พร้อมข้อมูลสนับสนุน/สถิติ (ถ้ามี)]
- [li: ประเด็นย่อย 2 พร้อมรายละเอียดเพิ่มเติม]

## [H2: หัวข้อหลักที่ 2: ประสบการณ์และความน่าเชื่อถือ]
[ย่อหน้า (p): อธิบายประเด็นที่สอง และใช้ **ตัวหนา** เน้นความสำคัญ]
- [li: ประเด็นย่อย 1 ที่แสดงถึงประสบการณ์จริงหรือกรณีศึกษา]
- [li: ประเด็นย่อย 2 ที่บ่งชี้ถึงความน่าเชื่อถือของแหล่งข้อมูลหรือผู้เขียน]

[ย่อหน้า (p): **ต้องมีส่วนสรุป**: บทสรุปที่กระชับและเชิญชวนผู้อ่าน หรือสรุปใจความสำคัญของบทความ **เป็นย่อหน้าสุดท้ายของบทความ**]

**หมายเหตุ:**
- เน้นการตอบคำถามโดยตรงในส่วนนำและ FAQ
- ใช้ภาษาที่เป็นธรรมชาติ เข้าใจง่าย เพื่อให้เหมาะกับการแสดงผลบน Answer Engine
- ตรวจสอบให้แน่ใจว่ามีการใช้ **ตัวหนา** ในย่อหน้าและรายการเพื่อเน้นย้ำ
- โครงสร้างที่สร้างควรคล้ายกับตัวอย่าง HTML ที่มนุษย์เขียน` },

        { name: "บทความเชิงลึก (พร้อม Research)", prompt: `เขียนบทความเชิงลึกและครอบคลุมเกี่ยวกับ [หัวข้อ] ให้มีเนื้อหาประมาณ 600 คำ โดยเน้นความลึกของเนื้อหา, การแสดงข้อมูลสนับสนุนจากงานวิจัย, สถิติ, หรือแหล่งข้อมูลที่น่าเชื่อถือ (ถ้ามี) จัดโครงสร้างในรูปแบบ Markdown ที่แปลงเป็น HTML แล้วมีการใช้ H2, H3, p, strong, ul, li เหมือนบทความจริง **และต้องมีย่อหน้าสรุปที่ชัดเจนในตอนท้าย**:

## [H2: ชื่อบทความ]

[ย่อหน้า (p): บทนำที่ให้ภาพรวมและชี้ให้เห็นถึงความสำคัญของหัวข้อ และใช้ **ตัวหนา** เน้นคำสำคัญ]

## [H2: หัวข้อหลัก 1: ข้อมูลพื้นฐานและแนวคิด]
[ย่อหน้า (p): อธิบายภาพรวมของหัวข้อนี้ และใช้ **ตัวหนา** เน้นประเด็นสำคัญ]
### [H3: หัวข้อย่อย 1.1: อธิบายแนวคิด]
- [li: ข้อมูล 1.1.1 พร้อมรายละเอียด]
- [li: ข้อมูล 1.1.2 พร้อมรายละเอียดเพิ่มเติม]
### [H3: หัวข้อย่อย 1.2: ข้อมูลเชิงสถิติ/ผลการวิจัย]
- [li: สถิติ/ผลการวิจัยที่เกี่ยวข้อง (ระบุแหล่งที่มาถ้าเป็นไปได้) ใช้ **ตัวหนา** เน้นตัวเลขหรือผลลัพธ์สำคัญ]
- [li: การตีความผลลัพธ์]

## [H2: หัวข้อหลัก 2: การประยุกต์ใช้/กรณีศึกษา]
[ย่อหน้า (p): อธิบายการประยุกต์ใช้ หรือยกตัวอย่างกรณีศึกษา และใช้ **ตัวหนา** เน้นข้อสรุป]
- [li: ประเด็น 2.1 พร้อมตัวอย่างการนำไปใช้จริง]
- [li: ประเด็น 2.2 พร้อมกรณีศึกษาที่น่าสนใจ]

[ย่อหน้า (p): **ต้องมีส่วนสรุป**: บทสรุปที่กระตุ้นความคิดหรือชี้แนวทางในอนาคต **เป็นย่อหน้าสุดท้ายของบทความ**]

**หมายเหตุ:**
- ตรวจสอบให้แน่ใจว่ามีการใช้ **ตัวหนา** ในย่อหน้าและรายการเพื่อเน้นย้ำ
- โครงสร้างที่สร้างควรคล้ายกับตัวอย่าง HTML ที่มนุษย์เขียน` },
        { name: "Q&A (ละเอียด)", prompt: "สร้างส่วน Q&A สำหรับ [หัวข้อ] โดยมีคำถามที่พบบ่อย 5-7 ข้อ พร้อมคำตอบที่กระชับ ชัดเจน และมีรายละเอียดสำคัญ โดยใช้รูปแบบ '### คำถาม:' และ 'คำตอบ:' และให้คำตอบครอบคลุมประเด็นหลักๆ" },
        { name: "สรุป Research (เจาะลึก)", prompt: "สรุปงานวิจัยล่าสุดเกี่ยวกับ [หัวข้อ] โดยเน้นประเด็นสำคัญ, ระเบียบวิธีวิจัย (ถ้าทราบ), ผลลัพธ์หลัก, และข้อจำกัด/implicaions ของงานวิจัยนั้นๆ โดยจัดโครงสร้างโดยใช้หัวข้อ Markdown (##) และรายการ (-):" },
        { name: "เนื้อหา E-E-A-T (ครบถ้วน)", prompt: `เขียนเนื้อหาเกี่ยวกับ [หัวข้อ] โดยเน้น E-E-A-T (Expertise, Experience, Authoritativeness, และ Trustworthiness) ให้ละเอียดและครอบคลุม มีเนื้อหาประมาณ 600 คำ จัดโครงสร้างในรูปแบบ Markdown ที่แปลงเป็น HTML แล้วมีการใช้ H2, p, strong, ul, li เหมือนบทความจริง **และต้องมีย่อหน้าสรุปที่ชัดเจนในตอนท้าย**:

## [H2: ชื่อบทความที่แสดงถึงความเชี่ยวชาญ]

[ย่อหน้า (p): บทนำที่แสดงถึงความรู้และความเข้าใจอย่างลึกซึ้งในหัวข้อ และใช้ **ตัวหนา** เน้นประเด็นสำคัญ]

## [H2: Expertise (ความเชี่ยวชาญ)]
[ย่อหน้า (p): อธิบายความเชี่ยวชาญ และใช้ **ตัวหนา** เน้น]
* [li: แสดงความรู้เชิงลึกเกี่ยวกับแนวคิด/ทฤษฎีที่เกี่ยวข้อง]
* [li: ระบุศัพท์เฉพาะหรือข้อมูลทางเทคนิคที่ถูกต้อง]

## [H2: Experience (ประสบการณ์)]
[ย่อหน้า (p): อธิบายประสบการณ์ และใช้ **ตัวหนา** เน้น]
* [li: เล่าประสบการณ์จริงหรือกรณีศึกษาที่เกี่ยวข้องกับหัวข้อ]
* [li: ยกตัวอย่างการแก้ปัญหาหรือความท้าทายที่พบเจอ]

## [H2: Authoritativeness (ความน่าเชื่อถือ)]
[ย่อหน้า (p): อธิบายความน่าเชื่อถือ และใช้ **ตัวหนา** เน้น]
* [li: อ้างอิงแหล่งข้อมูลที่น่าเชื่อถือ (งานวิจัย, ผู้เชี่ยวชาญ, สถาบัน)]
* [li: นำเสนอข้อมูลที่ถูกต้องและเป็นกลาง]

## [H2: Trustworthiness (ความน่าไว้วางใจ)]
[ย่อหน้า (p): อธิบายความน่าไว้วางใจ และใช้ **ตัวหนา** เน้น]
* [li: แสดงความโปร่งใสในการนำเสนอข้อมูล]
* [li: หลีกเลี่ยงการกล่าวอ้างเกินจริงหรือชี้นำที่ไม่เหมาะสม]

[ย่อหน้า (p): **ต้องมีส่วนสรุป**: บทสรุปที่ตอกย้ำความน่าเชื่อถือและคุณค่าของเนื้อหา **เป็นย่อหน้าสุดท้ายของบทความ**]

**หมายเหตุ:**
- ตรวจสอบให้แน่ใจว่ามีการใช้ **ตัวหนา** ในย่อหน้าและรายการเพื่อเน้นย้ำ
- โครงสร้างที่สร้างควรคล้ายกับตัวอย่าง HTML ที่มนุษย์เขียน` },

        { name: "บทความ SEO (ครบวงจร)", prompt: `เขียนบทความเกี่ยวกับ [หัวข้อ] ให้มีเนื้อหาประมาณ 600 คำ โดยยึดหลักการทำ SEO อย่างครบวงจร เพื่อให้ติดอันดับการค้นหาและมีคุณภาพสูง จัดโครงสร้างในรูปแบบ Markdown ที่แปลงเป็น HTML แล้วมีการใช้ H1/H2/H3, p, strong, ul, li เหมือนบทความจริง **และต้องมีส่วนคำถามที่พบบ่อย (FAQs) รวมถึงย่อหน้าสรุปที่ชัดเจนในตอนท้าย**:

**คำหลักหลัก (Primary Keyword):** [ระบุคำหลักหลัก]
**คำหลักรอง (Secondary Keywords/LSI):** [ระบุคำหลักรอง 2-3 คำ]

## [H2: ชื่อบทความที่น่าสนใจและมีคำหลักหลัก]

[ย่อหน้า (p): บทนำที่กระชับ ชัดเจน มีคำหลักหลัก และกระตุ้นความสนใจ (ความยาว 2-3 ย่อหน้า) ใช้ **ตัวหนา** เน้นคำสำคัญ]

### [H2: หัวข้อหลักที่ 1 - มีคำหลักหรือคำที่เกี่ยวข้อง]
[ย่อหน้า (p): อธิบายประเด็นนี้ และใช้ **ตัวหนา** เน้น]
- [li: ประเด็นย่อย 1]
- [li: ประเด็นย่อย 2]
- [li: แทรกคำหลักรอง/LSI Keywords อย่างเป็นธรรมชาติ]

### [H2: หัวข้อหลักที่ 2 - มีคำหลักหรือคำที่เกี่ยวข้อง]
[ย่อหน้า (p): อธิบายประเด็นนี้ และใช้ **ตัวหนา** เน้น]
- [li: ประเด็นย่อย 1]
- [li: ประเด็นย่อย 2]
- [li: นำเสนอข้อมูลที่ลึกขึ้นและเป็นประโยชน์]

### [H2: คำถามที่พบบ่อย (FAQs) - **ส่วนนี้ต้องมีและเป็นคำถามที่พบบ่อยเกี่ยวกับหัวข้อโดยตรง**]
- **คำถาม 1:** [ตอบคำถามโดยตรงในรูปแบบ p หรือ ul/li]
- **คำถาม 2:** [ตอบคำถามโดยตรงในรูปแบบ p หรือ ul/li]
- **คำถาม 3:** [ตอบคำถามโดยตรงในรูปแบบ p หรือ ul/li]

[ย่อหน้า (p): **ต้องมีส่วนสรุป**: บทสรุปที่กระตุ้นให้ผู้อ่านดำเนินการ (Call to Action) หรือสรุปใจความสำคัญของบทความ (ความยาว 1-2 ย่อหน้า) **เป็นย่อหน้าสุดท้ายของบทความ**]

**ข้อแนะนำเพิ่มเติมสำหรับบทความ:**
* **ความยาว:** เนื้อหาควรมีความยาวประมาณ 600 คำ
* **ความน่าอ่าน:** ใช้ย่อหน้าสั้นๆ, รายการ, **ตัวหนา** เพื่อเพิ่มความน่าอ่าน
* **เจตนาการค้นหา (Search Intent):** ตอบสนองเจตนาการค้นหาของผู้ใช้
* **E-E-A-T:** แสดงถึงความเชี่ยวชาญ ประสบการณ์ ความน่าเชื่อถือ และความไว้วางใจในเนื้อหา
* **(ไม่ต้องใส่ในบทความ):** คำอธิบาย Meta Description ที่มีคำหลักหลักและน่าสนใจ (ความยาว 150-160 ตัวอักษร)
* **(ไม่ต้องใส่ในบทความ):** การเชื่อมโยงภายใน (Internal Links) และภายนอก (External Links) ไปยังแหล่งข้อมูลที่เกี่ยวข้องและน่าเชื่อถือ (AI จะไม่สร้างลิงก์จริง แต่คุณสามารถเพิ่มได้เองภายหลัง)
* **โครงสร้าง:** โครงสร้างที่สร้างควรคล้ายกับตัวอย่าง HTML ที่มนุษย์เขียน และมีการใช้ **ตัวหนา** เน้นข้อความในย่อหน้าและรายการ` },
        { name: "สร้างหัวข้อ (หลากหลาย)", prompt: "ช่วยคิดหัวข้อบทความ 5-7 หัวข้อเกี่ยวกับ [หัวข้อ] ที่น่าสนใจ มีความหลากหลาย และสามารถนำไปสร้างเนื้อหาเชิงลึกได้ โดยแสดงผลเป็นรายการตัวเลข (1. 2. 3.):" },
        { name: "ปรับปรุงข้อความ (กระชับ/น่าสนใจ)", prompt: "ปรับปรุงข้อความนี้ให้กระชับ, น่าสนใจยิ่งขึ้น, และมีน้ำเสียงที่เหมาะสม โดยคงใจความสำคัญ: [ข้อความ]" }
        // --- เพิ่ม Prompts ใหม่ตามที่ผู้ใช้ร้องขอ ---
        ,
        {
            name: "บุคลิกอัจฉริยะส่วนตัว (Einstein)",
            prompt: `คุณคือนักวิเคราะห์ และนักคิดเชิงสร้างสรรค์ระดับ Einstein ช่วยฉันคิด วิเคราะห์ และเสนอแนวทางที่ลึกซึ้ง ใช้ได้จริง และมีจินตนาการ ตอบแบบมืออาชีพ เข้าใจง่าย และสร้างแรงบันดาลใจ`
        },
        {
            name: "คิดไอเดียนอกกรอบ (5 ไอเดีย)",
            prompt: `ช่วยเสนอ 5 ไอเดียสร้างสรรค์ในหัวข้อ [ใส่หัวข้อ] เน้นความแปลกใหม่ แตกต่าง และใช้งานได้จริง พร้อมอธิบายจุดเด่นของแต่ละไอเดีย`
        },
        {
            name: "อธิบายเรื่องยากให้ง่าย (สอนเพื่อน)",
            prompt: `ช่วยอธิบาย [ใส่หัวข้อ] ให้เข้าใจง่าย เหมือนสอนเพื่อนที่ไม่เคยรู้เรื่องนี้มาก่อน ใช้ภาษาธรรมดา เปรียบเทียบง่าย และไม่เทคนิคจ๋าเกินไป`
        },
        {
            name: "วิเคราะห์แบบมือโปร (SWOT & แนะนำ)",
            prompt: `ช่วยวิเคราะห์ [สถานการณ์หรือข้อมูล] โดยแยกเป็นข้อดี ข้อเสีย โอกาส และทางเลือก เสนอคำแนะนำที่ใช้ได้จริง พร้อมแนวทางต่อยอด`
        },
        {
            name: "เขียนโพสต์ลึกซึ้ง (น่าแชร์ + CTA)",
            prompt: `ช่วยเขียนโพสต์ในหัวข้อ [ใส่หัวข้อ] ให้เนื้อหามีความลึก กระตุ้นการคิด และสร้างแรงบันดาลใจ ใช้ภาษาที่เป็นกันเอง แต่ดูฉลาด พร้อมใส่ Call to Action ท้ายโพสต์`
        },
        {
            name: "ถามคำถามกระตุกต่อมคิด (ปลายเปิด)",
            prompt: `ช่วยตั้งคำถามปลายเปิดในหัวข้อ [ใส่หัวข้อ] คำถามต้องชวนให้คิดลึก เห็นมุมใหม่ และอยากแสดงความเห็น`
        },
        {
            name: "Brainstorm (Einstein + Creator)",
            prompt: `ช่วย Brainstorm ไอเดีย 5 แบบในหัวข้อ [ใส่หัวข้อ] โดยใช้มุมคิดแบบนักวิทยาศาสตร์ (เหตุผล/ตรรกะ) ผสมกับความคิดสร้างสรรค์แบบ Creator พร้อมอธิบายจุดเด่นของแต่ละแนวทาง`
        },
        {
            name: "บทความ Featured Snippet (ตอบตรงคำถาม)",
            prompt: `สร้างเนื้อหาสำหรับ Featured Snippet เพื่อตอบคำถาม "[ใส่คำถามที่ต้องการคำตอบสำหรับ Featured Snippet]" โดยให้คำตอบที่กระชับ ชัดเจน และตรงประเด็นที่สุด สามารถอยู่ในรูปแบบย่อหน้าสั้นๆ หรือรายการ (bullet/numbered list) ที่ตอบคำถามได้โดยตรงภายใน 50-60 คำ (หรือตามความเหมาะสมของคำถาม)

ตัวอย่างโครงสร้างที่ต้องการ (เลือกแบบใดแบบหนึ่งหรือผสมผสาน):

**แบบย่อหน้า:**
[คำตอบโดยตรงและกระชับสำหรับคำถาม]

**แบบรายการ:**
- ประเด็นหลัก 1 ที่ตอบคำถาม
- ประเด็นหลัก 2 ที่ตอบคำถาม
- ประเด็นหลัก 3 ที่ตอบคำถาม

**สำคัญ:**
- เนื้อหาต้องตอบคำถามที่ระบุไว้ข้างต้นโดยตรง
- ใช้ภาษาที่เข้าใจง่าย
- ไม่ต้องมีบทนำหรือบทสรุปยาวๆ เน้นคำตอบทันที`
        }
        // --- สิ้นสุดการเพิ่ม Prompts ใหม่ ---
    ];

    // --- 4.1 Custom Prompt Management Functions ---
    function loadCustomPrompts() {
        try {
            const storedCustomPrompts = localStorage.getItem(CUSTOM_PROMPTS_KEY);
            if (storedCustomPrompts) {
                customPrompts = JSON.parse(storedCustomPrompts);
            }
        } catch (error) {
            console.error("Error loading custom prompts from localStorage:", error);
            customPrompts = []; // Reset on error
        }
    }

    function saveCustomPrompt() {
        if (!elements.promptInput) return;
        const prompt = elements.promptInput.value.trim();
        if (prompt === '') {
            showToast('กรุณาป้อน Prompt ที่ต้องการบันทึกก่อน!', 'error');
            return;
        }

        // สร้างชื่อ Prompt อัตโนมัติ หรือจะให้ผู้ใช้กรอกชื่อก็ได้
        const promptName = prompt.substring(0, 50) + (prompt.length > 50 ? '...' : ''); 
        
        // ตรวจสอบว่า Prompt นี้ถูกบันทึกไว้แล้วหรือยัง
        const existing = customPrompts.find(item => item.prompt === prompt);
        if (existing) {
            showToast('Prompt นี้ถูกบันทึกไว้แล้ว!', 'info');
            return;
        }

        customPrompts.unshift({ name: `[กำหนดเอง] ${promptName}`, prompt: prompt });
        if (customPrompts.length > 20) customPrompts.pop(); // จำกัดจำนวน Prompt ที่กำหนดเองไม่เกิน 20 รายการ
        try {
            localStorage.setItem(CUSTOM_PROMPTS_KEY, JSON.stringify(customPrompts));
        } catch (error) {
            console.error("Error saving custom prompts to localStorage:", error);
            showToast("ไม่สามารถบันทึก Prompt ที่กำหนดเองได้", "error");
        }
        renderMySavedPrompts(); // Render "My Saved Prompts" section
        showToast('บันทึก Prompt ที่กำหนดเองแล้ว!', 'success');
    }

    function clearCustomPrompts() {
        if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบ Prompt ที่กำหนดเองทั้งหมด?')) {
            customPrompts = [];
            try {
                localStorage.removeItem(CUSTOM_PROMPTS_KEY);
            } catch (error) {
                console.error("Error clearing custom prompts from localStorage:", error);
                // Continue to update UI even if localStorage fails
            }
            renderMySavedPrompts(); // Update "My Saved Prompts" section
            showToast('ลบ Prompt ที่กำหนดเองแล้ว!', 'info');
        }
    }

    // New function to export custom prompts
    function exportCustomPrompts() {
        if (customPrompts.length === 0) {
            showToast('ยังไม่มี Prompt ที่กำหนดเองให้ส่งออก!', 'info');
            return;
        }

        const dataStr = JSON.stringify(customPrompts, null, 2); // prettify JSON
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'my_custom_prompts.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('ส่งออก Prompt ที่กำหนดเองเรียบร้อยแล้ว!', 'success');
    }

    // --- 4.2 UI Rendering for Prompts ---
    function renderPredefinedPrompts() {
        if (!elements.promptTemplatesGrid) return; // Guard clause
        elements.promptTemplatesGrid.innerHTML = ''; // Clear old items

        if (promptTemplates.length === 0) {
            elements.promptTemplatesGrid.innerHTML = '<p class="placeholder-text">ไม่มีตัวอย่าง Prompt เริ่มต้น</p>'; // Placeholder
            return;
        }

        promptTemplates.forEach(template => {
            const templateItem = document.createElement('div');
            templateItem.classList.add('template-item');
            templateItem.textContent = template.name;
            templateItem.dataset.prompt = template.prompt;
            elements.promptTemplatesGrid.appendChild(templateItem);
        });
    }

    function renderMySavedPrompts() {
        if (!elements.mySavedPromptsList) return; // Guard clause
        elements.mySavedPromptsList.innerHTML = ''; // Clear old items

        if (customPrompts.length === 0) {
            elements.mySavedPromptsList.innerHTML = '<p class="placeholder-text">ยังไม่มี Prompt ที่บันทึกไว้...</p>';
            if (elements.clearMySavedPromptsBtn) elements.clearMySavedPromptsBtn.style.display = 'none';
            if (elements.exportMySavedPromptsBtn) elements.exportMySavedPromptsBtn.style.display = 'none';
            return;
        }

        customPrompts.forEach(template => {
            const templateItem = document.createElement('div');
            templateItem.classList.add('template-item', 'custom-prompt-item'); // เพิ่ม class สำหรับ custom prompts
            templateItem.textContent = template.name;
            templateItem.dataset.prompt = template.prompt;
            elements.mySavedPromptsList.appendChild(templateItem);
        });

        if (elements.clearMySavedPromptsBtn) {
            elements.clearMySavedPromptsBtn.style.display = customPrompts.length > 0 ? 'block' : 'none';
        }
        if (elements.exportMySavedPromptsBtn) { // Corrected variable name
            elements.exportMySavedPromptsBtn.style.display = customPrompts.length > 0 ? 'block' : 'none';
        }
    }

    function handleTemplateClick(event) {
        const templateItem = event.target.closest('.template-item');
        if (templateItem && templateItem.dataset.prompt && elements.promptInput) {
            elements.promptInput.value = templateItem.dataset.prompt;
            const message = templateItem.classList.contains('custom-prompt-item') ? 
                            'โหลด Prompt ที่บันทึกไว้แล้ว!' : 'โหลด Prompt ตัวอย่างแล้ว!';
            showToast(message, 'info');
            elements.promptInput.focus(); // Focus on input after loading
        }
    }

    // --- 5. Content Tools (ML-like functions) ---
    async function handleContentToolClick(event) {
        const currentText = currentGeneratedText.trim();
        if (!currentText) {
            showToast('ยังไม่มีเนื้อหาให้ปรับปรุงนะครับ!', 'error');
            return;
        }

        const toolId = event.currentTarget ? event.currentTarget.id : null;
        const toneType = event.currentTarget ? event.currentTarget.dataset.toneType : null;

        let promptModifier = '';
        let actionMessage = '';

        if (toolId === 'summarizeBtn') {
            promptModifier = 'ย่อข้อความนี้ให้กระชับและจับใจความสำคัญ โดยรักษาการจัดรูปแบบ Markdown (##, ###) ถ้ามี:';
            actionMessage = 'กำลังย่อเนื้อหา...';
        } else if (toolId === 'expandBtn') {
            // ปรับปรุง Prompt สำหรับการขยายเนื้อหา
            promptModifier = 'ขยายความข้อความนี้ให้ละเอียดและมีเนื้อหาเพิ่มเติมจากเดิม โดยเพิ่มรายละเอียดในแต่ละส่วน รักษาโครงสร้างเดิม (Markdown) และเพิ่มความยาวให้มากขึ้นอีก:';
            actionMessage = 'กำลังขยายเนื้อหาเพิ่มเติม...';
        } else if (toolId === 'toneProfessionalBtn' || toolId === 'toneCasualBtn') {
            promptModifier = `ปรับโทนเสียงของข้อความนี้ให้เป็นภาษาที่ ${toneType === 'professional' ? 'เป็นทางการ' : 'เป็นกันเองและเข้าใจง่าย'} โดยรักษาการจัดรูปแบบ Markdown (##, ###) ถ้ามี:`;
            actionMessage = `กำลังปรับโทนเนื้อหาเป็น ${toneType === 'professional' ? 'ทางการ' : 'กันเอง'}...`;
        } else {
            showToast('ไม่รู้จักคำสั่งเครื่องมือนี้!', 'error');
            return;
        }

        if (promptModifier) {
            const fullPrompt = `${promptModifier}\n\n${currentText}`;
            if (elements.promptInput) elements.promptInput.value = fullPrompt;
            showToast(actionMessage, 'info');
            await handleGenerateClick(true);
        }
    }


    // --- 6. Main Generate Function (Call Backend Server) ---
    /**
     * Handles the content generation process by calling your Backend Server.
     * @param {boolean} [isToolAction=false] - True if called from a content tool, false otherwise.
     */
    async function handleGenerateClick(isToolAction = false) {
        const prompt = elements.promptInput ? elements.promptInput.value.trim() : '';
        const selectedModel = elements.aiModelSelect ? elements.aiModelSelect.value : 'gemini-1.5-flash-latest'; // Default model

        if (prompt === '') {
            showToast('กรุณาป้อนหัวข้อหรือคำสั่งของคุณก่อนนะครับ! 😊', 'error');
            return;
        }

        // Improved BACKEND_API_URL check
        if (!BACKEND_API_URL || BACKEND_API_URL.trim() === '' || !BACKEND_API_URL.startsWith('http')) {
            showToast('ข้อผิดพลาด: ไม่ได้ตั้งค่า URL ของ Backend Server อย่างถูกต้องใน script.js', 'error');
            toggleLoadingState(false); // Ensure loading state is reset
            return;
        }
        toggleLoadingState(true);
        try {
            const response = await fetch(BACKEND_API_URL, { 
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt: prompt,
                    model: selectedModel 
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                let errorMessage = `เกิดข้อผิดพลาดจาก Server Backend: ${response.status} ${response.statusText}`;
                if (errorData && errorData.error && typeof errorData.error === 'string') {
                    errorMessage = `Backend Error: ${errorData.error}`;
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();
            
            let generatedText = '';
            if (data && data.text) { 
                generatedText = data.text;
            }

            if (generatedText) {
                displayTypewriterEffect(generatedText);
                showToast(isToolAction ? 'ปรับปรุงเนื้อหาสำเร็จ!' : 'สร้างเนื้อหาสำเร็จแล้ว! 🎉', 'success');
                if (!isToolAction) { 
                    addPromptToHistory(prompt, generatedText, selectedModel);
                }
            } else {
                if (elements.resultOutput) elements.resultOutput.innerHTML = '<p style="color: red;">ไม่ได้รับเนื้อหาจาก AI โปรดลองใหม่อีกครั้ง หรืออาจถูกเซ็นเซอร์</p>';
                showToast('ไม่สามารถสร้างเนื้อหาได้ โปรดลองอีกครั้ง', 'error');
                if (elements.copyBtn) elements.copyBtn.style.display = 'none';
                if (elements.contentTools) elements.contentTools.style.display = 'none';
            }

        } catch (error) {
            console.error(`Fetch error to URL: ${BACKEND_API_URL}`, error); // Add URL to console log
            if (elements.resultOutput) {
                elements.resultOutput.innerHTML = `<p style="color: red;">เกิดข้อผิดพลาด: ${error.message} <br>โปรดตรวจสอบ Server Backend, การเชื่อมต่ออินเทอร์เน็ต, หรือ URL ของ Backend (${BACKEND_API_URL}) ใน script.js</p>`;
            }
            showToast(`เกิดข้อผิดพลาด: ${error.message.substring(0, 50)}...`, 'error');
            if (elements.copyBtn) elements.copyBtn.style.display = 'none';
            if (elements.contentTools) elements.contentTools.style.display = 'none';
        } finally {
            toggleLoadingState(false);
        }
    }

    function handleCopyClick() {
        if (!currentGeneratedText) { // ตรวจสอบจาก currentGeneratedText (Markdown ดิบ)
            showToast('ยังไม่มีเนื้อหาให้คัดลอก', 'error');
            return;
        }

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(currentGeneratedText) // คัดลอก Markdown ดิบ
                .then(() => {
                    showToast('คัดลอกเนื้อหา (Markdown) เรียบร้อยแล้ว! ✨', 'success');
                })
                .catch(err => {
                    console.error('Failed to copy text: ', err);
                    showToast('ไม่สามารถคัดลอกเนื้อหาได้', 'error');
                });
        } else {
            // Fallback for older browsers (though less likely needed if execCommand was working)
            // You could re-implement the textarea method here if broad compatibility is paramount
            // and you want to copy currentGeneratedText instead of innerHTML.
            const tempTextArea = document.createElement('textarea');
            tempTextArea.value = currentGeneratedText; // คัดลอก Markdown ดิบ
            document.body.appendChild(tempTextArea);
            tempTextArea.select();
            try {
                document.execCommand('copy');
                showToast('คัดลอกเนื้อหา (Markdown) เรียบร้อยแล้ว! (Fallback) ✨', 'success');
            } catch (err) {
                console.error('Fallback copy failed: ', err);
                showToast('ไม่สามารถคัดลอกเนื้อหาได้ (Fallback)', 'error');
            }
            document.body.removeChild(tempTextArea);
        }
    }

    // --- 7. Event Listeners ---
    if (elements.generateBtn) {
        elements.generateBtn.addEventListener('click', () => handleGenerateClick(false));
    }
    if (elements.copyBtn) {
        elements.copyBtn.addEventListener('click', handleCopyClick);
    }

    // Event listener for predefined prompt templates
    if (elements.promptTemplatesGrid) {
        elements.promptTemplatesGrid.addEventListener('click', handleTemplateClick);
    }
    if (elements.mySavedPromptsList) { // Event listener for "My Saved Prompts"
        elements.mySavedPromptsList.addEventListener('click', handleTemplateClick);
    }

    if (elements.searchHistory) {
        elements.searchHistory.addEventListener('click', (event) => {
            const item = event.target.closest('.history-item');
            if (item) {
                const index = parseInt(item.dataset.index, 10); // Add radix
                const selectedHistory = history[index];
                if (selectedHistory) {
                    if (elements.promptInput) elements.promptInput.value = selectedHistory.prompt;
                    displayTypewriterEffect(selectedHistory.response);
                    if (elements.aiModelSelect) elements.aiModelSelect.value = selectedHistory.model;
                    showToast('โหลดประวัติการค้นหาแล้ว!', 'info');
                }
            }
        });
    }

    if (elements.summarizeBtn) elements.summarizeBtn.addEventListener('click', handleContentToolClick);
    if (elements.expandBtn) elements.expandBtn.addEventListener('click', handleContentToolClick);
    if (elements.toneProfessionalBtn) elements.toneProfessionalBtn.addEventListener('click', handleContentToolClick);
    if (elements.toneCasualBtn) elements.toneCasualBtn.addEventListener('click', handleContentToolClick);

    if (elements.clearHistoryBtn) {
        elements.clearHistoryBtn.addEventListener('click', clearHistory);
    }

    // Event listener สำหรับปุ่มบันทึก Prompt ที่กำหนดเอง
    if (elements.saveCustomPromptBtn) {
        elements.saveCustomPromptBtn.addEventListener('click', saveCustomPrompt);
    }

    // Event listeners for "My Saved Prompts" action buttons
    if (elements.clearMySavedPromptsBtn) {
        elements.clearMySavedPromptsBtn.addEventListener('click', clearCustomPrompts);
    }
    if (elements.exportMySavedPromptsBtn) {
        elements.exportMySavedPromptsBtn.addEventListener('click', exportCustomPrompts);
    }

    // --- Function to update current year in footer ---
    function updateFooterYear() {
        if (elements.currentYearSpan) elements.currentYearSpan.textContent = new Date().getFullYear();
    }

    // --- 8. Initial Setup ---
    setTimeout(() => {
        if (elements.container) {
            elements.container.classList.remove('initial-hidden');
            elements.container.classList.add('fade-in');
        }
    }, 100);

    updateFooterYear(); // Update footer year on load
    loadHistory();
    loadCustomPrompts();
    renderPredefinedPrompts(); // Render predefined templates
    renderMySavedPrompts();    // Render user's saved prompts
});
