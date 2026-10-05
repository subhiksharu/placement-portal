import { useEffect, useState } from 'react';
import api from '../services/api';

export default function CompanyApprovals() {
  const [companies, setCompanies] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [error, setError] = useState('');

  const loadCompanies = () =>
    api
      .get('/admin/companies', { params: filter ? { status: filter } : {} })
      .then(({ data }) => setCompanies(data))
      .catch(() => setError('Could not load companies'));

  useEffect(() => {
    loadCompanies();
  }, [filter]);

  const changeStatus = async (id, status) => {
    try {
      await api.patch(`/admin/companies/${id}/status`, { status });
      loadCompanies();
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed');
    }
  };

  return (
    <div>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <label>Show: </label>
      <select value={filter} onChange={(e) => setFilter(e.target.value)}>
        <option value="pending">Pending</option>
        <option value="approved">Approved</option>
        <option value="rejected">Rejected</option>
        <option value="">All</option>
      </select>

      <table border="1" cellPadding="8" style={{ marginTop: 12, width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>Company</th>
            <th>Registered by</th>
            <th>Industry</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {companies.length === 0 && (
            <tr><td colSpan="5" style={{ textAlign: 'center' }}>No companies found</td></tr>
          )}
          {companies.map((c) => (
            <tr key={c._id}>
              <td>{c.companyName}</td>
              <td>{c.user?.name}<br /><small>{c.user?.email}</small></td>
              <td>{c.industry}</td>
              <td>{c.status}</td>
              <td>
                {c.status !== 'approved' && (
                  <button onClick={() => changeStatus(c._id, 'approved')}>Approve</button>
                )}{' '}
                {c.status !== 'rejected' && (
                  <button onClick={() => changeStatus(c._id, 'rejected')}>Reject</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}