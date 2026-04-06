import { useState } from 'react';

function Login({ setToken }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const fillDemoCredentials = (roleEmail, rolePassword) => {
    setIsLogin(true);
    setEmail(roleEmail);
    setPassword(rolePassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const url = isLogin 
      ? 'http://localhost:3000/api/auth/login' 
      : 'http://localhost:3000/api/auth/register';
      
    const body = isLogin ? { email, password } : { email, password, name };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || 'Something went wrong!');
      }

      if (data.success && data.data && data.data.token) {
        setToken(data.data.token);
      } else {
        setError('Login failed, no token received');
      }
    } catch (err) {
      console.error("Auth error:", err);
      setError(err.message);
    }
  };

  return (
    <div className="auth-container">
      <h2>{isLogin ? 'Login to Finance App' : 'Create an Account'}</h2>
      {error && <p className="error">{error}</p>}

      <div className="demo-accounts">
         <p style={{fontSize: '13px', color: '#7f8c8d', marginBottom: '8px'}}>Quick Login (Demo Roles):</p>
         <button className="demo-btn" type="button" onClick={() => fillDemoCredentials('admin@finance.app', 'admin123')}>Admin</button>
         <button className="demo-btn" type="button" onClick={() => fillDemoCredentials('analyst@finance.app', 'analyst123')}>Analyst</button>
         <button className="demo-btn" type="button" onClick={() => fillDemoCredentials('viewer@finance.app', 'viewer123')}>Viewer</button>
      </div>

      <form onSubmit={handleSubmit} className="auth-form">
        {!isLogin && (
          <div className="form-group">
            <label>Name:</label>
            <input 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              required 
              minLength={2}
            />
          </div>
        )}
        <div className="form-group">
          <label>Email:</label>
          <input 
            type="email" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            required 
          />
        </div>
        <div className="form-group">
          <label>Password:</label>
          <input 
            type="password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            required 
          />
        </div>
        
        <button type="submit" className="primary-btn">
          {isLogin ? 'Login' : 'Register'}
        </button>
      </form>

      <p className="toggle-text">
        {isLogin ? "Don't have an account? " : "Already have an account? "}
        <span onClick={() => setIsLogin(!isLogin)} className="link">
          {isLogin ? 'Register here' : 'Login here'}
        </span>
      </p>
    </div>
  );
}

export default Login;
