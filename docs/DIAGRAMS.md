# VirtualFit — FYP Diagram Reference

> **Realistic AI-Powered Virtual Try-On Platform**
> Extracted from the actual codebase. The original briefing template assumed
> Django / Three.js / PIFuHD / SMPL-X — **this project does not use those.**
> Real stack is below. Use this document to draw all 5 UML diagrams.

---

## 0. Actual Technology Stack

| Layer | Technology |
|-------|-----------|
| Presentation | React 18, Vite, React Router, brutalist CSS, Material Symbols icons |
| Frontend API layer | `src/services/api.js` (fetch + JWT in `localStorage`) |
| Business / API | Flask, Flask-JWT-Extended, Flask-CORS, Flask-Migrate (Alembic) |
| ORM | SQLAlchemy |
| Database | PostgreSQL 15 (prod) / SQLite (dev) |
| Gesture AI | MediaPipe Hands, OpenCV, `pyautogui` virtual mouse |
| Pose AI | MediaPipe Pose (`pose_analyzer.py`), Narrator (text guidance, Groq) |
| Try-On AI | **CatVTON** diffusion model on Colab **T4 GPU**, reached via tunnel URL |
| Streaming | MJPEG (`multipart/x-mixed-replace`) for the gesture video feed |
| File storage | Local disk `backend/uploads/`, served at `/uploads/<file>` |
| External | Colab GPU tunnel, HuggingFace (`HF_TOKEN`, legacy IDM-VTON), Groq (`GROQ_API_KEY`), public discovery JSON store |

**Ports:** Frontend `:5173` · Backend `:5000` · DB `:5432`

**Functional requirements:** Register outlet · Login · Forgot/Reset password ·
Manage product inventory (CRUD + image upload + limit check) · Select & pay
subscription · Apply voucher · Manage payment cards · Track try-on sessions &
analytics · Launch gesture-controlled customer screen · Capture body views ·
360° virtual try-on · Logout.

**User roles:** **Outlet (Store Staff)** — single role, owns dashboard.
**Customer** — anonymous kiosk user, no login, uses the Try-On screen.

---

## 1. Architecture Diagram

### Components & responsibilities
- **User** — Outlet staff (dashboard) and Customer (kiosk try-on).
- **React SPA (browser)** — `src/`. Dashboard pages + TryOn page. Shows MJPEG feed in an `<img>`, renders gesture cursor, calls REST API.
- **Flask Backend** (`:5000`) — REST `/api/*`. 7 blueprints: `auth`, `outlets`, `products`, `subscriptions`, `sessions`, `gestures`, `tryon`.
- **Gesture Engine** (`gesture_engine.py`) — background thread, MediaPipe hand tracking, `pyautogui` virtual mouse, produces JPEG frames.
- **Pose Analyzer + Narrator** — validate body pose per capture step, return spoken/text instructions.
- **CatVTON Engine (client)** (`catvton_engine.py`) — resolves images to base64, auto-discovers Colab tunnel URL, proxies multi-view try-on.
- **CatVTON Server** — Colab T4 GPU notebook, runs diffusion try-on per view → rotatable 360° result.
- **Database** — PostgreSQL/SQLite via SQLAlchemy.
- **File Storage** — `uploads/` for product + result images.

### Technology per layer
- Presentation: React, Vite, CSS, Material Symbols
- Business: Flask, JWT, CORS, Migrate
- AI: MediaPipe, OpenCV, pyautogui, CatVTON (diffusion)
- Data: SQLAlchemy, PostgreSQL/SQLite, local files

### External services
Colab GPU (CatVTON tunnel) · HuggingFace · Groq · public discovery JSON store.

### Mermaid
```mermaid
flowchart TB
    User([User: Staff / Customer])
    subgraph Client["Client — Browser :5173"]
        SPA[React SPA<br/>Dashboard + TryOn]
        API[services/api.js<br/>fetch + JWT]
        SPA --- API
    end
    subgraph Server["App Server — Flask :5000"]
        REST[REST API /api/*<br/>7 Blueprints]
        GE[Gesture Engine<br/>MediaPipe + pyautogui]
        PA[Pose Analyzer + Narrator]
        CV[CatVTON Client]
    end
    DB[(PostgreSQL / SQLite)]
    FS[/uploads/ File Storage/]
    GPU[CatVTON Server<br/>Colab T4 GPU]
    EXT[[HuggingFace / Groq /<br/>Discovery Store]]

    User --> SPA
    API -- REST/JSON + JWT --> REST
    API -- MJPEG video_feed --> GE
    REST --> DB
    REST --> FS
    REST --> PA
    REST --> CV
    CV -- HTTP tunnel --> GPU
    CV -. discover URL .-> EXT
    PA -. narration .-> EXT
```

---

## 2. Deployment Diagram

