import Link from "next/link";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-cyan-400 via-violet-500 to-fuchsia-500">
      <div className="pointer-events-none absolute inset-0 opacity-30">
        <span className="absolute left-[10%] top-[20%] text-6xl animate-float">
          ⭐
        </span>
        <span className="absolute right-[15%] top-[30%] text-5xl animate-float [animation-delay:0.5s]">
          🌈
        </span>
        <span className="absolute bottom-[25%] left-[20%] text-5xl animate-float [animation-delay:1s]">
          🏆
        </span>
      </div>
      <div className="relative mx-auto flex min-h-[100dvh] max-w-4xl flex-col items-center justify-center px-4 py-12 text-center text-white sm:px-6">
        <p className="text-sm font-bold uppercase tracking-[0.3em] text-white/80">
          Asra Sara Learning
        </p>
        <h1 className="mt-4 font-display text-4xl font-bold drop-shadow sm:text-5xl md:text-7xl">
          Star Points Adventure
        </h1>
        <p className="mt-6 max-w-xl text-lg text-white/90">
          Collect points, climb the leaderboard, and shine like a star! ✨
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link
            href="/student"
            className="rounded-2xl bg-white px-8 py-4 font-display text-lg font-bold text-violet-600 shadow-xl transition hover:scale-105"
          >
            🎮 Student zone
          </Link>
          <Link
            href="/admin/login"
            className="rounded-2xl border-2 border-white/80 bg-white/10 px-8 py-4 font-display text-lg font-bold backdrop-blur transition hover:bg-white/20"
          >
            🔐 Admin login
          </Link>
        </div>
      </div>
    </div>
  );
}
