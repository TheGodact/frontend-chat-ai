import { useState } from 'react';
import './Auth.css';

// รับ props: onLoginSuccess เอาไว้แจ้ง App แม่ว่า "ฉันล็อกอินผ่านแล้วนะ"
export default function Auth({ onLoginSuccess }) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState(''); // เพิ่มเบอร์โทร
  const [isLogin, setIsLogin] = useState(true);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);

    // 1. เลือก URL ว่าจะยิงไปเส้นไหน (Login หรือ Signup) ของ Python เรา
    const endpoint = isLogin 
      ? 'http://127.0.0.1:8000/login' 
      : 'http://127.0.0.1:8000/signup';

    try {
      // 2. เตรียมข้อมูลที่จะส่ง
      const payload = isLogin 
        ? { email, password }
        : { email, password, phone }; // ถ้าสมัครใหม่ ส่งเบอร์โทรไปด้วย

      // 3. ยิงไปหา Python Backend
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'เกิดข้อผิดพลาด');
      }

      // 4. ถ้าสำเร็จ
      if (isLogin) {
        // บันทึก Token เก็บไว้ในเครื่อง
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('user_info', JSON.stringify(data.user_info));
        alert('เข้าสู่ระบบสำเร็จ!');
        // แจ้ง App.jsx ว่าผ่านแล้ว
        onLoginSuccess(data.access_token); 
      } else {
        alert('สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ');
        setIsLogin(true); // สลับไปหน้า Login
      }

    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h2 className="auth-header">{isLogin ? 'Backend Login' : 'Backend Signup'}</h2>
      <form className="auth-form" onSubmit={handleAuth}>
        <input
          type="email"
          placeholder="อีเมล"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="รหัสผ่าน"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        
        {/* โชว์ช่องเบอร์โทรเฉพาะตอนสมัครสมาชิก */}
        {!isLogin && (
          <input
            type="text"
            placeholder="เบอร์โทรศัพท์"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        )}

        <button className="auth-button" disabled={loading}>
          {loading ? 'กำลังโหลด...' : isLogin ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
        </button>
      </form>

      <div className="auth-toggle">
        <span onClick={() => setIsLogin(!isLogin)}>
          {isLogin ? 'สมัครสมาชิกใหม่ (Create Account)' : 'กลับไปหน้าเข้าสู่ระบบ'}
        </span>
      </div>
    </div>
  );
}