### Nodes / hardware
- **Client Device** (Desktop / Kiosk) — Chrome browser + webcam.
- **App Server** — Python 3.10, Flask, gesture engine thread, Vite (dev).
- **Database Server** — PostgreSQL 15.
- **GPU Node** — Colab T4, PyTorch + CUDA, CatVTON, exposed via tunnel URL.
- **File Storage** — `uploads/` on the app server disk.

### Protocols
HTTP/HTTPS REST (JSON + JWT) · MJPEG `multipart/x-mixed-replace` · HTTP tunnel to GPU.

### Hosting options
Local dev (current) · App → Render/Railway · DB → Supabase/managed Postgres ·
Frontend → Vercel · GPU → Colab / any CUDA host.

### Mermaid
```mermaid
flowchart LR
    subgraph ClientNode["Client Device (Kiosk)"]
        Chrome[Chrome Browser + Webcam]
    end
    subgraph AppNode["App Server — Python 3.10"]
        Flask[Flask App + Gesture Thread]
        Up[/uploads disk/]
    end
    subgraph DBNode["Database Server"]
        PG[(PostgreSQL 15)]
    end
    subgraph GPUNode["GPU Node — Colab T4"]
        CatVTON[CatVTON + PyTorch/CUDA]
    end

    Chrome -- HTTPS REST + JWT --> Flask
    Chrome -- MJPEG stream --> Flask
    Flask -- SQLAlchemy/TCP 5432 --> PG
    Flask -- HTTP tunnel --> CatVTON
    Flask --- Up
```

---

## 3. Package Diagram

```
Frontend (src/)
├── components/   Header, Hero, Features, Pricing, FAQ, CTA, Footer,
│                 Metrics, Testimonial, ValueProp, ProtectedRoute
├── layouts/      DashboardLayout
├── pages/        Home, Login, Register, ForgotPassword, ResetPassword, TryOn
│   └── dashboard/  DashboardHome, Inventory, Sessions, Analytics,
│                   Subscription, Settings, Profile
└── services/     api.js  (authAPI, outletsAPI, productsAPI,
                           subscriptionsAPI, sessionsAPI, gesturesAPI, tryonAPI)

Backend (backend/app/)
├── routes/   auth, outlets, products, subscriptions, sessions, gestures, tryon
├── models/   outlet, product, session, subscription, password_reset
└── utils/    gesture_engine, pose_analyzer, narrator,
              tryon_engine, catvton_engine, hand_tracking
```

**Dependencies:** pages → `services/api.js` → Flask `routes/*` → `models/*` → db.
`routes/tryon` → `utils/{catvton_engine, gesture_engine, pose_analyzer, narrator}`.
`routes/gestures` → `utils/gesture_engine`. `ProtectedRoute` → `authAPI`.

### Mermaid
```mermaid
flowchart TB
    subgraph FE[Frontend]
        Pages --> Services[services/api.js]
        Components
        Layouts
    end
    subgraph BE[Backend]
        Routes --> Models
        Routes --> Utils
        Models --> DBpkg[(db)]
    end
    Services -- REST --> Routes
    Utils -- proxy --> GPUpkg[CatVTON Colab]
```

---

## 4. Class Diagram

### Visibility key
`-` private attribute · `+` public method.

### Classes (models)

**Outlet** — table `outlets`
- `-id, -name, -email, -password_hash, -location, -api_key, -is_active, -created_at`
- `+to_dict()`

**Product** — table `products`
- `-id, -outlet_id, -name, -category, -price, -stock_status, -clothing_type,`
  `-image_url, -back_image_url, -additional_images, -segmentation_mask_path,`
  `-segmentation_ready, -created_at, -updated_at`
- `+to_dict()`

**TryOnSession** — table `try_on_sessions`
- `-id, -outlet_id, -kiosk_id, -started_at, -ended_at, -duration_seconds,`
  `-status, -products_tried_count`
- `+end_session(status), +to_dict()`

**TryOnEvent** — table `try_on_events`
- `-id, -session_id, -product_id, -product_name, -product_category,`
  `-product_type, -tried_at, -duration_seconds`
- `+to_dict()`

**Subscription** — table `subscriptions`
- `-id, -outlet_id, -plan_name, -plan_price, -billing_cycle, -status,`
  `-trial_ends_at, -started_at, -current_period_start, -current_period_end,`
  `-cancelled_at, -default_payment_method_id`
- `+is_trial_active(), +is_subscription_active(), +get_days_remaining(),`
  `+get_product_limit(), +create_trial(), +to_dict()`

**PaymentMethod** — table `payment_methods`
- `-id, -subscription_id, -card_brand, -card_last4, -card_expiry,`
  `-card_holder_name, -is_default, -created_at`
- `+to_dict()`

