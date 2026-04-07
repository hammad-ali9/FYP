# Virtual Fit Project Structure Guide

## 📁 Project Structure

```
react01/
├── src/
│   ├── components/          # All React components
│   │   ├── Header.jsx       # Navigation bar component
│   │   ├── Header.css       # Header styles
│   │   ├── Hero.jsx         # Hero section with main CTA
│   │   ├── Hero.css         # Hero styles
│   │   ├── ValueProp.jsx    # Value proposition banner
│   │   ├── ValueProp.css    # Value prop styles
│   │   ├── Features.jsx     # Features section (3 cards)
│   │   ├── Features.css     # Features styles
│   │   ├── Metrics.jsx      # Statistics and workflow section
│   │   ├── Metrics.css      # Metrics styles
│   │   ├── Testimonial.jsx  # Customer testimonial
│   │   ├── Testimonial.css  # Testimonial styles
│   │   ├── CTA.jsx          # Call-to-action sections
│   │   ├── CTA.css          # CTA styles
│   │   ├── Footer.jsx       # Footer component
│   │   └── Footer.css       # Footer styles
│   ├── styles/
│   │   └── globals.css      # Global styles and CSS variables
│   ├── App.jsx              # Main app component (imports all sections)
│   ├── App.css              # App-specific styles (not used currently)
│   ├── index.css            # Entry point CSS (imports globals)
│   └── main.jsx             # React entry point
├── package.json
└── vite.config.js
```

## 🎨 Color Scheme (Based on CLIA Design)

The colors are defined in `src/styles/globals.css` as CSS variables:

- **Primary Dark**: `#1E3A8A` - Used for headers, buttons, logo
- **Primary Light**: `#3B82F6` - Used for accents and highlights
- **Text Dark**: `#1F2937` - Main text color
- **Text Gray**: `#6B7280` - Secondary text color
- **Background White**: `#FFFFFF` - Main background
- **Background Light**: `#F9FAFB` - Light gray backgrounds
- **Border Gray**: `#E5E7EB` - Border colors

## 📝 Component Guide

### 1. **Header Component** (`src/components/Header.jsx`)
- Contains navigation bar with logo, menu items, and login button
- Sticky header that stays at top when scrolling
- **To modify**: Edit `Header.jsx` for structure, `Header.css` for styling

### 2. **Hero Component** (`src/components/Hero.jsx`)
- Main landing section with headline, description, and CTAs
- Includes a mockup preview of the dashboard
- **To modify**: Edit `Hero.jsx` for content, `Hero.css` for layout

### 3. **ValueProp Component** (`src/components/ValueProp.jsx`)
- Simple banner with value proposition text
- **To modify**: Edit the text in `ValueProp.jsx`

### 4. **Features Component** (`src/components/Features.jsx`)
- Displays 3 feature cards in a grid
- **To modify**: Edit the `features` array in `Features.jsx` to add/remove features

### 5. **Metrics Component** (`src/components/Metrics.jsx`)
- Shows statistics and workflow diagram
- **To modify**: Edit the numbers and labels in `Metrics.jsx`

### 6. **Testimonial Component** (`src/components/Testimonial.jsx`)
- Customer testimonial quote and security badges
- **To modify**: Edit the quote and author in `Testimonial.jsx`

### 7. **CTA Component** (`src/components/CTA.jsx`)
- Two CTA cards and a final banner
- **To modify**: Edit button text and links in `CTA.jsx`

### 8. **Footer Component** (`src/components/Footer.jsx`)
- Footer with logo, links, and social media
- **To modify**: Edit links and content in `Footer.jsx`

## 🔧 How to Customize

### Changing Colors
Edit `src/styles/globals.css` and modify the CSS variables in `:root`:
```css
:root {
  --primary-dark: #1E3A8A;  /* Change this */
  --primary-light: #3B82F6; /* Change this */
  /* ... */
}
```

### Adding a New Section
1. Create a new component file: `src/components/NewSection.jsx`
2. Create its CSS file: `src/components/NewSection.css`
3. Import and add it to `src/App.jsx`:
```jsx
import NewSection from './components/NewSection';

function App() {
  return (
    <div className="App">
      {/* ... other components ... */}
      <NewSection />
    </div>
  );
}
```

### Modifying Text Content
- Open the component file (e.g., `Hero.jsx`)
- Find the text you want to change
- Edit directly in the JSX

### Changing Layout/Spacing
- Each component has its own CSS file
- Modify padding, margins, grid layouts in the respective `.css` file
- Global spacing utilities are in `globals.css`

## 🚀 Running the Project

```bash
npm run dev
```

The project will be available at `http://localhost:5173` (or another port if 5173 is busy).

## 📦 Dependencies

No additional libraries are required! The project uses only:
- React (already installed)
- Pure CSS (no Tailwind, no styled-components)

All styling is done with vanilla CSS using CSS variables for theming.

