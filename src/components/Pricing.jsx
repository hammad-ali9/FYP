import './Pricing.css';

function Pricing() {
  const plans = [
    {
      name: 'Starter',
      price: '$99',
      period: '/month',
      features: [
        'Up to 500 virtual try-ons/month',
        'Basic AI fitting technology',
        'Email support',
        'Standard integration',
        'Analytics dashboard'
      ],
      popular: false
    },
    {
      name: 'Professional',
      price: '$299',
      period: '/month',
      features: [
        'Up to 5,000 virtual try-ons/month',
        'Advanced AI fitting technology',
        'Priority email & phone support',
        'Custom integration',
        'Advanced analytics',
        'API access',
        'White-label options'
      ],
      popular: true
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      features: [
        'Unlimited virtual try-ons',
        'Premium AI technology',
        'Dedicated account manager',
        'Full customization',
        'Enterprise analytics',
        'Full API access',
        'Custom training & onboarding',
        'SLA guarantee'
      ],
      popular: false
    }
  ];

  return (
    <section className="pricing section" id="pricing">
      <div className="container">
        <h2 className="section-title">Pricing Plans</h2>
        
        <div className="pricing-grid">
          {plans.map((plan, index) => (
            <div key={index} className={`pricing-card card ${plan.popular ? 'popular' : ''}`}>
              {plan.popular && <div className="popular-badge">Most Popular</div>}
              
              <h3 className="pricing-name">{plan.name}</h3>
              
              <div className="pricing-price">
                <span className="price-amount">{plan.price}</span>
                {plan.period && <span className="price-period">{plan.period}</span>}
              </div>
              
              <ul className="pricing-features">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="feature-item">
                    <span className="check-icon">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
              
              <button className={`pricing-button ${plan.popular ? 'btn-primary' : 'btn-secondary'}`}>
                Get Started
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Pricing;