**Invoice** — table `invoices`
- `-id, -subscription_id, -outlet_id, -invoice_number, -amount, -currency,`
  `-status, -created_at, -paid_at, -description, -voucher_code, -discount_amount`
- `+to_dict()`

**Voucher** — table `vouchers`
- `-id, -code, -discount_type, -discount_value, -applicable_plans, -is_active,`
  `-valid_from, -valid_until, -max_uses, -times_used, -created_at`
- `+is_valid(plan), +calculate_discount(amount), +to_dict()`

**PasswordResetToken** — table `password_reset_tokens`
- `-id, -outlet_id, -token, -expires_at, -used, -created_at`
- `+generate_token(), +verify_token(), +mark_used()`

### Engine / utility classes (not persisted)
- **GestureEngine** — `+start(), +stop(), +get_frame(), +get_frame_raw(), -is_running`
- **PoseAnalyzer** — `+analyze_frame(frame, step, selected_upper, selected_lower)`
- **Narrator** — `+get_instruction(step)`
- **CatVTONEngine** — `+set_url(), +set_discovery_url(), +discover(),`
  `+is_configured(), +health(), +resolve_image_to_b64(), +tryon_multiview()`

### Relationships & multiplicity
- Outlet **1 — \*** Product (composition, cascade delete)
- Outlet **1 — \*** TryOnSession (composition)
- Outlet **1 — 1** Subscription
- Outlet **1 — \*** Invoice
- Outlet **1 — \*** PasswordResetToken
- TryOnSession **1 — \*** TryOnEvent (composition)
- TryOnEvent **\* — 0..1** Product (association, nullable snapshot)
- Subscription **1 — \*** PaymentMethod (composition)
- Subscription **1 — \*** Invoice (composition)
- Voucher **\* — \*** Invoice (association via `voucher_code`)

### Mermaid
```mermaid
classDiagram
    class Outlet {
        -id
        -name
        -email
        -password_hash
        -location
        -api_key
        -is_active
        -created_at
        +to_dict()
    }
    class Product {
        -id
        -outlet_id
        -name
        -category
        -price
        -stock_status
        -clothing_type
        -image_url
        -back_image_url
        +to_dict()
    }
    class TryOnSession {
        -id
        -outlet_id
        -kiosk_id
        -started_at
        -ended_at
        -duration_seconds
        -status
        -products_tried_count
        +end_session(status)
        +to_dict()
    }
    class TryOnEvent {
        -id
        -session_id
        -product_id
        -product_name
        -product_category
        -product_type
        -tried_at
        -duration_seconds
        +to_dict()
    }
    class Subscription {
        -id
        -outlet_id
        -plan_name
        -plan_price
        -status
        -trial_ends_at
        -default_payment_method_id
        +is_trial_active()
        +get_product_limit()
        +create_trial()
        +to_dict()
    }
    class PaymentMethod {
        -id
        -subscription_id
        -card_brand
        -card_last4
        -is_default
        +to_dict()
    }
    class Invoice {
        -id
        -subscription_id
        -outlet_id
        -invoice_number
        -amount
        -status
        -voucher_code
        +to_dict()
    }
    class Voucher {
        -id
        -code
        -discount_type
        -discount_value
        -max_uses
        -times_used
        +is_valid(plan)
        +calculate_discount(amount)
    }
    class PasswordResetToken {
        -id
        -outlet_id
        -token
        -expires_at
        -used
        +generate_token()
        +verify_token()
        +mark_used()
    }

    Outlet "1" *-- "*" Product
    Outlet "1" *-- "*" TryOnSession
    Outlet "1" o-- "1" Subscription
    Outlet "1" *-- "*" Invoice
    Outlet "1" *-- "*" PasswordResetToken
    TryOnSession "1" *-- "*" TryOnEvent
    TryOnEvent "*" --> "0..1" Product
    Subscription "1" *-- "*" PaymentMethod
    Subscription "1" *-- "*" Invoice
    Voucher "*" ..> "*" Invoice
```

---

## 5. Sequence Diagrams

### 5.1 User Login
```mermaid
sequenceDiagram
    actor Staff
    participant React as React (Login)
    participant API as Flask /api/auth
    participant DB as Database
    Staff->>React: enter email + password
    React->>API: POST /auth/login {email, password}
    API->>DB: Outlet.query by email
    DB-->>API: outlet row
    alt valid password & active
        API->>API: create JWT (7 days)
        API-->>React: 200 {access_token, outlet}
        React->>React: localStorage(token, outlet)
        React-->>Staff: redirect /dashboard
    else invalid / inactive
        API-->>React: 401 error
        React-->>Staff: show error message
    end
```

