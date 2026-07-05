#!/bin/bash
set -euo pipefail

echo "Updating system packages..."
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg lsb-release git docker.io docker-compose-plugin

sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker "$USER"

echo "Installing Docker Compose plugin..."
sudo docker compose version

echo "Preparing repository..."
cd /home/ubuntu || cd /home/ec2-user
REPO_URL="${GITHUB_REPO_URL:-https://github.com/rishabhmishra51/justice-ai.git}"

if [ -n "${GITHUB_TOKEN:-}" ] && [[ "$REPO_URL" == https://github.com/* ]]; then
  REPO_URL="https://x-access-token:${GITHUB_TOKEN}@github.com/${REPO_URL#https://github.com/}"
fi

if [ ! -d justice-ai ]; then
  git clone "$REPO_URL" justice-ai
fi
cd justice-ai

git remote set-url origin "$REPO_URL" 2>/dev/null || true
git pull origin main

cat > .env <<'EOF'
MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD:-change_me}
DB_PASSWORD=${DB_PASSWORD:-change_me}
JWT_SECRET=${JWT_SECRET:-change_me}
REACT_APP_API_URL=${REACT_APP_API_URL:-http://localhost:5001/api}
GROQ_API_KEY=${GROQ_API_KEY:-}
OPENAI_API_KEY=${OPENAI_API_KEY:-}
ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY:-}
EOF

sudo docker compose up -d --build

echo "Deployment complete."
echo "Frontend: http://$(curl -s ifconfig.me):3000"
echo "Backend: http://$(curl -s ifconfig.me):5001/api/health"
