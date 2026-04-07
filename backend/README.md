# Flask Backend for VirtualFit

## Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
```

## Environment Variables

Copy `.env.example` to `.env` and configure:
- `DATABASE_URL` - PostgreSQL connection string
- `SECRET_KEY` - JWT secret key

## Run

```bash
flask run --debug
```

API available at `http://localhost:5000`
