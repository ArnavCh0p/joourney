import Link from "next/link";

export default function SignInErrorPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
      <h1 className="text-4xl font-bold text-white tracking-tighter select-none">
        J<span className="text-emerald-400 font-extralight">∞</span>rney
      </h1>

      <div className="max-w-sm space-y-2">
        <p className="text-base font-medium text-slate-200">Sign-in didn&apos;t complete</p>
        <p className="text-sm text-slate-400 leading-relaxed">
          Steam sign-in was cancelled or something went wrong. Your account and data are safe — nothing was changed.
        </p>
      </div>

      <Link
        href="/"
        className="inline-flex items-center gap-2 rounded-md bg-slate-900 border border-slate-700 px-5 py-2.5 text-sm font-medium text-slate-200 hover:bg-slate-800 hover:border-slate-600 transition-colors"
      >
        ← Try again
      </Link>

      <p className="text-xs text-slate-600">
        If this keeps happening, make sure your Steam profile is set to public.
      </p>
    </div>
  );
}
