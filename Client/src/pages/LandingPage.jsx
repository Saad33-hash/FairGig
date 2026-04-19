import { useEffect, useMemo, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const COLORS = {
  bg: '#F4F6F9',
  surface: '#FFFFFF',
  navy: '#0B1E3D',
  blue: '#1547A0',
  blue2: '#2563EB',
  blueLt: '#4F8EF7',
  sky: '#DBEAFE',
  muted: '#5A6880',
  border: 'rgba(11,30,61,0.10)',
  border2: 'rgba(11,30,61,0.18)',
}

const FEATURES = [
  {
    id: '01',
    title: 'Verified Earnings Ledger',
    desc: 'Track shift-by-shift earnings with confidence. Each value stays auditable across services.',
    svgPath: 'M4 7h16M4 12h16M4 17h10',
    wide: true,
  },
  {
    id: '02',
    title: 'Screenshot Evidence Vault',
    desc: 'Upload proof and preserve timestamped records for disputes and claims.',
    svgPath: 'M4 8h16v10H4z M8 8l2-3h4l2 3 M9 13h6',
    wide: false,
  },
  {
    id: '03',
    title: 'Anomaly Detection',
    desc: 'Flag suspicious drops, missing payouts, and odd patterns before they become losses.',
    svgPath: 'M5 17l4-5 3 2 5-7 2 2',
    wide: false,
  },
  {
    id: '04',
    title: 'Certificate Engine',
    desc: 'Generate transparent proof certificates for legal, advocacy, and worker records.',
    svgPath: 'M6 5h12v10H6z M9 19l3-2 3 2',
    wide: true,
  },
  {
    id: '05',
    title: 'Role-Based Workflow',
    desc: 'Workers, verifiers, and advocates collaborate through clean, permissioned interfaces.',
    svgPath: 'M7 8a3 3 0 1 0 0.01 0 M17 9a2 2 0 1 0 0.01 0 M4 19c0-3 2-5 5-5s5 2 5 5 M13 19c0-2 1.5-3.5 4-3.5',
    wide: false,
  },
  {
    id: '06',
    title: 'Open Architecture',
    desc: 'Microservice boundaries keep every module testable, scalable, and replaceable.',
    svgPath: 'M6 6h12v12H6z M6 12h12 M12 6v12',
    wide: false,
  },
]

const SERVICES = [
  { label: 'Auth', badge: 'JWT', badgeColor: '#2563EB', angle: 0 },
  { label: 'Grievance', badge: 'API', badgeColor: '#16A34A', angle: 60 },
  { label: 'Analytics', badge: 'ML', badgeColor: '#0EA5E9', angle: 120 },
  { label: 'Anomaly', badge: 'AI', badgeColor: '#F59E0B', angle: 180 },
  { label: 'Certificates', badge: 'PDF', badgeColor: '#EF4444', angle: 240 },
  { label: 'Earnings', badge: 'DB', badgeColor: '#7C3AED', angle: 300 },
]

const POSTS = [
  {
    platform: 'Community Board',
    category: 'Payment Delay',
    text: 'My payout was short by three days. I attached screenshots and the verifier responded in 4 hours.',
    tag: 'Resolved with Evidence',
    tagColor: '#DBEAFE',
  },
  {
    platform: 'Worker Forum',
    category: 'Route Adjustment',
    text: 'After we reported unfair route penalties, advocates produced a trend report for policy review.',
    tag: 'Escalated to Advocate',
    tagColor: '#DCFCE7',
  },
  {
    platform: 'Rights Desk',
    category: 'Dispute Support',
    text: 'The certificate export helped me present a complete earning history in a legal consultation.',
    tag: 'Certificate Ready',
    tagColor: '#FEE2E2',
  },
]

const NAV_LINKS = [
  { label: 'Home', href: '#top' },
  { label: 'About', href: '#about' },
  { label: 'Contact Us', href: '#contact' },
]

const useReveal = (options = {}) => {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return undefined

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true)
            observer.unobserve(entry.target)
          }
        })
      },
      {
        threshold: options.threshold ?? 0.18,
      },
    )

    observer.observe(node)

    return () => observer.disconnect()
  }, [options.threshold])

  return { ref, visible }
}

