import { useAuth } from '../context/AuthContext';

export default function CompanyDashboard() {
  const { user, logout } = useAuth();
  return (
    <div style={{ margin: 40 }}>
      <h2>Company Dashboard: {user.name}</h2>
      <p>Job posting comes in the next phase.</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}