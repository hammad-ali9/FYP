import './Features.css';

function Features() {
  const steps = [
    {
      number: '1',
      title: 'Upload & Scan',
      description: 'Customers upload a photo or use our body scanning technology to create their virtual avatar.'
    },
    {
      number: '2',
      title: 'Browse & Select',
      description: 'Browse your store catalog and select items to try on virtually in real-time.'
    },
    {
      number: '3',
      title: 'Virtual Try-On',
      description: 'AI-powered technology instantly shows how the garment fits and looks on the customer.'
    },
    {
      number: '4',
      title: 'Purchase with Confidence',
      description: 'Customers make informed decisions, leading to higher satisfaction and fewer returns.'
    }
  ];

  return (
    <section className="features section" id="features">
      <div className="container">
        <h2 className="section-title">How It Works</h2>
        
        <div className="how-it-works">
          {steps.map((step, index) => (
            <div key={index} className="step-item">
              <div className="step-number">{step.number}</div>
              <div className="step-content">
                <h3 className="step-title">{step.title}</h3>
                <p className="step-description">{step.description}</p>
              </div>
              {index < steps.length - 1 && <div className="step-connector">→</div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Features;