function Nav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className="landing-nav"
      style={{
        borderBottom: scrolled ? `1px solid ${COLORS.border2}` : '1px solid transparent',
      }}
    >
      <div className="landing-shell nav-inner">
        <a href="#top" className="logo-mark" aria-label="FairGig home">
          <span style={{ color: COLORS.blue2 }}>Fair</span>Gig
        </a>

        <nav className="desktop-links" aria-label="Primary">
          {NAV_LINKS.map((item) => {
            return (
              <a key={item.label} href={item.href} className="nav-link">
                {item.label}
              </a>
            )
          })}
        </nav>

        <div className="nav-actions">
          <a href="/login" className="btn btn-nav-ghost">
            Login
          </a>
          <a href="/signup" className="btn btn-nav">
            Signup
          </a>
        </div>

        <button type="button" className="hamburger" aria-label="Open navigation menu">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
      </div>
    </header>
  )
}

function Hero() {
  const contentRef = useRef(null)

  useEffect(() => {
    const element = contentRef.current
    if (!element) return undefined

    gsap.fromTo(
      element.querySelectorAll('.hero-animate'),
      { y: 38, opacity: 0 },
      { y: 0, opacity: 1, stagger: 0.12, duration: 0.9, ease: 'power3.out' },
    )

    return () => {
      gsap.killTweensOf(element.querySelectorAll('.hero-animate'))
    }
  }, [])

  return (
    <section id="top" className="hero-wrap">
      <div className="hero-pattern" />
      <div className="hero-mesh" />
      <div className="orbit orbit-a" />
      <div className="orbit orbit-b" />

      <div className="floating-card top-left">3.2M workers represented</div>
      <div className="floating-card top-right">Live grievance tracking</div>
      <div className="floating-card bottom-left">Evidence-first workflow</div>
      <div className="floating-card bottom-right">Policy-ready analytics</div>

      <div className="landing-shell hero-content" ref={contentRef}>
        <div className="hero-badge hero-animate">SOFTEC 2026 • FAST-NU Lahore</div>
        <h1 className="hero-title hero-animate">
          Your Gig. Your <span className="gradient-word">Proof.</span> Your Rights.
        </h1>
        <p className="hero-sub hero-animate">
          FairGig helps gig workers document income, validate claims, and mobilize advocacy through verifiable digital evidence.
        </p>
        <div className="hero-actions hero-animate">
          <a href="#about" className="btn btn-primary">
            Explore Platform
          </a>
          <a href="#community" className="btn btn-ghost">
            View Community
          </a>
        </div>
      </div>
    </section>
  )
}

function StatsStrip() {
  const { ref, visible } = useReveal()

  return (
    <section ref={ref} className={`stats-strip reveal ${visible ? 'visible' : ''}`}>
      <div className="landing-shell stats-grid">
        <div className="stat-box">
          <strong>3.2M</strong>
          <span>gig workers</span>
        </div>
        <div className="stat-box">
          <strong>6+</strong>
          <span>microservices</span>
        </div>
        <div className="stat-box">
          <strong>0</strong>
          <span>hardcoded values</span>
        </div>
        <div className="stat-box">
          <strong>100%</strong>
          <span>transparent</span>
        </div>
      </div>
    </section>
  )
}

