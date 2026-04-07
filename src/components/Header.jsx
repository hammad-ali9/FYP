import './Header.css';

function Header() {
  return (
    <header className="header">
      <div className="container">
        <nav className="navbar">
          <div className="logo-container">
            <div className="logo-icon"></div>
            <span className="logo-text">Virtual Fit</span>
          </div>
          
          <ul className="nav-links">
            <li><a href="#home">Home</a></li>
            <li><a href="#features">Features</a></li>
            <li><a href="#about">About</a></li>
            <li><a href="#contact">Contact Us</a></li>
          </ul>
          
          <button className="btn-login">Secure Login</button>
        </nav>
      </div>
    </header>
  );
}

export default Header;

