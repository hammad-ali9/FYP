import './Metrics.css';

function Metrics() {
  return (
    <section className="metrics section">
      <div className="container">
        <h2 className="section-title">Virtual Fit in Action: Metrics That Matter</h2>
        
        <div className="metrics-stats">
          <div className="stat-item">
            <div className="stat-number">15</div>
            <div className="stat-label">Seconds</div>
            <div className="stat-description">Average Fit Analysis Time</div>
          </div>
          
          <div className="stat-item">
            <div className="stat-number">15,000+</div>
            <div className="stat-label">Users</div>
            <div className="stat-description">Successfully Fitted</div>
          </div>
          
          <div className="stat-item">
            <div className="stat-number">99.9%</div>
            <div className="stat-label">Accuracy</div>
            <div className="stat-description">Fit Prediction Rate</div>
          </div>
        </div>

        <div className="workflow">
          <div className="workflow-step">
            <div className="workflow-icon">📤</div>
            <div className="workflow-label">Upload</div>
          </div>
          <div className="workflow-arrow">→</div>
          <div className="workflow-step">
            <div className="workflow-icon">🔍</div>
            <div className="workflow-label">Analyze</div>
          </div>
          <div className="workflow-arrow">→</div>
          <div className="workflow-step">
            <div className="workflow-icon">👗</div>
            <div className="workflow-label">Try-On</div>
          </div>
          <div className="workflow-arrow">→</div>
          <div className="workflow-step">
            <div className="workflow-icon">✅</div>
            <div className="workflow-label">Purchase</div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Metrics;

