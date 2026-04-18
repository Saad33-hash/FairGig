import { Link } from 'react-router-dom'

export default function AuthLayout({
  title,
  subtitle,
  sideTitle,
  sideCopy,
  points = [],
  children,
  footer,
  centered = false,
  centeredWidthClass = 'max-w-md',
  centeredBackTo,
  centeredBackLabel = 'Back',
}) {
  if (centered) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-100">
        {centeredBackTo ? (
          <Link
            to={centeredBackTo}
            className="fixed top-5 left-5 z-30 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm hover:border-blue-200 hover:text-blue-600 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            {centeredBackLabel}
          </Link>
        ) : null}

        <div className={`w-full ${centeredWidthClass} overflow-hidden border border-slate-200/90 rounded-3xl bg-white shadow-[0_22px_55px_rgba(15,23,42,0.12)]`}>
          <section className="p-7 sm:p-8 bg-white">
            <div className="flex items-center gap-2.5 mb-8">
              <div className="w-8 h-8 rounded-lg bg-blue-600 shrink-0" />
              <span className="text-sm font-bold tracking-tight text-slate-900">FairGig</span>
            </div>

            <h1 className="text-[1.7rem] font-bold tracking-tight text-slate-900 leading-snug">{title}</h1>
            <p className="mt-2 mb-0 text-sm text-slate-500 leading-relaxed max-w-[34ch]">{subtitle}</p>

            {children}

            {footer ? <div className="mt-5">{footer}</div> : null}
          </section>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-slate-100">
      <div className="w-full max-w-5xl overflow-hidden border border-slate-200 rounded-3xl bg-white shadow-xl">
        <div className="grid grid-cols-2">

          {/* ── Left dark panel ── */}
          <aside className="p-14 bg-slate-900 flex flex-col justify-center">
            <span className="inline-flex items-center px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-slate-400 text-xs font-medium uppercase tracking-widest w-fit">
              Secure access
            </span>

            <h2 className="mt-6 mb-3 text-3xl font-bold tracking-tight text-white leading-snug">
              {sideTitle}
            </h2>
            <p className="mb-7 text-slate-400 text-sm leading-relaxed">{sideCopy}</p>

            <div className="flex flex-col gap-2.5">
              {points.map((point) => (
                <div key={point.title} className="flex items-start gap-3 p-3.5 rounded-xl border border-white/[0.07] bg-white/4">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-1 shrink-0" />
                  <div>
                    <div className="text-sm font-semibold text-slate-200">{point.title}</div>
                    <div className="text-xs text-slate-500 leading-relaxed mt-0.5">{point.copy}</div>
                  </div>
                </div>
              ))}
            </div>
          </aside>

          {/* ── Right form panel ── */}
          <section className="p-12 bg-white flex flex-col justify-center">
            <div className="flex items-center gap-2.5 mb-8">
              <div className="w-8 h-8 rounded-lg bg-blue-600 shrink-0" />
              <span className="text-sm font-bold tracking-tight text-slate-900">FairGig</span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900 leading-snug">{title}</h1>
            <p className="mt-2 mb-0 text-sm text-slate-500 leading-relaxed">{subtitle}</p>

            {children}

            {footer ? <div className="mt-5">{footer}</div> : null}
          </section>

        </div>
      </div>
    </div>
  );
}