function Personas() {
  const wrapperRef = useRef(null)
  const introCardRef = useRef(null)
  const cardsRef = useRef(null)

  useEffect(() => {
    if (!wrapperRef.current || !introCardRef.current || !cardsRef.current) return undefined

    const isMobile = window.matchMedia('(max-width: 767px)').matches

    if (isMobile) {
      gsap.set(introCardRef.current, { clearProps: 'all', opacity: 1 })
      gsap.set(cardsRef.current, { clearProps: 'all', opacity: 1 })
      gsap.set(cardsRef.current.children, { clearProps: 'all', opacity: 1 })
      return undefined
    }

    gsap.to(introCardRef.current, {
      rotateX: 8,
      scale: 0.35,
      z: -1200,
      opacity: 0,
      ease: 'power2.in',
      scrollTrigger: {
        trigger: wrapperRef.current,
        start: 'top top',
        end: '55% bottom',
        scrub: 1.5,
      },
    })

    gsap.fromTo(
      cardsRef.current,
      {
        opacity: 0,
        scale: 0.1,
        z: -800,
        rotateX: -12,
      },
      {
        opacity: 1,
        scale: 1,
        z: 0,
        rotateX: 0,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: wrapperRef.current,
          start: '55% bottom',
          end: '75% bottom',
          scrub: 1,
        },
      },
    )

    gsap.fromTo(
      cardsRef.current.querySelectorAll('.p-card'),
      { y: 60, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        stagger: 0.12,
        ease: 'back.out(1.6)',
        scrollTrigger: {
          trigger: wrapperRef.current,
          start: '58% bottom',
          end: '75% bottom',
          scrub: 0.8,
        },
      },
    )

    ScrollTrigger.create({
      trigger: wrapperRef.current,
      start: '55% bottom',
      end: '75% bottom',
      scrub: true,
      onUpdate: (self) => {
        const active = self.progress > 0.05
        cardsRef.current.style.pointerEvents = active ? 'auto' : 'none'
      },
    })

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill())
    }
  }, [])

  return (
    <section id="whoitsfor" ref={wrapperRef} className="personas-wrapper">
      <div
        className="personas-sticky"
        style={{ perspective: '1200px', transformStyle: 'preserve-3d', overflow: 'hidden' }}
      >
        <div
          id="introCard"
          className="personas-layer intro-card"
          ref={introCardRef}
          style={{ transformStyle: 'preserve-3d', willChange: 'transform' }}
        >
          <span className="eyebrow">Who It&apos;s For</span>
          <h2>Four Roles, One Mission</h2>
          <p>
            The platform connects workers, verifiers, and rights advocates in a single transparent loop where every claim can be traced.
          </p>
          <div className="arrow-hint" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 4v14" />
              <path d="M6 14l6 6 6-6" />
            </svg>
          </div>
        </div>

        <div
          id="personaCards"
          className="personas-layer tilt-row"
          ref={cardsRef}
          style={{ opacity: 0, pointerEvents: 'none', transformStyle: 'preserve-3d', willChange: 'transform' }}
        >
          <div className="tilt-card p-card role-worker" style={{ transform: 'rotate(-8deg)' }}>
            <span className="role-pill" style={{ background: '#DBEAFE', color: '#1547A0' }}>
              Worker
            </span>
            <h3>Gig Worker</h3>
            <p>Logs shifts, uploads screenshots, and builds an undeniable earnings timeline.</p>
            <div className="role-line" style={{ background: '#2563EB' }} />
          </div>

          <div className="tilt-card p-card role-verifier" style={{ transform: 'rotate(-3deg)' }}>
            <span className="role-pill" style={{ background: '#DCFCE7', color: '#166534' }}>
              Trust Layer
            </span>
            <h3>Verifier</h3>
            <p>Confirms uploaded evidence and strengthens confidence across the system.</p>
            <div className="role-line" style={{ background: '#16A34A' }} />
          </div>

          <div className="tilt-card p-card role-advocate" style={{ transform: 'rotate(3deg)' }}>
            <span className="role-pill" style={{ background: '#FEF3C7', color: '#92400E' }}>
              Insight
            </span>
            <h3>Advocate / Analyst</h3>
            <p>Turns verified data into reports, patterns, and evidence-backed action points.</p>
            <div className="role-line" style={{ background: '#F59E0B' }} />
          </div>

          <div className="tilt-card p-card role-community" style={{ transform: 'rotate(8deg)' }}>
            <span className="role-pill" style={{ background: '#FEE2E2', color: '#991B1B' }}>
              Collective
            </span>
            <h3>Worker Community</h3>
            <p>Shares stories, connects with support, and pushes for fair digital labor conditions.</p>
            <div className="role-line" style={{ background: '#EF4444' }} />
          </div>
        </div>
      </div>
    </section>
  )
}

