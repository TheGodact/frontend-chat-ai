import { useState, useRef, useEffect } from 'react';
import './ChatBox.css';

function ChatBox({ title, endpoint, uploadEndpoint, color, bgImage, userEmail }) {
  
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false); // สถานะโหลดไฟล์แยก

  // --- State สำหรับรูปในแชท (Chat Input) ---
  const [selectedFile, setSelectedFile] = useState(null); 
  const fileInputRef = useRef(null);
  
  // --- Ref สำหรับปุ่มอัปโหลดบนหัวเว็บ (Direct Upload) ---
  const directUploadRef = useRef(null);
  const messagesEndRef = useRef(null);

  // 1. ดึงประวัติการแชท
  useEffect(() => {
    if (userEmail) fetchHistory();
    else setMessages([{ id: Date.now(), text: `สวัสดี! ถามเรื่อง "${title}" ได้เลยครับ`, sender: "bot" }]);
  }, [userEmail]);

  const fetchHistory = async () => {
    try {
        // ดึงจาก Python Backend (ตรวจดู Port ให้ตรงกับที่คุณรัน)
        const res = await fetch(`https://my-project-backend-chat-ai.onrender.com/history/${userEmail}`);
        const data = await res.json();
        const historyMessages = data.map(item => ({
            id: item.id,
            text: item.message,
            image: item.image_url,
            sender: item.sender
        }));
        if (historyMessages.length > 0) setMessages(historyMessages);
        else setMessages([{ id: Date.now(), text: `สวัสดี! ถามเรื่อง "${title}" ได้เลยครับ`, sender: "bot" }]);
    } catch (error) { console.error("History Error:", error); }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(scrollToBottom, [messages]);

  // --- 🚀 ฟังก์ชัน 1: อัปโหลดไฟล์แยก (ยิงไป uploadEndpoint) ---
  const handleDirectUpload = async (e) => {
    if (!e.target.files || !e.target.files[0]) return;
    
    // เช็คว่ามีการใส่ Link Webhook สำหรับอัปโหลดมาไหม
    if (!uploadEndpoint) {
        alert("⚠️ บอทตัวนี้ยังไม่ได้ตั้งค่า Webhook สำหรับอัปโหลดไฟล์");
        return;
    }

    const fileToUpload = e.target.files[0];
    setIsUploading(true);

    try {
        // แสดงสถานะในจอ
        setMessages(prev => [...prev, { id: Date.now(), text: `⏳ กำลังอัปโหลดไฟล์: ${fileToUpload.name}...`, sender: "user" }]);

        const formData = new FormData();
        formData.append("file", fileToUpload);
        formData.append("filename", fileToUpload.name);
        formData.append("email", userEmail);

        // ✅ ยิงไปที่ uploadEndpoint (เส้นสำหรับ Google Drive)
        const response = await fetch(uploadEndpoint, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        
        // รับคำตอบจาก n8n
        const botReply = data.reply || data.output || `✅ อัปโหลด ${fileToUpload.name} สำเร็จ!`;
        setMessages(prev => [...prev, { id: Date.now() + 1, text: botReply, sender: "bot" }]);

        // บันทึก Log ลง DB (ว่าเป็น User อัปโหลดไฟล์)
        await saveChatToDB("user", `[Upload File] ${fileToUpload.name}`, null);
        await saveChatToDB("bot", botReply, null);

    } catch (error) {
        console.error("Upload error:", error);
        setMessages(prev => [...prev, { id: Date.now(), text: "❌ เกิดข้อผิดพลาดในการอัปโหลด", sender: "bot" }]);
    } finally {
        setIsUploading(false);
        if (directUploadRef.current) directUploadRef.current.value = ""; 
    }
  };

  // --- 💬 ฟังก์ชัน 2: แชทคุยปกติ (ยิงไป endpoint) ---
  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) setSelectedFile(e.target.files[0]);
  };

  const sendMessage = async () => {
    if (!input.trim() && !selectedFile) return;
    setIsLoading(true);

    try {
      // แสดงข้อความ User
      const userMessage = { 
        id: Date.now(), 
        text: input || "[รูปภาพ]", 
        image: selectedFile ? URL.createObjectURL(selectedFile) : null, 
        sender: "user" 
      };
      setMessages((prev) => [...prev, userMessage]);
      
      const messageToSend = input.trim() || "ส่งรูปภาพ";
      
      // เคลียร์ค่า
      setInput("");
      const fileToSend = selectedFile;
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";

      // เตรียมส่งไป Chat Webhook
      const formData = new FormData();
      formData.append("message", messageToSend);
      formData.append("email", userEmail);
      if (fileToSend) formData.append("file", fileToSend); // แนบรูปประกอบการแชท (ถ้ามี)

      // ✅ ยิงไปที่ endpoint (เส้นสำหรับคุย AI)
      const response = await fetch(endpoint, { method: 'POST', body: formData });
      const data = await response.json();
      
      const botReply = data.reply || data.output || "รับทราบครับ";
      const botMessage = { id: Date.now() + 1, text: botReply, sender: "bot" };
      setMessages((prev) => [...prev, botMessage]);

      // บันทึก Chat ลง DB
      await saveChatToDB("user", messageToSend, null); // (ในที่นี้ยังไม่ได้ save URL รูป ถ้าจะเอาต้องอัปโหลดผ่าน Python ก่อน)
      await saveChatToDB("bot", botReply, null);

    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [...prev, { id: Date.now(), text: "ระบบขัดข้องชั่วคราว", sender: "bot" }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper: บันทึกลง DB
  const saveChatToDB = async (sender, message, imageUrl) => {
    try {
        await fetch('https://my-project-backend-chat-ai.onrender.com/save-chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_email: userEmail,
                sender: sender,
                message: message,
                image_url: imageUrl
            })
        });
    } catch (e) { console.error("DB Save Error", e); }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') sendMessage();
  };

  const bgStyle = {
    backgroundImage: `url('${bgImage}')`,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    backgroundBlendMode: 'overlay',
    backgroundSize: 'cover'
  };

  return (
    <div className="chat-container">
      {/* --- Header: มีปุ่มอัปโหลดไฟล์แยก --- */}
      <div className="chat-header" style={{ backgroundColor: color, justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>{title}</div>
        
        {/* ปุ่มอัปโหลดไฟล์ (Direct Upload) */}
        <div>
            <input type="file" ref={directUploadRef} onChange={handleDirectUpload} style={{ display: 'none' }} />
            <button 
                onClick={() => directUploadRef.current.click()}
                disabled={isUploading}
                style={{
                    backgroundColor: 'rgba(255,255,255,0.25)',
                    border: '1px solid rgba(255,255,255,0.6)',
                    color: 'white',
                    padding: '6px 14px',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    display: 'flex', alignItems: 'center', gap: '5px'
                }}
            >
                {isUploading ? '⏳ กำลังส่ง...' : '☁️ อัปโหลดไฟล์'}
            </button>
        </div>
      </div>
      
      {/* --- Messages Area --- */}
      <div className="chat-messages" style={bgStyle}>
        {messages.map((msg) => (
          <div key={msg.id} className={`message ${msg.sender}`}>
            <div className="bubble">
              {msg.image && (
                <img src={msg.image} alt="preview" style={{ maxWidth: '100%', borderRadius: '10px', marginBottom: '5px', display: 'block' }} />
              )}
              {msg.text && <div>{msg.text}</div>}
            </div>
          </div>
        ))}
        {isLoading && <div className="message bot"><div className="bubble">...</div></div>}
        <div ref={messagesEndRef} />
      </div>

      {/* --- Chat Input Area (สำหรับคุยปกติ) --- */}
      <div className="chat-input-area" style={{ flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', width: '100%', alignItems: 'center' }}>
            <input type="file" ref={fileInputRef} onChange={handleFileSelect} style={{ display: 'none' }} accept="image/*" />
            
            <button onClick={() => fileInputRef.current.click()} style={{ backgroundColor: selectedFile ? '#2ecc71' : '#ddd', color: selectedFile ? 'white' : '#555', padding: '10px', marginRight: '5px', borderRadius: '50%', minWidth: '45px', border: 'none', cursor: 'pointer' }}>📷</button>

            <input 
              type="text" 
              value={input} 
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={selectedFile ? "แนบรูปแล้ว... (พิมพ์ข้อความประกอบ)" : "พิมพ์คำถาม..."}
              disabled={isLoading}
              style={{ flex: 1, padding: '10px', borderRadius: '20px', border: `1px solid ${isLoading ? '#eee' : color}`, outline: 'none' }} 
            />
            
            <button onClick={sendMessage} disabled={isLoading} style={{ backgroundColor: color, color: 'white', padding: '10px 20px', marginLeft: '8px', borderRadius: '20px', border: 'none', cursor: 'pointer', opacity: isLoading ? 0.7 : 1 }}>ส่ง</button>
        </div>
      </div>
    </div>
  );
}

export default ChatBox;