# VirtualFit - Virtual Try-On System

A modern virtual try-on platform for retail outlets, enabling customers to virtually try clothing items using AR technology. Built with React frontend and Flask backend.

![VirtualFit](https://img.shields.io/badge/VirtualFit-v1.0-blue)
![React](https://img.shields.io/badge/React-18.x-61DAFB)
![Flask](https://img.shields.io/badge/Flask-2.x-000000)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791)

## 🚀 Features

### For Outlets (Dashboard)
- **Product Inventory Management** - Add, edit, delete products with images
- **Real-time Session Tracking** - Monitor customer try-on sessions
- **Analytics Dashboard** - View metrics, category breakdowns, top products
- **Subscription Management** - Multiple plans with product limits
- **Multiple Payment Methods** - Add multiple cards, set default
- **Voucher System** - Apply discount codes during checkout

### For Customers (Try-On Screen)
- **AR Virtual Try-On** - See clothes on your body in real-time
- **AI Gesture Control** - Control the experience with hand gestures (Move, Click, Scroll)
- **Real-time Video Feed** - MJPEG streaming from backend AI engine
- **Category Filtering** - Browse by shirts, pants, etc.
- **Smart Selection** - Upper/lower body detection
- **Camera Integration** - Body scanning with tutorial

### Subscription Plans
| Plan | Products | Price | Features |
|------|----------|-------|----------|
| Trial | 10 | Free (7 days) | Basic features |
| Starter | 50 | $99/mo | Basic Analytics, Email Support |
| Professional | 200 | $129/mo | Advanced Analytics, Priority Support, Custom Branding |
| Enterprise | Unlimited | $299/mo | Full Suite, Dedicated Manager, API Access |

## 📋 Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.10+
- **OpenCV & MediaPipe** (for AI tracking)
- **PostgreSQL** 15+ (or use SQLite for development)

## 🛠️ Installation

### 1. Clone the Repository
```bash
git clone https://github.com/YOUR_USERNAME/VirtualFit.git
cd VirtualFit
```

### 2. Frontend Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```
Frontend runs at: `http://localhost:5173`

### 3. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
.\venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Setup environment variables
cp .env.example .env
# Edit .env with your database credentials
```

### 4. Database Setup
```bash
# Initialize database
flask db init
flask db migrate -m "Initial migration"
flask db upgrade

# Create test voucher (optional)
python create_test_voucher.py
```

### 5. Running the AI Gesture Engine
The gesture engine is integrated into the Flask app. Ensure `mediapipe`, `opencv-python`, and `pyautogui` are installed in your virtual environment:
```bash
pip install opencv-python mediapipe pyautogui
```

### 6. Start Backend Server
```bash
python run.py
```
Backend runs at: `http://localhost:5000`

## 🧠 AI Gesture Control & Streaming

VirtualFit uses a high-performance **Backend-AI Architecture**:
- **Gesture Engine**: A background Python thread running MediaPipe for sub-millisecond hand tracking.
- **Virtual Mouse**: Converts hand landmarks into physical mouse movements and clicks via `pyautogui`.
- **MJPEG Streaming**: Processed A.I. frames are streamed from Flask as `multipart/x-mixed-replace`, ensuring low latency and zero camera hardware conflicts with the browser.

## 🔧 Configuration

### Environment Variables (.env)
```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/virtualfit
SECRET_KEY=your-secret-key
JWT_SECRET_KEY=your-jwt-secret
UPLOAD_FOLDER=static/uploads
MAX_CONTENT_LENGTH=16777216
```

### For SQLite (Development)
```env
DATABASE_URL=sqlite:///virtualfit.db
```

## 📁 Project Structure

```
VirtualFit/
├── src/                    # Frontend React app
│   ├── components/         # Reusable components
│   ├── layouts/            # Layout components
│   ├── pages/              # Page components
│   │   ├── dashboard/      # Dashboard pages
│   │   │   ├── DashboardHome.jsx
│   │   │   ├── Inventory.jsx
│   │   │   ├── Sessions.jsx
│   │   │   ├── Analytics.jsx
│   │   │   ├── Subscription.jsx
│   │   │   └── Settings.jsx
│   │   ├── TryOn.jsx       # Customer try-on screen
│   │   ├── Login.jsx
│   │   └── Register.jsx
│   └── services/
│       └── api.js          # API service layer
│
├── backend/                # Flask backend
│   ├── app/
│   │   ├── models/         # Database models
│   │   │   ├── outlet.py
│   │   │   ├── product.py
│   │   │   ├── session.py
│   │   │   └── subscription.py
│   │   ├── routes/         # API routes
│   │   │   ├── auth.py
│   │   │   ├── products.py
│   │   │   ├── outlets.py
│   │   │   ├── sessions.py
│   │   │   └── subscriptions.py
│   │   └── __init__.py
│   ├── migrations/         # Database migrations
│   ├── static/uploads/     # Uploaded product images
│   ├── requirements.txt
│   └── run.py
│
└── README.md
```

## 🔐 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new outlet |
| POST | `/api/auth/login` | Login and get JWT token |

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | Get all products |
| POST | `/api/products` | Create product (with limit check) |
| PUT | `/api/products/:id` | Update product |
| DELETE | `/api/products/:id` | Delete product |

### Subscriptions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/subscriptions` | Get subscription status |
| POST | `/api/subscriptions/select-plan` | Select a plan |
| POST | `/api/subscriptions/validate-voucher` | Validate voucher code |
| POST | `/api/subscriptions/pay` | Process payment |
| GET | `/api/subscriptions/invoices` | Get billing history |
| POST | `/api/subscriptions/:id/cards` | Add payment method |
| DELETE | `/api/subscriptions/:id/cards/:cardId` | Remove card |

### Sessions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sessions` | Get all sessions |
| POST | `/api/sessions` | Create try-on session |
| GET | `/api/sessions/analytics` | Get session analytics |


## 📱 Usage

### 1. Register an Outlet
- Go to `/register`
- Fill in outlet details
- Login with credentials

### 2. Add Products
- Navigate to Inventory
- Click "Add New Item"
- Upload product image and details

### 3. Subscribe to a Plan
- Go to Subscription page
- Choose a plan
- Add payment method
- Apply voucher (optional)
- Complete payment

### 4. Launch Customer Screen
- From the Dashboard, click **Launch Screen**.
- The Dashboard will initialize the AI engine and then open the Try-On window.
- The Try-On screen will automatically start receiving the live AI video feed.
- Control the cursor with your hand:
    - **Move**: Use your index finger.
    - **Click**: Pinch index and middle fingers together.
    - **Exit**: Click "Stop & Close" on the Try-On screen or "Stop Virtual Try" on the Dashboard.

### 5. 360° Virtual Try-On (CatVTON on Colab)
The try-on engine is **CatVTON**, hosted on a free Colab T4 GPU and reached over a
tunnel. It runs once per captured body view (front/left/right/back) to build a
rotatable 360° result. Start the server with `colab/catvton_server.ipynb`, then
point the backend at the printed URL via `TRYON_API_URL` or
`POST /api/tryon/server`. Full instructions: **[`colab/README.md`](colab/README.md)**.

## 🎨 UI Design

The dashboard features a modern, brutalist design with:
- Bold typography and uppercase headings
- 2px borders with 3D shadow effects
- Material Symbols icons
- Dark mode support
- Responsive mobile layout

## 🔒 Security

- JWT-based authentication
- Protected routes (frontend)
- Password hashing with Werkzeug
- CORS configured for frontend origin

## 📄 License

This project is part of a Final Year Project (FYP).

## 👥 Contributors

- Khawaja Brothers Mazz Chishti
- Hammad Ali 
- Ussaid Zafar 

## 🆘 Support

For issues or questions, please open a GitHub issue.

---

**Built with ❤️ for retail innovation**
