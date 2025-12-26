import { useState } from 'react';
import ChatBox from './ChatBox';
import Auth from './Auth';

function App() {
  // 1. อ่าน Token จาก LocalStorage ทันที (Lazy Init)
  // ไม่ต้องใช้ useEffect แล้ว ตัดปัญหา Render ซ้ำ
  const [token, setToken] = useState(() => {
    return localStorage.getItem('access_token') || null;
  });

  // 2. อ่าน Email จาก LocalStorage ทันทีเช่นกัน
  const [userEmail, setUserEmail] = useState(() => {
    const savedUserInfo = localStorage.getItem('user_info');
    if (savedUserInfo) {
      try {
        const userInfo = JSON.parse(savedUserInfo);
        return userInfo.email || "";
      } catch (error) {
        console.error("Error parsing user info:", error);
        return "";
      }
    }
    return "";
  });

  // ฟังก์ชัน Logout (เคลียร์ค่าทั้งหมด)
  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_info');
    setToken(null);
    setUserEmail(""); 
  };

  // ฟังก์ชัน Login สำเร็จ (รับค่ามาอัปเดตหน้าจอ)
  const handleLoginSuccess = (newToken) => {
    setToken(newToken);
    // ดึงอีเมลมาโชว์ทันทีโดยไม่ต้องรีเฟรช
    const savedUserInfo = localStorage.getItem('user_info');
    if (savedUserInfo) {
      const userInfo = JSON.parse(savedUserInfo);
      setUserEmail(userInfo.email);
    }
  };

  // --- ส่วนการแสดงผล (เหมือนเดิม) ---
  
  // ถ้าไม่มี Token -> โชว์หน้า Login
  if (!token) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#1a1a1a' }}>
        <Auth onLoginSuccess={handleLoginSuccess} />
      </div>
    );
  }

  // ถ้ามี Token -> โชว์หน้า Chat
  return (
    <div style={{ position: 'relative' }}>
      <button 
        onClick={handleLogout}
        style={{
          position: 'absolute', top: '20px', right: '20px',
          backgroundColor: '#ff4757', color: 'white', border: 'none',
          padding: '10px 20px', borderRadius: '20px', cursor: 'pointer', zIndex: 1000
        }}
      >
        ออกจากระบบ ({userEmail})
      </button>

      <div style={{ 
        display: 'flex', gap: '30px', justifyContent: 'center', alignItems: 'center',
        flexWrap: 'wrap', minHeight: '100vh', backgroundColor: '#9f8e8eff', padding: '20px'
      }}>
        <ChatBox 
          title="🤖 ค้นหาข้อมูล" 
          endpoint="https://n8n.natachat.com/webhook/dcbf5b41-8cff-48df-8b70-0440e64aafed" 
          color="#4a90e2"
          bgImage="https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80"
          userEmail={userEmail} 
        />

        <ChatBox 
          title="✈️ กูรูพาเที่ยว" 
          endpoint="https://n8n.natachat.com/webhook/dcbf5b41-8cff-48df-8b70-0440e64aafed" 
          color="#ff9f43"
          bgImage="https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=600&q=80"
          userEmail={userEmail} 
        />

        <ChatBox 
          title="🐱 คนรักสัตว์" 
          endpoint="https://n8n.natachat.com/webhook/dcbf5b41-8cff-48df-8b70-0440e64aafed" 
          color="#ff9a9e"
          bgImage="https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=600&q=80"
          userEmail={userEmail} 
        />
      </div>
    </div>
  );
}

export default App;