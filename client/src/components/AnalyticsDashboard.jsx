import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer,
} from 'recharts';
import api from '../services/api';
import { statusColor } from '../utils/status';

const Card = ({ label, value }) => (
  <div style={{ border: '1px solid #ccc', borderRadius: 6, padding: '12px 16px', flex: '1 1 130px' }}>
    <div style={{ fontSize: 24, fontWeight: 'bold' }}>{value}</div>
    <div style={{ fontSize: 13, color: '#555' }}>{label}</div>
  </div>
);

const Section = ({ title, children }) => (
  <div style={{ marginTop: 28 }}>
    <h4>{title}</h4>
    {children}
  </div>
);

export default function AnalyticsDashboard() {
  const [batch, setBatch] = useState('');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setError('');
    api
      .get('/admin/analytics', { params: batch ? { batch } : {} })
      .then(({ data }) => setData(data))
      .catch((err) => setError(err.response?.data?.message || 'Could not load analytics'));
  }, [batch]);

  if (error) return <p style={{ color: 'crimson' }}>{error}</p>;
  if (!data) return <p>Loading analytics...</p>;

  const { summary, departments, statusCounts, packageBuckets, companyOffers } = data;
  const pieData = statusCounts.filter((s) => s.count > 0);

  return (
    <div>
      <label>Batch: </label>
      <select value={batch} onChange={(e) => setBatch(e.target.value)}>
        <option value="">All batches</option>
        {data.batches.map((b) => (
          <option key={b} value={b}>{b}</option>
        ))}
      </select>

      {summary.totalStudents === 0 ? (
        <p style={{ marginTop: 20 }}>No student data for this selection yet.</p>
      ) : (
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 16 }}>
            <Card label="Students" value={summary.totalStudents} />
            <Card label="Placed" value={summary.placedStudents} />
            <Card label="Placement %" value={`${summary.placementPercent}%`} />
            <Card label="Avg package (LPA)" value={summary.avgPackage || '-'} />
            <Card label="Highest package (LPA)" value={summary.highestPackage || '-'} />
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 10 }}>
            <Card label="Total offers" value={summary.totalOffers} />
            <Card label="Applications" value={summary.totalApplications} />
            <Card label="Open jobs" value={summary.openJobs} />
            <Card label="Approved companies" value={summary.approvedCompanies} />
            <Card label="Pending companies" value={summary.pendingCompanies} />
          </div>

          <Section title="Department-wise placement">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={departments}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="department" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="total" name="Students" fill="#8884d8" />
                <Bar dataKey="placed" name="Placed" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>

            <table border="1" cellPadding="6" style={{ borderCollapse: 'collapse', marginTop: 10, width: '100%' }}>
              <thead>
                <tr><th>Department</th><th>Students</th><th>Placed</th><th>Placement %</th></tr>
              </thead>
              <tbody>
                {departments.map((d) => (
                  <tr key={d.department}>
                    <td>{d.department}</td><td>{d.total}</td><td>{d.placed}</td><td>{d.percent}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>

          <Section title="Applications by status">
            {pieData.length === 0 ? (
              <p>No applications yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={pieData} dataKey="count" nameKey="status" outerRadius={100} label>
                    {pieData.map((s) => (
                      <Cell key={s.status} fill={statusColor[s.status]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Section>

          <Section title="Package distribution (placed students, highest offer each)">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={packageBuckets}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" name="Students" fill="#fd7e14" />
              </BarChart>
            </ResponsiveContainer>
          </Section>

          <Section title="Offers by company (top 10)">
            {companyOffers.length === 0 ? (
              <p>No offers yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(200, companyOffers.length * 40)}>
                <BarChart data={companyOffers} layout="vertical" margin={{ left: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis type="category" dataKey="company" width={110} />
                  <Tooltip />
                  <Bar dataKey="offers" name="Offers" fill="#0d6efd" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Section>
        </>
      )}
    </div>
  );
}