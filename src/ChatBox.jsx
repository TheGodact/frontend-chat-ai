// ChatBox.jsx
import { useState, useRef, useEffect } from 'react';
import './ChatBox.css';

// 1. เพิ่ม userEmail ใน props ที่รับเข้ามา
function ChatBox({ title, endpoint, color, bgImage, userEmail }) {
  
  const [messages, setMessages] = useState([
    { id: 1, text: `สวัสดี! ถามเรื่อง "${title}" ได้เลยครับ`, sender: "bot" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // ❌ ลบ State นี้ทิ้งไปเลย (เพราะเราได้รับค่ามาจาก App แล้ว)
  // const [userEmail, setUserEmail] = useState("");

  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(scrollToBottom, [messages]);

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() && !selectedFile) return;

    setIsLoading(true);
    let finalImageUrl = null;

    try {
      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);
        const uploadRes = await fetch('https://my-project-backend-chat-ai.onrender.com/upload-image', {
          method: 'POST',
          body: formData 
        });
        if (!uploadRes.ok) throw new Error("Upload Failed");
        const uploadData = await uploadRes.json();
        finalImageUrl = uploadData.url; 
      }

      const userMessage = { 
        id: Date.now(), 
        text: input, 
        image: finalImageUrl, 
        sender: "user" 
      };
      setMessages((prev) => [...prev, userMessage]);
      
      const messageToSend = input.trim() || "ช่วยวิเคราะห์รูปภาพนี้ให้หน่อยครับ";

      setInput("");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";

      // 2. ใช้อีเมลจาก props ส่งไป n8n
      const n8nPayload = {
        message: messageToSend,
        imageUrl: finalImageUrl,
        email: userEmail // ✅ ส่งค่าที่รับมาจาก Login ไปเลย
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(n8nPayload)
      });

      const data = await response.json();
      
      const botMessage = { 
        id: Date.now() + 1, 
        text: data.reply || data.output || "เกิดข้อผิดพลาดในการตอบกลับ", 
        sender: "bot" 
      };
      setMessages((prev) => [...prev, botMessage]);

    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => [...prev, { id: Date.now(), text: "ขออภัย ระบบขัดข้องชั่วคราว", sender: "bot" }]);
    } finally {
      setIsLoading(false);
    }
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
      <div className="chat-header" style={{ backgroundColor: color }}>
        {title}
      </div>
      
      <div className="chat-messages" style={bgStyle}>
        {messages.map((msg) => (
          <div key={msg.id} className={`message ${msg.sender}`}>
            <div className="bubble">
              {msg.image && (
                <img 
                  src={msg.image} 
                  alt="uploaded" 
                  style={{ maxWidth: '100%', borderRadius: '10px', marginBottom: '5px', display: 'block' }} 
                />
              )}
              {msg.text && <div>{msg.text}</div>}
            </div>
          </div>
        ))}
        {isLoading && <div className="message bot"><div className="bubble">...</div></div>}
        <div ref={messagesEndRef} />
      </div>

      {/* 3. ส่วน Input Area (ลบช่อง Email ออก เหลือแค่แชท) */}
      <div className="chat-input-area" style={{ flexDirection: 'column', gap: '8px' }}>
        
        {/* ❌ ตรงนี้ไม่มี <input type="email"> แล้วนะครับ */}

        <div style={{ display: 'flex', width: '100%', alignItems: 'center' }}>
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileSelect}
              style={{ display: 'none' }} 
              accept="image/*"
            />
            <button 
              onClick={() => fileInputRef.current.click()} 
              style={{ 
                backgroundColor: selectedFile ? '#2ecc71' : '#ddd',
                color: selectedFile ? 'white' : '#555',
                padding: '10px',
                marginRight: '8px',
                borderRadius: '50%',
                minWidth: '45px',
                border: 'none',
                cursor: 'pointer'
              }}
              title="แนบรูปภาพ"
            >
              {selectedFile ? '📷✓' : '📷'}
            </button>

            <input 
              type="text" 
              value={input} 
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={selectedFile ? "พิมพ์ข้อความแนบรูป..." : "พิมพ์คำถาม..."}
              disabled={isLoading}
              style={{ 
                flex: 1,
                padding: '10px',
                borderRadius: '20px',
                border: `1px solid ${isLoading ? '#eee' : color}`,
                outline: 'none'
              }} 
            />
            
            <button 
                onClick={sendMessage} 
                disabled={isLoading} 
                style={{ 
                    backgroundColor: color,
                    color: 'white',
                    padding: '10px 20px',
                    marginLeft: '8px',
                    borderRadius: '20px',
                    border: 'none',
                    cursor: 'pointer',
                    opacity: isLoading ? 0.7 : 1
                }}
            >
              ส่ง
            </button>
        </div>
      </div>
    </div>
  );
}

export default ChatBox;