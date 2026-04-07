import './CTA.css';

function CTA() {
  return (
    <>
      <section className="cta-cards section">
        <div className="container">
          <div className="cta-grid">
            <div className="cta-card card">
              <div className="cta-icon">👥</div>
              <h3 className="cta-title">Meet the Team</h3>
              <button className="btn-primary">Read Our Story</button>
            </div>
            
            <div className="cta-card card">
              <div className="cta-icon">🎧</div>
              <h3 className="cta-title">Need Support?</h3>
              <button className="btn-primary">Contact Us Today</button>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-banner">
        <div className="container">
          <div className="cta-banner-content">
            <h2 className="cta-banner-title">Ready to Transform Your Store?</h2>
            <div className="cta-banner-buttons">
              <button className="btn-secondary btn-banner">Register Your Outlet</button>
              <button className="btn-secondary btn-banner">Login</button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default CTA;

