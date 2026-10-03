import { useAuth } from '../context/AuthContext';

export default function TPODashboard() {
  const { user, logout } = useAuth();

  return (
    <div style={{ margin: 40 }}>
      <h2>TPO Dashboard: {user.name}</h2>
      <p>Placement management comes in the next phase.</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}