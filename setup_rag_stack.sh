#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="${1:-/home/euler/QA_SYSTEM}"
BACKEND_DIR="${PROJECT_DIR}/backend"
FRONTEND_DIR="${PROJECT_DIR}/frontend"

echo "==> Checking project directory..."
[[ -d "$PROJECT_DIR" ]] || { echo "Project directory not found: $PROJECT_DIR"; exit 1; }
[[ -d "$BACKEND_DIR" ]] || { echo "Backend directory not found: $BACKEND_DIR"; exit 1; }
[[ -d "$FRONTEND_DIR" ]] || { echo "Frontend directory not found: $FRONTEND_DIR"; exit 1; }
[[ -f "$PROJECT_DIR/docker-compose.yml" ]] || { echo "docker-compose.yml not found in: $PROJECT_DIR"; exit 1; }

echo "==> Detecting OS..."
[[ -f /etc/os-release ]] || { echo "/etc/os-release not found"; exit 1; }
. /etc/os-release

if [[ "${ID}" != "ubuntu" && "${ID}" != "debian" ]]; then
  echo "This script currently supports Ubuntu/Debian only."
  echo "Detected OS: ${ID}"
  exit 1
fi

echo "==> Installing Docker Engine and Compose plugin..."
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg

sudo install -m 0755 -d /etc/apt/keyrings

if [[ ! -f /etc/apt/keyrings/docker.gpg ]]; then
  curl -fsSL "https://download.docker.com/linux/${ID}/gpg" | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
fi

sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/${ID} \
  ${VERSION_CODENAME} stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

echo "==> Enabling Docker service..."
sudo systemctl enable docker
sudo systemctl start docker

echo "==> Installing Node.js and npm..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

echo "==> Node.js version"
node -v
npm -v

NEED_NEWGRP=0
if ! groups "$USER" | grep -q '\bdocker\b'; then
  echo "==> Adding user to docker group..."
  sudo usermod -aG docker "$USER"
  NEED_NEWGRP=1
fi

run_stack() {
  cd "$PROJECT_DIR"

  echo "==> Docker version"
  docker --version
  docker compose version

  echo "==> Starting containers..."
  docker compose up -d --build

  echo "==> Current container status"
  docker compose ps

  echo
  echo "==> API logs (last 50 lines)"
  docker compose logs --tail=50 api || true

  echo
  echo "==> Done."
  echo "Project path: $PROJECT_DIR"
  echo "Frontend: http://$(hostname -I | awk '{print $1}'):3000"
  echo "API:      http://$(hostname -I | awk '{print $1}'):8000"
}

if [[ "$NEED_NEWGRP" -eq 1 ]]; then
  echo
  echo "Docker group updated. Re-running in a new shell..."
  exec newgrp docker <<EOF
set -euo pipefail
cd "$PROJECT_DIR"

docker --version
docker compose version
docker compose up -d --build
docker compose ps
echo
docker compose logs --tail=50 api || true
echo
echo "Done."
echo "Project path: $PROJECT_DIR"
echo "Frontend: http://\$(hostname -I | awk '{print \$1}'):3000"
echo "API:      http://\$(hostname -I | awk '{print \$1}'):8000"
EOF
else
  run_stack
fi