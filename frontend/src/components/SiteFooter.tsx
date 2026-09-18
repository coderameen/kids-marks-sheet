export default function SiteFooter({ className = "" }: { className?: string }) {
  return (
    <footer
      className={`border-t border-violet-100/80 bg-white/80 px-4 py-4 text-center text-sm text-slate-600 backdrop-blur safe-bottom ${className}`}
    >
      designed and developed with{" "}
      <span className="text-red-500" aria-hidden>
        ❤️
      </span>{" "}
      by{" "}
      <span className="font-display font-bold text-violet-600">coderameen</span>
    </footer>
  );
}
