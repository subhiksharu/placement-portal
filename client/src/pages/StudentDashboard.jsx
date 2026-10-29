import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import EligibleJobs from '../components/EligibleJobs';
import MyApplications from '../components/MyApplications';
import StudentProfileForm from '../components/StudentProfileForm';
import ResumeUpload from '../components/ResumeUpload';
import NotificationBell from '../components/NotificationBell';

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState('jobs');

  const tabStyle = (name) => ({
    marginRight: 8,
    fontWeight: tab === name ? 'bold' : 'normal',
  });

  return (
    <div style={{ maxWidth: 720, margin: '30px auto', padding: '0 16px' }}>
      <h2>Welcome, {user.name}</h2>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <NotificationBell />
        <button onClick={logout}>Logout</button>
      </div>

      <div style={{ margin: '16px 0' }}>
        <button style={tabStyle('jobs')} onClick={() => setTab('jobs')}>Jobs</button>
        <button style={tabStyle('applications')} onClick={() => setTab('applications')}>My Applications</button>
        <button style={tabStyle('profile')} onClick={() => setTab('profile')}>My Profile</button>
      </div>

      {tab === 'jobs' && <EligibleJobs onGoProfile={() => setTab('profile')} />}
      {tab === 'applications' && <MyApplications />}
      {tab === 'profile' && (
        <>
          <StudentProfileForm />
          <ResumeUpload />
        </>
      )}
    </div>
  );
}