export default function Hero({ onStart, onLearnMore }: { onStart?: () => void; onLearnMore?: () => void }) {
  return (
    <section className="hero">
      <div className="hero-eyebrow">AI 驱动的学习平台</div>
      <h1 className="hero-title">
        让知识
        <br />
        <em>轻松流入</em>
        <br />
        你的脑海
      </h1>
      <p className="hero-desc">
        通过智能提示词工程与知识图谱技术，从零开始逐点突破。不跳步、不假设，每一步都为你而走。
      </p>
      <div className="hero-actions">
        <button className="btn-primary" onClick={onStart}>
          开始学习 <span>→</span>
        </button>
        <button className="btn-ghost" onClick={onLearnMore}>
          了解更多
        </button>
      </div>

      {/* Hero decorative rings */}
      <div className="hero-visual">
        <div className="hero-ring" style={{ inset: 0, animation: 'ringRotate 30s linear infinite' }}>
          <div className="hero-ring-dot" />
        </div>
        <div
          className="hero-ring"
          style={{
            inset: '40px',
            animation: 'ringRotate 25s linear infinite reverse',
            borderColor: 'var(--teal-border)',
          }}
        >
          <div className="hero-ring-dot" />
        </div>
        <div
          className="hero-ring"
          style={{ inset: '80px', animation: 'ringRotate 20s linear infinite' }}
        />
        <div
          className="hero-ring"
          style={{
            inset: '120px',
            animation: 'ringRotate 35s linear infinite reverse',
            borderColor: 'var(--teal-border)',
          }}
        />
      </div>
    </section>
  )
}
