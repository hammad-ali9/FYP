import './Testimonial.css';

function Testimonial() {
  return (
    <section className="testimonial section">
      <div className="container">
        <blockquote className="testimonial-quote">
          "Virtual Fit reduced our return rates by 65%. It's an essential tool for modern fashion retailers."
        </blockquote>
        <p className="testimonial-author">— Sarah Lee, Fashion Director</p>
        
        <div className="security-badges">
          <div className="badge">SECURITY</div>
          <div className="badge">ISO 27001</div>
          <div className="badge">SOC 2</div>
        </div>
      </div>
    </section>
  );
}

export default Testimonial;

