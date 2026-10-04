import { useEffect, useState } from 'react';
import api from '../services/api';

export default function EligibleJobs({ onGoProfile }) {
  const [data, setData] = useState({ eligible: [], ineligible: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showIneligible, setShowIneligible] = useState(false);

  useEffect(() => {
    api
      .get('/jobs/eligible')
      .then(({ data }) => setData(data))
      .catch((err) => setError(err.response?.data?.message || 'Could not load jobs'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading jobs...</p>;

  if (error) {
    return (
      <div>
        <p style={{ color: 'crimson' }}>{error}</p>
        {error.includes('profile') && (
          <button onClick={onGoProfile}>Go to Profile</button>
        )}
      </div>
    );
  }

  const card = { border: '1px solid #ccc', padding: 12, marginBottom: 10, borderRadius: 6 };

  return (
    <div>
      <h3>Jobs You Are Eligible For ({data.eligible.length})</h3>
      {data.eligible.length === 0 && <p>No eligible jobs right now.</p>}

      {data.eligible.map((job) => (
        <div key={job._id} style={card}>
          <strong>{job.title}</strong> at {job.company?.companyName}
          <p style={{ margin: '6px 0' }}>
            {job.jobType} &middot; {job.packageLPA} LPA &middot; {job.location}
          </p>
          <p style={{ margin: '6px 0' }}>{job.description}</p>
          <p style={{ margin: '6px 0' }}>
            <strong>Skill match: {job.skillMatch.percent}%</strong>
            {job.skillMatch.missing.length > 0 && (
              <span> (missing: {job.skillMatch.missing.join(', ')})</span>
            )}
          </p>
          <small>Deadline: {new Date(job.deadline).toLocaleDateString()}</small>
        </div>
      ))}

      <h3
        style={{ cursor: 'pointer' }}
        onClick={() => setShowIneligible(!showIneligible)}
      >
        {showIneligible ? '▼' : '▶'} Not Eligible ({data.ineligible.length})
      </h3>

      {showIneligible &&
        data.ineligible.map((job) => (
          <div key={job._id} style={{ ...card, background: '#fafafa' }}>
            <strong>{job.title}</strong> at {job.company?.companyName}
            <ul style={{ color: 'crimson', margin: '6px 0' }}>
              {job.reasons.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>
        ))}
    </div>
  );
}