import './ValueProp.css';

function ValueProp() {
  return (
    <section className="value-prop">
      <div className="container">
        <div className="value-prop-content">
          <div className="value-prop-grid">
            <div className="value-prop-item">
              <div className="value-prop-icon">📈</div>
              <h3 className="value-prop-title">Increase Sales</h3>
              <p className="value-prop-desc">Boost conversion rates with confident customers who can see how clothes fit before buying</p>
            </div>
            <div className="value-prop-item">
              <div className="value-prop-icon">↩️</div>
              <h3 className="value-prop-title">Reduce Returns</h3>
              <p className="value-prop-desc">Minimize return rates by up to 60% with accurate virtual fitting technology</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ValueProp;

