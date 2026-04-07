import './Hero.css';

function Hero() {
  return (
    <section className="hero section">
      <div className="container">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              Transform Your Store with <br />
              <span className="text-blue">AI-Powered Virtual Try-On</span>
            </h1>
            
            <p className="hero-description">
              Revolutionize your retail experience with cutting-edge AI technology. 
              Enable customers to virtually try on clothes, reduce returns, and 
              increase sales with our advanced virtual fitting solution.
            </p>

            <div className="hero-buttons">
              <button className="btn-primary">Register Your Outlet</button>
              <button className="btn-secondary">Login</button>
            </div>
          </div>

          <div className="hero-visual">
            <div className="mockup-frame">
              <div className="mockup-inner">
                <div className="dashboard-preview">
                  <div className="dashboard-header">
                    <div className="dashboard-nav">
                      <span>Virtual Fit</span>
                      <span>Try-On</span>
                      <span>Catalog</span>
                    </div>
                  </div>
                  <div className="dashboard-content">
                    <div className="avatar-preview">
                      <div className="avatar-placeholder">3D Avatar</div>
                    </div>
                    <div className="sidebar">
                      <div className="sidebar-item active">Body Scan</div>
                      <div className="sidebar-item">Garments</div>
                      <div className="sidebar-item">Fit Analysis</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;

