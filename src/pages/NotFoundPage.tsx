import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
      <div className="w-20 h-20 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-6">
        <AlertCircle size={40} />
      </div>
      <h1 className="text-4xl font-black text-slate-900">404</h1>
      <p className="text-slate-500 mt-2 text-lg">The page you are looking for does not exist.</p>
      <button 
        onClick={() => navigate('/')}
        className="mt-8 flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
      >
        <ArrowLeft size={20} /> Back to Home
      </button>
    </div>
  );
}