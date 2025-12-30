import { useState } from 'react';
import ChatBox from './ChatBox';
import Auth from './Auth';

function App() {
  
  // ✅ 1. กำหนด Webhook สำหรับอัปโหลดไฟล์ "ที่เดียวตรงนี้" (ใช้ร่วมกันทุกบอท)
  const UPLOAD_ENDPOINT = 'https://n8n.natachat.com/webhook/504b7ddf-f8a4-4961-863a-6f259c03b2d1'; 

  // กำหนดบอทแต่ละตัว (เหลือแค่ endpoint สำหรับคุย)
  const bots = [
    {
      id: 'search',
      name: '🤖 ค้นหาข้อมูล',
      endpoint: 'https://n8n.natachat.com/webhook/95d5235f-fe56-413e-bd35-d7de1fdb493c', // เส้นคุย
      color: '#4a90e2',
      bgImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 'travel',
      name: '✈️ กูรูพาเที่ยว',
      endpoint: 'https://n8n.natachat.com/webhook/9f42e56f-5db9-41aa-a6b6-452fb4d6f90f', // เส้นคุย
      color: '#ff9f43',
      bgImage: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=600&q=80'
    },
    {
      id: 'pet',
      name: '🐱 คนรักสัตว์',
      endpoint: 'https://n8n.natachat.com/webhook/dcbf5b41-8cff-48df-8b70-0440e64aafed', // เส้นคุย
      color: '#ff9a9e',
      bgImage: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=600&q=80'
    }
  ];

  const [selectedBotId, setSelectedBotId] = useState(bots[0].id);
  const currentBot = bots.find(bot => bot.id === selectedBotId);

  // --- Auth Logic (เหมือนเดิม) ---
  const [token, setToken] = useState(() => localStorage.getItem('access_token') || null);
  const [userEmail, setUserEmail] = useState(() => {
    const saved = localStorage.getItem('user_info');
    return saved ? JSON.parse(saved).email || "" : "";
  });

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_info');
    setToken(null);
    setUserEmail(""); 
  };

  const handleLoginSuccess = (newToken) => {
    setToken(newToken);
    const saved = localStorage.getItem('user_info');
    if (saved) setUserEmail(JSON.parse(saved).email);
  };

  if (!token) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#1a1a1a' }}>
        <Auth onLoginSuccess={handleLoginSuccess} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: "'Kanit', sans-serif", backgroundColor: '#f0f2f5' }}>
      
      {/* Sidebar */}
      <div style={{ width: '260px', backgroundColor: '#ffffff', borderRight: '1px solid #ddd', display: 'flex', flexDirection: 'column', padding: '20px' }}>
        <h3 style={{ marginBottom: '20px', color: '#333' }}>เลือกผู้ช่วย AI</h3>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {bots.map((bot) => (
            <button
              key={bot.id}
              onClick={() => setSelectedBotId(bot.id)}
              style={{
                padding: '12px 15px', textAlign: 'left', border: 'none', borderRadius: '10px', cursor: 'pointer',
                backgroundColor: selectedBotId === bot.id ? bot.color : '#f5f5f5',
                color: selectedBotId === bot.id ? 'white' : '#333',
                fontWeight: selectedBotId === bot.id ? 'bold' : 'normal',
                transition: 'all 0.2s', boxShadow: selectedBotId === bot.id ? '0 2px 5px rgba(0,0,0,0.2)' : 'none'
              }}
            >
              {bot.name}
            </button>
          ))}
        </div>
        <div style={{ borderTop: '1px solid #eee', paddingTop: '15px', marginTop: 'auto' }}>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
                เข้าสู่ระบบโดย: <br/> <strong>{userEmail}</strong>
            </div>
            <button onClick={handleLogout} style={{ width: '100%', backgroundColor: '#ff4757', color: 'white', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer' }}>
                ออกจากระบบ
            </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div style={{ flex: 1, position: 'relative' }}>
        <ChatBox 
          key={currentBot.id} 
          title={currentBot.name} 
          
          endpoint={currentBot.endpoint} 
          
          // ✅ 2. ส่งตัวแปร Global เข้าไปตรงนี้เลย
          uploadEndpoint={UPLOAD_ENDPOINT} 
          
          color={currentBot.color}
          bgImage={currentBot.bgImage}
          userEmail={userEmail} 
        />
      </div>
    </div>
  );
}

export default App;