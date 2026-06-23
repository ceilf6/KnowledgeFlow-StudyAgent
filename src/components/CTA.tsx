import { Link } from 'react-router-dom'

export default function CTA() {
  return (
    <section id="start" className="cta-section reveal">
      <div className="section-label">准备好了吗</div>
      <h2 className="section-title">
        开启你的
        <br />
        学习之旅
      </h2>
      <p className="section-desc">
        让 AI 成为你的专属学习助手，从第一个知识点开始，一步步构建属于你的知识体系。
      </p>
      <Link className="btn-primary" to="/study">
        立即开始 <span>→</span>
      </Link>
    </section>
  )
}
