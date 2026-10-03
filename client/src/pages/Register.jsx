import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const homeFor = { student: '/student', company: '/company' };

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student' });
  const [error, setError] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const user = await register(form);
      navigate(homeFor[user.role]);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div style={{ maxWidth: 360, margin: '60px auto' }}>
      <h2>Register</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <input name="name" placeholder="Full name / Company name"
          value={form.name} onChange={handleChange} required /><br /><br />
        <input name="email" type="email" placeholder="Email"
          value={form.email} onChange={handleChange} required /><br /><br />
        <input name="password" type="password" placeholder="Password (min 6)"
          value={form.password} onChange={handleChange} required minLength={6} /><br /><br />
        <select name="role" value={form.role} onChange={handleChange}>
          <option value="student">Student</option>
          <option value="company">Company</option>
        </select><br /><br />
        <button type="submit">Register</button>
      </form>
      <p>Already registered? <Link to="/login">Login</Link></p>
    </div>
  );
}