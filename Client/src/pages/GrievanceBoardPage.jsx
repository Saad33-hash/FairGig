import Navbar from '../components/Navbar';

export default function GrievanceBoardPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 max-w-md w-full text-center flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 shrink-0" />
          <h1 className="text-xl font-bold text-slate-900">Grievance Board</h1>
          <p className="text-sm text-slate-500 leading-relaxed">
            Post complaints about platforms, browse what other workers have reported, and track escalation status. Coming in Phase 7.
          </p>
        </div>
      </div>
    </div>
  );
}
