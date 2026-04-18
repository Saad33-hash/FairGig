import Navbar from '../components/Navbar';

export default function DashboardPage() {
  return (
    <div className="dashboard-shell">
      <Navbar />
      <main className="dashboard-main">
        <div className="dashboard-blank" />
      </main>
    </div>
  );
}