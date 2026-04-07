import { useState } from 'react';
import './FAQ.css';

function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: 'How accurate is the virtual try-on technology?',
      answer: 'Our AI-powered virtual try-on uses advanced 3D modeling and body scanning technology to provide 95%+ accuracy in fit prediction. Customers can see exactly how garments will look and fit before purchasing.'
    },
    {
      question: 'What kind of integration is required?',
      answer: 'We offer seamless integration with most e-commerce platforms including Shopify, WooCommerce, and Magento. Our API can also be integrated into custom solutions. Setup typically takes 1-2 business days.'
    },
    {
      question: 'Can I customize the virtual try-on experience?',
      answer: 'Yes! Professional and Enterprise plans include customization options. You can customize the interface, branding, and even add your own styling preferences to match your store\'s aesthetic.'
    },
    {
      question: 'What happens if a customer still wants to return an item?',
      answer: 'While our technology significantly reduces returns, standard return policies still apply. However, our data shows that stores using Virtual Fit experience 60% fewer returns on average.'
    },
    {
      question: 'Is there a limit on the number of products I can add?',
      answer: 'Starter plan includes up to 500 products, Professional plan includes up to 5,000 products, and Enterprise plan has unlimited products. Additional product slots can be purchased if needed.'
    },
    {
      question: 'Do you provide training for my team?',
      answer: 'Yes! All plans include onboarding support. Professional and Enterprise plans include comprehensive training sessions. Enterprise customers receive dedicated training and ongoing support.'
    }
  ];

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="faq section" id="faq">
      <div className="container">
        <h2 className="section-title">Frequently Asked Questions</h2>
        
        <div className="faq-list">
          {faqs.map((faq, index) => (
            <div key={index} className={`faq-item ${openIndex === index ? 'open' : ''}`}>
              <button 
                className="faq-question" 
                onClick={() => toggleFAQ(index)}
              >
                <span>{faq.question}</span>
                <span className="faq-icon">{openIndex === index ? '−' : '+'}</span>
              </button>
              <div className="faq-answer">
                <p>{faq.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default FAQ;

