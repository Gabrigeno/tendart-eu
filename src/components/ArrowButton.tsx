import { ChevronLeft, ChevronRight } from "lucide-react";

// Chevron minimal: grigio, al passaggio del mouse prende l'accento della fanzine
export default function ArrowButton({ dir, label, accent, disabled, onClick }: { dir: 'prev' | 'next'; label: string; accent: string; disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="group shrink-0 flex items-center justify-center !p-1 !bg-transparent !border-0 !rounded-none text-gray-500 transition-colors duration-200 disabled:opacity-20 disabled:cursor-default focus:!outline-none focus-visible:!outline-1 focus-visible:!outline-white"
    >
      <span className="transition-colors duration-200 group-enabled:group-hover:[color:var(--c)]" style={{ '--c': accent } as React.CSSProperties}>
        {dir === 'prev' ? <ChevronLeft size={28} strokeWidth={1.5} /> : <ChevronRight size={28} strokeWidth={1.5} />}
      </span>
    </button>
  );
}
