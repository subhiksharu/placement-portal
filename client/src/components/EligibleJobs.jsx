import { useEffect, useState } from 'react';
import api from '../services/api';

export default function EligibleJobs({ onGoProfile }) {
  const [data, setData] = useState({ eligible: [], ineligible: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [applyingId, setApplyingId] = useState(null);
  const [showIneligible, setShowIneligible] = useState(false);

  useEffect(() => {
    api
      .get('/jobs/eligible')
      .then(({ data }) => setData(data))
      .catch((err) => setError(err.response?.data?.message || 'Could not load jobs'))
      .finally(() => setLoading(false));
  }, []);

  const apply = async (jobId) => {
    setMessage('');
    setApplyingId(jobId);
    try {
      await api.post('/applications', { jobId });
      setData((prev) => ({
        ...prev,
        eligible: prev.eligible.map((j) =>
          j._id === jobId ? { ...j, hasApplied: true } : j
        ),
      }));
      setMessage('Application submitted');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Could not apply');
    } finally {
      setApplyingId(null);
    }
  };

  if (loading) return <p>Loading jobs...</p>;

  if (error) {
    return (
      <div>
        <p style={{ color: 'crimson' }}>{error}</p>
        {error.includes('profile') && <button onClick={onGoProfile}>Go to Profile</button>}
      </div>
    );
  }

  const card = { border: '1px solid #ccc', padding: 12, marginBottom: 10, borderRadius: 6 };

  return (
    <div>
      {message && <p><strong>{message}</strong></p>}

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
          <div style={{ marginTop: 8 }}>
            {job.hasApplied ? (
              <button disabled>Applied ✓</button>
            ) : (
              <button onClick={() => apply(job._id)} disabled={applyingId === job._id}>
                {applyingId === job._id ? 'Applying...' : 'Apply'}
              </button>
            )}
          </div>
        </div>
      ))}

      <h3 style={{ cursor: 'pointer' }} onClick={() => setShowIneligible(!showIneligible)}>
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