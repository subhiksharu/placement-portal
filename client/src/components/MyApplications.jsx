import { useEffect, useState } from 'react';
import api from '../services/api';
import { statusColor } from '../utils/status';

export default function MyApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/applications/my')
      .then(({ data }) => setApplications(data))
      .catch(() => setError('Could not load applications'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading...</p>;
  if (error) return <p style={{ color: 'crimson' }}>{error}</p>;

  return (
    <div>
      <h3>My Applications ({applications.length})</h3>
      {applications.length === 0 && <p>You have not applied to any jobs yet.</p>}

      {applications.map((a) => (
        <div
          key={a._id}
          style={{ border: '1px solid #ccc', padding: 12, marginBottom: 10, borderRadius: 6 }}
        >
          {a.job ? (
            <>
              <strong>{a.job.title}</strong> at {a.job.company?.companyName}
              <p style={{ margin: '6px 0' }}>
                {a.job.jobType} &middot; {a.job.packageLPA} LPA &middot; {a.job.location}
              </p>
            </>
          ) : (
            <em>This job is no longer available</em>
          )}
          <small>Applied on {new Date(a.createdAt).toLocaleDateString()}</small>
          <div style={{ marginTop: 6 }}>
            <span
              style={{
                background: statusColor[a.status],
                color: 'white',
                padding: '2px 10px',
                borderRadius: 4,
                fontSize: 14,
              }}
            >
              {a.status}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}