export default function AuthLayout({
  title,
  subtitle,
  sideTitle,
  sideCopy,
  points = [],
  children,
  footer,
}) {
  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-card-grid">
          <aside className="auth-side">
            <div className="auth-side-badge">Secure access</div>
            <h2 className="auth-side-title">{sideTitle}</h2>
            <p className="auth-side-copy">{sideCopy}</p>

            <div className="auth-side-points">
              {points.map((point) => (
                <div key={point.title} className="auth-point">
                  <div className="auth-point-dot" />
                  <div>
                    <div className="auth-point-title">{point.title}</div>
                    <div className="auth-point-copy">{point.copy}</div>
                  </div>
                </div>
              ))}
            </div>
          </aside>

          <section className="auth-form-panel">
            <div className="auth-brand">
              <div className="auth-brand-mark" />
              <div className="auth-brand-text">FairGig</div>
            </div>

            <header>
              <h1 className="auth-heading">{title}</h1>
              <p className="auth-subtitle">{subtitle}</p>
            </header>

            {children}

            {footer ? <div style={{ marginTop: '20px' }}>{footer}</div> : null}
          </section>
        </div>
      </div>
    </div>
  );
}
