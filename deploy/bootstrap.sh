#!/usr/bin/env bash
# One-time server setup: Docker + a GitHub self-hosted Actions runner.
# Run on the server as the deploy user:
#   bash bootstrap.sh <RUNNER_REGISTRATION_TOKEN>
set -euo pipefail

REPO_URL="https://github.com/shahed-swe/backpacklink"
RUNNER_VERSION="2.335.1"
RUNNER_TOKEN="${1:-}"

echo "==> 1/4 Installing Docker (if missing)"
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sudo sh
fi
sudo usermod -aG docker "$USER" || true

echo "==> 2/4 Checking the env file"
if [ ! -f "$HOME/backpacklink.env" ]; then
  echo "!! Missing $HOME/backpacklink.env"
  echo "   Create it from deploy/backpacklink.env.example and fill in your secrets, then re-run."
  exit 1
fi

echo "==> 3/4 Installing the GitHub Actions runner"
mkdir -p "$HOME/actions-runner" && cd "$HOME/actions-runner"
if [ ! -f ./config.sh ]; then
  curl -fsSL -o runner.tar.gz \
    "https://github.com/actions/runner/releases/download/v${RUNNER_VERSION}/actions-runner-linux-x64-${RUNNER_VERSION}.tar.gz"
  tar xzf runner.tar.gz && rm runner.tar.gz
fi

if [ -z "$RUNNER_TOKEN" ]; then
  echo "!! No runner token given."
  echo "   Get one: GitHub repo → Settings → Actions → Runners → New self-hosted runner,"
  echo "   then re-run: bash bootstrap.sh <TOKEN>"
  exit 1
fi

if [ ! -f .runner ]; then
  ./config.sh --url "$REPO_URL" --token "$RUNNER_TOKEN" \
    --name "$(hostname)" --labels self-hosted,linux --unattended --replace
fi

echo "==> 4/4 Installing the runner as a service"
sudo ./svc.sh install "$USER"
sudo ./svc.sh start

echo ""
echo "✅ Done. The runner is online. Push to master (or run the Deploy workflow"
echo "   manually) to build & start the stack:  web:3000  api:4000  admin:3001"
echo "   NOTE: if 'docker' needs sudo, log out/in once so the docker group applies."
