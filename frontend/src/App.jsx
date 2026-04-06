import { useState, useEffect } from 'react';
import Login from './components/Login.jsx';
import Dashboard from './components/Dashboard.jsx';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || null);

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }, [token]);

  return (
    <div className="app">
      {!token ? (
        <Login setToken={setToken} />
      ) : (
        <Dashboard token={token} setToken={setToken} />
      )}
    </div>
  );
}

export default App;
