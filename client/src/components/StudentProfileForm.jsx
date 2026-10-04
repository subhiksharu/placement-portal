import { useEffect, useState } from 'react';
import api from '../services/api';

const empty = {
  rollNumber: '', department: '', batch: '', cgpa: '',
  backlogs: 0, phone: '', skills: '',
};

export default function StudentProfileForm() {
  const [form, setForm] = useState(empty);
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.get('/students/profile').then(({ data }) => {
      if (data) setForm({ ...data, skills: data.skills.join(', ') });
    });
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      await api.put('/students/profile', {
        ...form,
        batch: Number(form.batch),
        cgpa: Number(form.cgpa),
        backlogs: Number(form.backlogs),
        skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean),
      });
      setMessage('Profile saved');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Could not save profile');
    }
  };

  return (
    <div style={{ maxWidth: 420 }}>
      {message && <p>{message}</p>}
      <form onSubmit={handleSubmit}>
        <input name="rollNumber" placeholder="Roll number" value={form.rollNumber} onChange={handleChange} /><br /><br />
        <input name="department" placeholder="Department (e.g. CSE)" value={form.department} onChange={handleChange} required /><br /><br />
        <input name="batch" type="number" placeholder="Graduation year (e.g. 2027)" value={form.batch} onChange={handleChange} required /><br /><br />
        <input name="cgpa" type="number" step="0.01" min="0" max="10" placeholder="CGPA" value={form.cgpa} onChange={handleChange} required /><br /><br />
        <input name="backlogs" type="number" min="0" placeholder="Current backlogs" value={form.backlogs} onChange={handleChange} /><br /><br />
        <input name="phone" placeholder="Phone" value={form.phone} onChange={handleChange} /><br /><br />
        <input name="skills" placeholder="Skills (comma separated)" value={form.skills} onChange={handleChange} /><br /><br />
        <button type="submit">Save Profile</button>
      </form>
    </div>
  );
}