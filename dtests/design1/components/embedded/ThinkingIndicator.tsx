'use client';

export default function ThinkingIndicator() {
  return (
    <div className="flex items-center gap-3 py-2">
      <div 
        className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: '#3b82f6', borderTopColor: 'transparent' }}
      />
      <span className="text-sm" style={{ color: '#a3a3a3' }}>
        Analyzing 23 trades...
      </span>
    </div>
  );
}
