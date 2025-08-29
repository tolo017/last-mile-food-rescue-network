# last-mile-food-rescue-network
Connect specified users to collect surplus food in real time.

EcoSawa MVP — quick start

1) Install Node dependencies
  cd backend
  npm install

2) Copy .env.example to .env and edit if needed.

3) Start backend (creates SQLite DB automatically)
  npm start
  or for dev:
  npm run dev

4) Open browser at http://localhost:3000

5) To run scorer:
  cd python_microservice
  pip install -r requirements.txt
  python scorer.py

Notes:
- InstaSend: If you don't configure INSTA_API_BASE (leave example), bookings are simulated.
- Webhook endpoint: /api/webhook/instasend
- DB file: backend/db/feed_sawa.sqlite
