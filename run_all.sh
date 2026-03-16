#!/bin/bash
set -e

WORKDIR="$(pwd)"

# 1) Backend
cd backend
if [ ! -f .env ]; then
  cp .env.example .env
fi
# Update these lines with real credentials if needed (optional)
# sed -i '' 's/DB_PASSWORD=.*/DB_PASSWORD=Password123!/g' .env
# sed -i '' 's/ANTHROPIC_API_KEY=.*/ANTHROPIC_API_KEY=your_api_key_here/g' .env

npm install
node seed.js
# Start backend in background and write log
PORT=5001 npm start > ../backend.log 2>&1 &
BACKEND_PID=$!

echo "[run_all] Backend started PID=$BACKEND_PID"

# 2) Python service
cd ../python-service
pip install -r requirements.txt
python3 -m uvicorn main:app --reload --host 0.0.0.0 --port 8000 > ../python.log 2>&1 &
PYTHON_PID=$!
echo "[run_all] Python service started PID=$PYTHON_PID"

# 3) Frontend
cd ../frontend
npm install
npm start > ../frontend.log 2>&1 &
FRONTEND_PID=$!
echo "[run_all] Frontend started PID=$FRONTEND_PID"

sleep 8

# 4) Health checks
echo "--- health checks ---"
curl -s -o /dev/null -w 'backend:%{http_code}\n' http://localhost:5001/api/health
curl -s -o /dev/null -w 'python:%{http_code}\n' http://localhost:8000/health
curl -s -o /dev/null -w 'frontend:%{http_code}\n' http://localhost:3000

# 5) Return to original dir
cd "$WORKDIR"

cat <<EOF
Run complete.
backend pid: $BACKEND_PID
python pid: $PYTHON_PID
frontend pid: $FRONTEND_PID
Logs: backend.log python.log frontend.log
EOF
