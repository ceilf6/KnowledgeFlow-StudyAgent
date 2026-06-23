import { Link } from 'react-router-dom'

export default function Nav() {
  return (
    <nav className="nav-bar">
      <Link className="nav-logo" to="/">
        <div className="nav-logo-mark"></div>
        <span className="nav-logo-text">KnowledgeFlow</span>
      </Link>
      <ul className="nav-links">
        <li><Link className="nav-link" to="/study">学习</Link></li>
        <li><Link className="nav-link" to="/plans">计划</Link></li>
        <li><Link className="nav-link" to="/practice">练习</Link></li>
        <li><Link className="nav-link" to="/resources">资源</Link></li>
        <li><Link className="nav-link" to="/settings">设置</Link></li>
      </ul>
    </nav>
  )
}
