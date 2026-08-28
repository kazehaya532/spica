import { Menu, Star, X } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'

const navItems = [
  { to: '/explore', label: 'Explore' },
  { to: '/learn', label: 'Learn' },
  { to: '/quizzes', label: 'Quizzes' },
]

export default function AppShell() {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <header className="site-header">
        <Link className="brand" to="/" aria-label="Spica home">
          <span className="brand-mark"><Star size={20} strokeWidth={1.7} /></span>
          <span>SPICA</span>
          <span className="brand-note">the brightest guide to the universe</span>
        </Link>
        <button className="menu-button icon-button" type="button" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-controls="primary-navigation" aria-label="Toggle navigation">
          {menuOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
        <nav id="primary-navigation" className={menuOpen ? 'site-nav is-open' : 'site-nav'} aria-label="Primary navigation">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} onClick={() => setMenuOpen(false)} className={({ isActive }) => isActive ? 'active' : ''}>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main id="main-content" key={location.pathname}>
        <Outlet />
      </main>
      <footer className="site-footer">
        <div>
          <Link className="brand footer-brand" to="/"><Star size={18} /> SPICA</Link>
          <p>The brightest guide to the universe.</p>
        </div>
        <p className="footer-note">Built for learning and backyard observing. Never use a sky chart for safety-critical navigation.</p>
        <nav aria-label="Footer navigation">
          <Link to="/explore">Star Map</Link>
          <Link to="/learn">Lessons</Link>
          <Link to="/quizzes">Knowledge checks</Link>
          <Link to="/credits">Data &amp; credits</Link>
        </nav>
      </footer>
    </div>
  )
}