### 5.2 Register Outlet
```mermaid
sequenceDiagram
    actor Staff
    participant React as React (Register)
    participant API as Flask /api/outlets
    participant DB as Database
    Staff->>React: fill outlet details
    React->>API: POST /outlets {name,email,password,location}
    API->>DB: create Outlet (hash password)
    API->>DB: Subscription.create_trial(7 days)
    DB-->>API: outlet + trial
    API-->>React: 201 created
    React-->>Staff: redirect to Login
```

### 5.3 Add Product (with subscription limit check)
```mermaid
sequenceDiagram
    actor Staff
    participant React as React (Inventory)
    participant API as Flask /api/products
    participant Sub as Subscription
    participant FS as uploads/
    participant DB as Database
    Staff->>React: fill form + image
    React->>API: POST /products (FormData, JWT)
    API->>Sub: get_product_limit() vs product count
    alt under limit
        API->>FS: save image file
        API->>DB: insert Product
        API-->>React: 201 product
        React-->>Staff: show in inventory
    else limit reached
        API-->>React: 403 limit reached
        React-->>Staff: prompt to upgrade plan
    end
```

### 5.4 Subscription Payment (select → voucher → pay)
```mermaid
sequenceDiagram
    actor Staff
    participant React as React (Subscription)
    participant API as Flask /api/subscriptions
    participant V as Voucher
    participant DB as Database
    Staff->>React: choose plan
    React->>API: POST /select-plan {outlet_id, plan}
    API->>DB: set Subscription pending_payment
    opt apply voucher
        React->>API: POST /validate-voucher {code, plan}
        API->>V: is_valid(plan) + calculate_discount()
        V-->>API: discount
        API-->>React: discounted amount
    end
    React->>API: POST /pay {subscription_id, payment_method_id, voucher_code}
    API->>DB: activate Subscription + create Invoice
    API-->>React: 200 active subscription
    React-->>Staff: show active plan + invoice
```

### 5.5 Launch Gesture-Controlled Screen
```mermaid
sequenceDiagram
    actor Staff
    participant React as React (Dashboard/TryOn)
    participant API as Flask /api/gestures
    participant GE as Gesture Engine
    actor Customer
    Staff->>React: click Launch Screen
    React->>API: POST /gestures/start
    API->>GE: start() MediaPipe thread + camera
    GE-->>API: running
    API-->>React: ok
    React->>API: GET /gestures/video_feed (img src)
    API-->>React: MJPEG stream (multipart/x-mixed-replace)
    loop live
        Customer->>GE: hand moves / pinch
        GE->>GE: pyautogui move cursor / click
    end
    Staff->>API: POST /gestures/stop
    API->>GE: stop()
```

### 5.6 360° Virtual Try-On (CatVTON multi-view)
```mermaid
sequenceDiagram
    actor Customer
    participant React as React (TryOn)
    participant API as Flask /api/tryon
    participant PA as Pose Analyzer + Narrator
    participant GE as Gesture Engine
    participant CV as CatVTON Client
    participant GPU as Colab T4 (CatVTON)
    loop step in FRONT, LEFT, RIGHT, BACK
        React->>API: POST /tryon/analyze {step, upper, lower}
        API->>PA: analyze_frame + get_instruction
        PA-->>API: pose feedback + narration
        API-->>React: guidance
        React->>API: POST /tryon/capture
        API->>GE: get_frame()
        GE-->>API: JPEG -> base64 person image
        API-->>React: image_b64
    end
    React->>API: POST /tryon/generate_multiview {person_images, garment, type}
    API->>CV: discover() tunnel URL + resolve garment b64
    alt server configured
        CV->>GPU: run CatVTON per view
        GPU-->>CV: result image per view
        CV-->>API: {results}
        API-->>React: 200 {success, results}
        React-->>Customer: rotatable 360 try-on
    else not configured
        API-->>React: 503 start Colab notebook
    else all views fail
        API-->>React: 502 all views failed
    end
```

### 5.7 Logout
```mermaid
sequenceDiagram
    actor Staff
    participant React
    Staff->>React: click Logout
    React->>React: clear localStorage(token, outlet)
    React-->>Staff: redirect to Login
    note over React: JWT is stateless — no server call
```

### Alternative / error flows (all use cases)
- Invalid login → 401 · Inactive outlet → 401
- Duplicate email on register → conflict
- Product over plan limit → 403
- Invalid/expired voucher → reject
- Try-on server not configured → 503 · all views fail → 502
- No camera frame → 400/500 · camera busy → 500
- Expired/used reset token → 400

---

## 6. Diagram Build Order
1. Architecture → 2. Deployment → 3. Package → 4. Class → 5. Sequence (one per use case).

## 7. How to render
- Paste any ` ```mermaid ` block into **https://mermaid.live** → export PNG/SVG.
- Or open this file in VS Code with the *Markdown Preview Mermaid* extension.
- For draw.io: Extras → Edit Diagram, or use the Mermaid import.
