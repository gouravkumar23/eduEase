interface Props {
  allocations: any[];
  currentIndex: number;
  answers: Record<string, string>;
  onSelect: (index: number) => void;
}

export const ExamNavigator = ({ allocations, currentIndex, answers, onSelect }: Props) => (
  <div className="bg-white p-4 rounded-lg shadow">
    <h3 className="font-bold mb-3 text-sm">Navigator</h3>
    <div className="grid grid-cols-5 gap-2">
      {allocations.map((a, i) => {
        const isAttempted = answers[a.question_id] && String(answers[a.question_id]).trim() !== '';
        return (
          <button 
            key={i} 
            onClick={() => onSelect(i)} 
            className={`h-8 rounded text-xs font-bold transition-all ${
              i === currentIndex ? 'bg-indigo-600 text-white ring-2 ring-indigo-200' : 
              isAttempted ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {i + 1}
          </button>
        );
      })}
    </div>
  </div>
);