function Features() {
  const [hoveredIndex, setHoveredIndex] = useState(-1)
  const { ref, visible } = useReveal()

  return (
    <section id="about" ref={ref} className={`features-section reveal ${visible ? 'visible' : ''}`}>
      <div className="landing-shell">
        <h2 className="section-title">Everything a Worker Needs</h2>

        <div className="feature-grid">
          {FEATURES.map((item, index) => (
            <article
              key={item.id}
              className="feature-cell"
              style={{
                gridColumn: item.wide ? 'span 2' : 'span 1',
                background: hoveredIndex === index ? '#EAF0FB' : COLORS.surface,
              }}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(-1)}
            >
              <span className="feature-no">{item.id}</span>
              <div className="feature-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <path d={item.svgPath} />
                </svg>
              </div>
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function Architecture() {
  const [hoveredNode, setHoveredNode] = useState(-1)
  const { ref, visible } = useReveal()

  const positions = useMemo(
    () =>
      SERVICES.map((service) => {
        const radians = (service.angle * Math.PI) / 180
        const radius = 190
        const cx = 260
        const cy = 260
        const x = cx + Math.cos(radians) * radius
        const y = cy + Math.sin(radians) * radius
        return { ...service, x, y }
      }),
    [],
  )

  return (
    <section id="architecture" ref={ref} className={`architecture-section reveal ${visible ? 'visible' : ''}`}>
      <div className="landing-shell">
        <h2 className="section-title">Microservices, Clean Boundaries</h2>

        <div className="arch-wrap" role="img" aria-label="FairGig microservice architecture diagram">
          <svg className="arch-lines" viewBox="0 0 520 520" preserveAspectRatio="none" aria-hidden="true">
            {positions.map((node) => (
              <line
                key={`line-${node.label}`}
                x1={260}
                y1={260}
                x2={node.x}
                y2={node.y}
                stroke="rgba(37,99,235,0.35)"
                strokeWidth="1.2"
                strokeDasharray="5 4"
              />
            ))}
          </svg>

          <div className="arch-core">FairGig Core</div>

          {positions.map((node, idx) => (
            <div
              key={node.label}
              className="arch-node"
              style={{
                left: `${node.x - 44}px`,
                top: `${node.y - 44}px`,
                transform: hoveredNode === idx ? 'scale(1.05)' : 'scale(1)',
                borderColor: hoveredNode === idx ? COLORS.blue2 : COLORS.border2,
              }}
              onMouseEnter={() => setHoveredNode(idx)}
              onMouseLeave={() => setHoveredNode(-1)}
            >
              <strong>{node.label}</strong>
              <span style={{ background: node.badgeColor }}>{node.badge}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function PostCard({ post }) {
  return (
    <article className="post-card">
      <div className="post-head">
        <strong>{post.platform}</strong>
        <span>{post.category}</span>
      </div>
      <p>{post.text}</p>
      <div className="post-tag" style={{ background: post.tagColor }}>
        {post.tag}
      </div>
    </article>
  )
}

function Community() {
  const { ref, visible } = useReveal()

  return (
    <section id="community" ref={ref} className={`community-section reveal ${visible ? 'visible' : ''}`}>
      <div className="landing-shell community-grid">
        <div>
          <span className="eyebrow">Community</span>
          <h2>Workers Speak. Advocates Listen.</h2>
          <p>
            FairGig creates a shared evidence space where personal stories can become structured data and collective leverage.
          </p>
          <a className="btn btn-primary" href="#contact">
            Join the Network
          </a>
        </div>

        <div className="post-stack">
          {POSTS.map((post) => (
            <PostCard key={`${post.platform}-${post.category}`} post={post} />
          ))}
        </div>
      </div>
    </section>
  )
}

function CTASection() {
  const { ref, visible } = useReveal()

  return (
    <section id="contact" ref={ref} className={`cta-section reveal ${visible ? 'visible' : ''}`}>
      <div className="cta-glow cta-glow-a" />
      <div className="cta-glow cta-glow-b" />

      <div className="landing-shell cta-content">
        <h2>Build Fair Work With Verifiable Data</h2>
        <p>Bring FairGig to your city, union, research lab, or policy team and power labor rights with proof.</p>
        <div className="hero-actions">
          <a href="#top" className="btn btn-white">
            Request Demo
          </a>
          <a href="#about" className="btn btn-outline-white">
            See Features
          </a>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="landing-footer">
      <div className="landing-shell" style={{ textAlign: 'center' }}>
        <small>© 2026 FairGig · Built for SOFTEC, FAST-NU Lahore. All rights reserved.</small>
      </div>
    </footer>
  )
}

export default function LandingPage() {
  useEffect(() => {
    const id = 'fairgig-jakarta-font'
    if (!document.getElementById(id)) {
      const preconnectA = document.createElement('link')
      preconnectA.rel = 'preconnect'
      preconnectA.href = 'https://fonts.googleapis.com'
      preconnectA.id = `${id}-preconnect-a`

      const preconnectB = document.createElement('link')
      preconnectB.rel = 'preconnect'
      preconnectB.href = 'https://fonts.gstatic.com'
      preconnectB.crossOrigin = 'anonymous'
      preconnectB.id = `${id}-preconnect-b`

      const link = document.createElement('link')
      link.id = id
      link.rel = 'stylesheet'
      link.href =
        'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap'

      document.head.appendChild(preconnectA)
      document.head.appendChild(preconnectB)
      document.head.appendChild(link)
    }

    return () => {
      const fontLink = document.getElementById(id)
      const preA = document.getElementById(`${id}-preconnect-a`)
      const preB = document.getElementById(`${id}-preconnect-b`)
      if (fontLink) fontLink.remove()
      if (preA) preA.remove()
      if (preB) preB.remove()
    }
  }, [])

  return (
    <>
      <style>
        {`
        :root {
          --bg: ${COLORS.bg};
          --surface: ${COLORS.surface};
          --navy: ${COLORS.navy};
          --blue: ${COLORS.blue};
          --blue2: ${COLORS.blue2};
          --blueLt: ${COLORS.blueLt};
          --sky: ${COLORS.sky};
          --muted: ${COLORS.muted};
          --border: ${COLORS.border};
          --border2: ${COLORS.border2};
        }

        * {
          box-sizing: border-box;
        }

        html,
        body {
          margin: 0;
          padding: 0;
          background: var(--bg);
        }

        body {
          font-family: 'Plus Jakarta Sans', sans-serif;
          color: var(--navy);
        }

        a {
          color: inherit;
          text-decoration: none;
        }

        .landing-root {
          background: var(--bg);
          overflow-x: clip;
        }

        .landing-shell {
          width: min(1180px, 92vw);
          margin: 0 auto;
        }

        .section-title {
          margin: 0 0 1.8rem;
          font-size: clamp(1.65rem, 3vw, 2.4rem);
          font-weight: 700;
          letter-spacing: -0.02em;
        }

        .btn {
          border: none;
          border-radius: 999px;
          padding: 0.78rem 1.22rem;
          font-size: 0.92rem;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease, color 0.2s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
        }

        .btn:hover {
          transform: translateY(-1px);
        }

        .btn-primary,
        .btn-primary,
        .btn-nav {
          background: var(--blue2);
          color: #fff;
          box-shadow: 0 10px 24px rgba(37, 99, 235, 0.25);
        }

        .btn-primary:hover,
        .btn-nav:hover {
          background: #1d4ed8;
        }

        .btn-nav-ghost {
          background: rgba(37, 99, 235, 0.08);
          color: var(--blue2);
          border: 1px solid rgba(37, 99, 235, 0.25);
          box-shadow: 0 10px 22px rgba(11, 30, 61, 0.08);
        }

        .btn-nav-ghost:hover {
          background: rgba(37, 99, 235, 0.16);
        }

        .btn-ghost {
          background: rgba(37, 99, 235, 0.08);
          color: var(--blue2);
          border: 1px solid rgba(37, 99, 235, 0.28);
        }

        .btn-white {
          background: #fff;
          color: var(--navy);
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.25);
        }

        .btn-outline-white {
          background: transparent;
          color: #fff;
          border: 1px solid rgba(255, 255, 255, 0.7);
        }

        .landing-nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 50;
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          background-color: rgba(244, 246, 249, 0.82);
          transition: border-color 0.25s ease;
        }

        .nav-inner {
          height: 76px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }

        .logo-mark {
          font-size: 1.28rem;
          font-weight: 800;
          letter-spacing: -0.03em;
        }

        .desktop-links {
          display: flex;
          gap: 1.1rem;
          align-items: center;
        }

        .nav-actions {
          display: flex;
          align-items: center;
          gap: 0.55rem;
        }

        .nav-link {
          font-size: 0.94rem;
          font-weight: 500;
          color: var(--muted);
          transition: color 0.2s ease;
        }

        .nav-link:hover {
          color: var(--blue2);
        }

        .hamburger {
          display: none;
          border: 1px solid var(--border2);
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: #fff;
          color: var(--navy);
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .hamburger svg {
          width: 20px;
          height: 20px;
        }

        .hero-wrap {
          min-height: 100vh;
          padding-top: 76px;
          position: relative;
          display: grid;
          place-items: center;
          background: #fff;
          isolation: isolate;
        }

        .hero-pattern {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(to right, rgba(21, 71, 160, 0.06) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(21, 71, 160, 0.06) 1px, transparent 1px);
          background-size: 56px 56px;
          pointer-events: none;
          z-index: -4;
        }

        .hero-mesh {
          position: absolute;
          inset: -22%;
          background:
            radial-gradient(circle at 18% 30%, rgba(79, 142, 247, 0.22), transparent 45%),
            radial-gradient(circle at 82% 20%, rgba(37, 99, 235, 0.17), transparent 38%),
            radial-gradient(circle at 50% 82%, rgba(21, 71, 160, 0.14), transparent 45%);
          pointer-events: none;
          z-index: -3;
        }

        .orbit {
          position: absolute;
          border-radius: 50%;
          border: 1px dashed rgba(37, 99, 235, 0.28);
          pointer-events: none;
          z-index: -2;
          animation: spin 30s linear infinite;
        }

        .orbit-a {
          width: min(820px, 78vw);
          height: min(820px, 78vw);
        }

        .orbit-b {
          width: min(620px, 58vw);
          height: min(620px, 58vw);
          animation-direction: reverse;
          animation-duration: 38s;
        }

        .floating-card {
          position: absolute;
          background: rgba(255, 255, 255, 0.88);
          border: 1px solid var(--border);
          border-radius: 14px;
          box-shadow: 0 12px 26px rgba(11, 30, 61, 0.1);
          color: var(--blue);
          font-size: 0.88rem;
          font-weight: 600;
          padding: 0.75rem 0.95rem;
          animation: floatY 5.6s ease-in-out infinite;
        }

        .top-left { top: 17%; left: 7%; }
        .top-right { top: 19%; right: 7%; animation-delay: 0.5s; }
        .bottom-left { bottom: 11%; left: 9%; animation-delay: 1s; }
        .bottom-right { bottom: 12%; right: 8%; animation-delay: 1.5s; }

        .hero-content {
          text-align: center;
          position: relative;
          z-index: 2;
          display: grid;
          gap: 1.25rem;
          justify-items: center;
        }

        .hero-badge {
          background: rgba(37, 99, 235, 0.1);
          color: var(--blue2);
          border: 1px solid rgba(37, 99, 235, 0.3);
          border-radius: 999px;
          font-size: 0.82rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          padding: 0.48rem 0.88rem;
        }

        .hero-title {
          margin: 0;
          font-size: clamp(2.2rem, 6vw, 5rem);
          line-height: 1.02;
          letter-spacing: -0.04em;
        }

        .gradient-word {
          background: linear-gradient(120deg, var(--blue), var(--blueLt), var(--blue2));
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .hero-sub {
          max-width: 760px;
          margin: 0;
          color: var(--muted);
          font-size: clamp(1rem, 2.1vw, 1.17rem);
          line-height: 1.7;
        }

        .hero-actions {
          display: flex;
          gap: 0.85rem;
          flex-wrap: wrap;
          justify-content: center;
        }

        .stats-strip {
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
          background: #fff;
          padding: 1rem 0;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 1px;
          background: var(--border);
        }

        .stat-box {
          display: grid;
          gap: 0.25rem;
          text-align: center;
          background: #fff;
          padding: 1.1rem 0.8rem;
        }

        .stat-box strong {
          font-size: 1.35rem;
          letter-spacing: -0.02em;
        }

        .stat-box span {
          color: var(--muted);
          font-size: 0.92rem;
        }

        .personas-wrapper {
          height: 420vh;
          position: relative;
        }

        .personas-sticky {
          position: sticky;
          top: 0;
          height: 100vh;
          overflow: hidden;
          display: grid;
          place-items: center;
          background: var(--bg);
        }

        .personas-layer {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }

        .intro-card {
          width: min(960px, 88vw);
          background: #fff;
          border: 1px solid var(--border);
          border-radius: 28px;
          padding: 4rem;
          box-shadow: 0 28px 55px rgba(11, 30, 61, 0.13);
          text-align: center;
          z-index: 2;
        }

        .eyebrow {
          display: inline-block;
          color: var(--blue2);
          font-size: 0.84rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 0.85rem;
        }

        .intro-card h2,
        .community-grid h2,
        .cta-content h2 {
          margin: 0;
          font-size: clamp(1.7rem, 3vw, 2.8rem);
          letter-spacing: -0.03em;
        }

        .intro-card p,
        .community-grid p,
        .cta-content p {
          margin: 1rem auto 0;
          max-width: 690px;
          color: var(--muted);
          font-size: 1.04rem;
          line-height: 1.75;
        }

        .arrow-hint {
          margin-top: 1.6rem;
          color: var(--blue2);
          animation: floatY 2.8s ease-in-out infinite;
          display: inline-flex;
        }

        .arrow-hint svg {
          width: 28px;
          height: 28px;
        }

        .tilt-row {
          width: min(1180px, 94vw);
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          column-gap: 1.7rem;
          align-items: start;
          z-index: 3;
        }

        .tilt-card {
          width: min(214px, 18vw);
          height: 304px;
          background: linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(246,249,255,0.94) 100%);
          border: 1px solid rgba(11, 30, 61, 0.15);
          border-radius: 26px;
          padding: 1.32rem 1.02rem;
          box-shadow: 0 26px 56px rgba(11, 30, 61, 0.17);
          display: flex;
          flex-direction: column;
          gap: 0.95rem;
          justify-self: center;
        }

        .role-worker,
        .role-community {
          margin-top: 92px;
        }

        .role-verifier,
        .role-advocate {
          margin-top: 28px;
        }

        .role-pill {
          width: fit-content;
          border-radius: 999px;
          padding: 0.24rem 0.62rem;
          font-size: 0.76rem;
          font-weight: 700;
          letter-spacing: 0.03em;
          text-transform: uppercase;
        }

        .tilt-card h3 {
          margin: 0;
          font-size: 1.18rem;
          letter-spacing: -0.02em;
        }

        .tilt-card p {
          margin: 0;
          color: var(--muted);
          font-size: 0.95rem;
          line-height: 1.76;
        }

        .role-line {
          height: 3px;
          border-radius: 999px;
          margin-top: auto;
        }

        .features-section,
        .architecture-section,
        .community-section {
          padding: 6.5rem 0;
        }

        .features-section,
        .community-section {
          background: #fff;
        }

        .feature-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1px;
          background: var(--border);
          border-radius: 20px;
          overflow: hidden;
          border: 1px solid var(--border);
        }

        .feature-cell {
          min-height: 220px;
          padding: 1.2rem;
          position: relative;
          transition: background 0.2s ease;
          display: grid;
          align-content: start;
          gap: 0.65rem;
        }

        .feature-no {
          position: absolute;
          top: 0.9rem;
          right: 1rem;
          font-size: 2.1rem;
          font-weight: 800;
          color: rgba(11, 30, 61, 0.07);
          letter-spacing: -0.03em;
        }

        .feature-icon {
          width: 42px;
          height: 42px;
          border-radius: 10px;
          border: 1px solid var(--border2);
          display: grid;
          place-items: center;
          color: var(--blue2);
        }

        .feature-icon svg {
          width: 20px;
          height: 20px;
        }

        .feature-cell h3 {
          margin: 0;
          font-size: 1.03rem;
        }

        .feature-cell p {
          margin: 0;
          color: var(--muted);
          line-height: 1.63;
          font-size: 0.93rem;
          max-width: 44ch;
        }

        .architecture-section {
          background: var(--bg);
        }

        .arch-wrap {
          width: min(520px, 94vw);
          height: min(520px, 94vw);
          margin: 1.2rem auto 0;
          position: relative;
        }

        .arch-lines {
          position: absolute;
          inset: 0;
        }

        .arch-core {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          width: 148px;
          height: 148px;
          border-radius: 50%;
          background: #fff;
          border: 2px solid var(--blue2);
          display: grid;
          place-items: center;
          text-align: center;
          font-size: 0.95rem;
          font-weight: 700;
          box-shadow: 0 0 0 14px rgba(37, 99, 235, 0.08);
          z-index: 2;
        }

        .arch-node {
          position: absolute;
          width: 88px;
          height: 88px;
          border-radius: 18px;
          background: #fff;
          border: 1px solid var(--border2);
          display: grid;
          place-items: center;
          text-align: center;
          gap: 0.2rem;
          transition: transform 0.2s ease, border-color 0.2s ease;
          z-index: 3;
        }

        .arch-node strong {
          font-size: 0.8rem;
        }

        .arch-node span {
          font-size: 0.65rem;
          font-weight: 700;
          color: #fff;
          border-radius: 999px;
          padding: 0.16rem 0.46rem;
          letter-spacing: 0.05em;
        }

        .community-grid {
          display: grid;
          grid-template-columns: 1.05fr 1fr;
          gap: 1.5rem;
          align-items: start;
        }

        .post-stack {
          display: grid;
          gap: 0.9rem;
        }

        .post-card {
          border-radius: 16px;
          border: 1px solid var(--border);
          background: #fff;
          padding: 1rem;
          box-shadow: 0 10px 24px rgba(11, 30, 61, 0.06);
        }

        .post-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 0.65rem;
        }

        .post-head strong {
          font-size: 0.92rem;
        }

        .post-head span {
          color: var(--muted);
          font-size: 0.82rem;
        }

        .post-card p {
          margin: 0.75rem 0;
          color: #2f3f5f;
          font-size: 0.92rem;
          line-height: 1.65;
        }

        .post-tag {
          border-radius: 999px;
          width: fit-content;
          padding: 0.31rem 0.7rem;
          font-size: 0.76rem;
          font-weight: 700;
          color: #1e293b;
        }

        .cta-section {
          position: relative;
          overflow: hidden;
          background: var(--navy);
          color: #fff;
          padding: 6rem 0;
          isolation: isolate;
        }

        .cta-glow {
          position: absolute;
          width: 440px;
          height: 440px;
          border-radius: 50%;
          filter: blur(8px);
          z-index: -1;
        }

        .cta-glow-a {
          left: -140px;
          top: -160px;
          background: radial-gradient(circle, rgba(37, 99, 235, 0.55), transparent 70%);
        }

        .cta-glow-b {
          right: -160px;
          bottom: -170px;
          background: radial-gradient(circle, rgba(79, 142, 247, 0.48), transparent 70%);
        }

        .cta-content {
          text-align: center;
          display: grid;
          justify-items: center;
          gap: 1rem;
        }

        .cta-content p {
          color: rgba(255, 255, 255, 0.78);
          max-width: 720px;
        }

        .landing-footer {
          background: var(--bg);
          border-top: 1px solid var(--border);
          padding: 1.05rem 0;
        }

        .footer-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .footer-links {
          display: flex;
          gap: 0.9rem;
          color: var(--muted);
          font-size: 0.9rem;
        }

        .footer-row small {
          color: var(--muted);
          font-size: 0.84rem;
        }

        .reveal {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.7s ease, transform 0.7s ease;
        }

        .reveal.visible {
          opacity: 1;
          transform: translateY(0);
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes floatY {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-9px); }
        }

        @media (max-width: 1024px) {
        @media (max-width: 1024px) {
          .floating-card {
            display: none;
          }

          .intro-card {
            padding: 2.4rem;
          }

          .tilt-row {
            width: min(980px, 94vw);
            column-gap: 1.1rem;
          }

          .tilt-card {
            width: min(192px, 21vw);
            height: 286px;
          }

          .role-worker,
          .role-community {
            margin-top: 74px;
          }

          .role-verifier,
          .role-advocate {
            margin-top: 18px;
          }
        }

        @media (max-width: 767px) {
          .desktop-links,
          .nav-actions {
            display: none;
          }

          .hamburger {
            display: inline-flex;
          }

          .hero-wrap {
            min-height: 88vh;
          }

          .hero-title {
            font-size: clamp(2rem, 11vw, 2.9rem);
          }

          .hero-sub {
            font-size: 0.98rem;
            line-height: 1.58;
          }

          .stats-grid {
            grid-template-columns: 1fr 1fr;
          }

          .personas-wrapper {
            height: auto;
            padding: 4rem 0;
            background: var(--bg);
          }

          .personas-sticky {
            position: static;
            height: auto;
            overflow: visible;
            display: grid;
            gap: 1rem;
          }

          .personas-layer {
            position: static;
            transform: none;
          }

          .intro-card {
            width: min(92vw, 620px);
            padding: 2rem 1.2rem;
          }

          .tilt-row {
            width: min(92vw, 620px);
            grid-template-columns: 1fr;
            row-gap: 0.8rem;
            opacity: 1 !important;
            transform: none !important;
          }

          .tilt-card {
            width: 100%;
            height: auto;
            transform: none !important;
          }

          .role-worker,
          .role-community,
          .role-verifier,
          .role-advocate {
            margin-top: 0;
          }

          .features-section,
          .architecture-section,
          .community-section,
          .cta-section {
            padding: 4rem 0;
          }

          .feature-grid {
            grid-template-columns: 1fr;
          }

          .feature-cell {
            grid-column: span 1 !important;
            min-height: auto;
          }

          .community-grid {
            grid-template-columns: 1fr;
          }

          .footer-row {
            justify-content: center;
            text-align: center;
          }
        }
        `}
      </style>

      <div className="landing-root">
        <Nav />
        <Hero />
        <StatsStrip />
        <Personas />
        <Features />
        <Architecture />
        <Community />
        <CTASection />
        <Footer />
      </div>
    </>
  )
}
