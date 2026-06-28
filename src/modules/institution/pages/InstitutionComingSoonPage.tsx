import { useNavigate } from 'react-router-dom';
import { Building2, ArrowLeft } from 'lucide-react';

export default function InstitutionComingSoonPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
      <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mb-6 shadow-sm">
        <Building2 size={40} />
      </div>
      <h1 className="text-3xl font-black text-slate-900">Institution Portal</h1>
      <p className="text-slate-500 mt-2 text-lg max-w-md">
        The multi-tenant enterprise institution management portal is coming soon in Phase 2.
      </p>
      <button 
        onClick={() => navigate('/')}
        className="mt-8 flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
      >
        <ArrowLeft size={20} /> Back to Home
      </button>
    </div>
  );
}