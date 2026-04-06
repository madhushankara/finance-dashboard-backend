import { useState, useEffect } from 'react';

function Dashboard({ token, setToken }) {
  const [summary, setSummary] = useState(null);
  const [records, setRecords] = useState([]);
  const [user, setUser] = useState(null);
  
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense');
  const [category, setCategory] = useState('food');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const logout = () => {
    setToken(null);
  };

  const fetchProfile = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.data.user);
      }
    } catch (err) {
      console.log('Error fetching user:', err);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const sumRes = await fetch('http://localhost:3000/api/dashboard/summary', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const sumData = await sumRes.json();
      if (sumData.success) {
        setSummary(sumData.data);
      }
      
      const recRes = await fetch('http://localhost:3000/api/records?limit=50', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const recData = await recRes.json();
      if (recData.success && recData.data && recData.data.items) {
        setRecords(recData.data.items);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchDashboardData();
  }, [token]);

  const handleAddRecord = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('http://localhost:3000/api/records', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount: Number(amount), type, category, date, description })
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to add record');
      }
      
      fetchDashboardData();
      
      setAmount('');
      setDescription('');
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    try {
      const res = await fetch(`http://localhost:3000/api/records/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchDashboardData();
      } else {
        const data = await res.json();
        alert(data.error?.message || 'Failed to delete');
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!summary) return <div style={{padding: '50px', textAlign: 'center'}}>Loading dashboard...</div>;

  const isAdmin = user && user.role === 'admin';

  return (
    <div className="dashboard-container">
      <header className="navbar">
        <h2>Finance Dashboard</h2>
        <div className="nav-right">
          <span>Welcome, {user ? user.name : 'User'} ({user ? user.role : 'viewer'})</span>
          <button onClick={logout} className="logout-btn">Logout</button>
        </div>
      </header>

      <div className="summary-cards">
        <div className="card income">
          <h3>Total Income</h3>
          <p>${summary.totalIncome?.toFixed(2) || '0.00'}</p>
        </div>
        <div className="card expense">
          <h3>Total Expenses</h3>
          <p>${summary.totalExpenses?.toFixed(2) || '0.00'}</p>
        </div>
        <div className="card balance">
          <h3>Net Balance</h3>
          <p>${summary.netBalance?.toFixed(2) || '0.00'}</p>
        </div>
      </div>

      <div className="main-content">
        {isAdmin && (
          <div className="add-record-section">
            <h3>Add New Record</h3>
            {error && <p className="error">{error}</p>}
            <form onSubmit={handleAddRecord} className="record-form">
              <input 
                type="number" 
                step="0.01" 
                value={amount} 
                onChange={e=>setAmount(e.target.value)} 
                placeholder="Amount" 
                required 
              />
              <select value={type} onChange={e=>setType(e.target.value)}>
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
              <input 
                type="text" 
                value={category} 
                onChange={e=>setCategory(e.target.value)} 
                placeholder="Category" 
                required 
              />
              <input 
                type="date" 
                value={date} 
                onChange={e=>setDate(e.target.value)} 
                required 
              />
              <input 
                type="text" 
                value={description} 
                onChange={e=>setDescription(e.target.value)} 
                placeholder="Description (optional)" 
              />
              <button type="submit">Add Record</button>
            </form>
          </div>
        )}

        <div className="records-list">
          <h3>Recent Records</h3>
          {records.length === 0 ? (
            <p style={{paddingTop: '20px'}}>No records found or you do not have permission to view them.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Amount</th>
                  {isAdmin && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {records.map(record => (
                  <tr key={record.id}>
                    <td>{record.date}</td>
                    <td className={`type-${record.type}`}>{record.type.toUpperCase()}</td>
                    <td>{record.category}</td>
                    <td>{record.description || '-'}</td>
                    <td>${record.amount.toFixed(2)}</td>
                    {isAdmin && (
                      <td>
                        <button onClick={() => handleDelete(record.id)} className="delete-btn">Delete</button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
