import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import CompanyApprovals from '../components/CompanyApprovals';

export default function TPODashboard() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState('analytics');

  const tabStyle = (name) => ({
    marginRight: 8,
    fontWeight: tab === name ? 'bold' : 'normal',
  });

  return (
    <div style={{ maxWidth: 900, margin: '30px auto', padding: '0 16px' }}>
      <h2>TPO Dashboard: {user.name}</h2>
      <button onClick={logout}>Logout</button>

      <div style={{ margin: '16px 0' }}>
        <button style={tabStyle('analytics')} onClick={() => setTab('analytics')}>Analytics</button>
        <button style={tabStyle('companies')} onClick={() => setTab('companies')}>Company Approvals</button>
      </div>

      {tab === 'analytics' && <AnalyticsDashboard />}
      {tab === 'companies' && <CompanyApprovals />}
    </div>
  );
}