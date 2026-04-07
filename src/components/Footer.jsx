import './Footer.css';

function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-column">
            <div className="footer-logo">
              <div className="logo-icon"></div>
              <span className="logo-text">Virtual Fit</span>
            </div>
            <p className="footer-description">
              AI-powered virtual fitting for modern fashion retailers.
            </p>
          </div>
          
          <div className="footer-column">
            <h4 className="footer-heading">Resources</h4>
            <ul className="footer-links">
              <li><a href="#features">Features</a></li>
              <li><a href="#about">About</a></li>
              <li><a href="#contact">Contact Us</a></li>
            </ul>
          </div>
          
          <div className="footer-column">
            <h4 className="footer-heading">Legal</h4>
            <ul className="footer-links">
              <li><a href="#privacy">Privacy Policy</a></li>
              <li><a href="#terms">Terms & Conditions</a></li>
            </ul>
          </div>
          
          <div className="footer-column">
            <h4 className="footer-heading">Connect</h4>
            <div className="social-links">
              <a href="#" className="social-icon" aria-label="LinkedIn">in</a>
              <a href="#" className="social-icon" aria-label="Twitter">🐦</a>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>© 2025 Virtual Fit. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;

