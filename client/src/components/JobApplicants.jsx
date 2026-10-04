import { useEffect, useState } from 'react';
import api from '../services/api';
import { statusColor, statusLabel } from '../utils/status';

export default function JobApplicants({ jobId }) {
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () =>
    api
      .get(`/applications/job/${jobId}`)
      .then(({ data }) => setApplicants(data.applicants))
      .catch((err) => setError(err.response?.data?.message || 'Could not load applicants'))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, [jobId]);

  const changeStatus = async (id, status) => {
    setError('');
    try {
      await api.patch(`/applications/${id}/status`, { status });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed');
    }
  };

  if (loading) return <p>Loading applicants...</p>;

  return (
    <div style={{ marginTop: 10, background: '#f7f7f7', padding: 10, borderRadius: 6 }}>
      {error && <p style={{ color: 'crimson' }}>{error}</p>}
      {applicants.length === 0 ? (
        <p>No applicants yet.</p>
      ) : (
        <table border="1" cellPadding="6" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr>
              <th>Student</th>
              <th>Dept</th>
              <th>CGPA</th>
              <th>Backlogs</th>
              <th>Skills</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {applicants.map((a) => (
              <tr key={a._id}>
                <td>
                  {a.student.name}
                  <br />
                  <small>{a.student.email}</small>
                </td>
                <td>{a.profile?.department || '-'}</td>
                <td>{a.profile?.cgpa ?? '-'}</td>
                <td>{a.profile?.backlogs ?? '-'}</td>
                <td>{a.profile?.skills?.join(', ') || '-'}</td>
                <td>
                  <span
                    style={{
                      background: statusColor[a.status],
                      color: 'white',
                      padding: '2px 8px',
                      borderRadius: 4,
                    }}
                  >
                    {a.status}
                  </span>
                </td>
                <td>
                  {a.allowedNext.length === 0 ? (
                    <em>Final</em>
                  ) : (
                    a.allowedNext.map((next) => (
                      <button
                        key={next}
                        onClick={() => changeStatus(a._id, next)}
                        style={{ marginRight: 4 }}
                      >
                        {statusLabel[next]}
                      </button>
                    ))
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}