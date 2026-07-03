# Deploy — self-hosted CI/CD

The stack (web + api + admin) deploys to the server via a **self-hosted GitHub
Actions runner**. Every push to `master` (or a manual "Deploy" run) rebuilds and
restarts the containers on the server.

```
push to master ─► GitHub Actions ─► self-hosted runner (on the server)
                                     └─► docker compose up -d --build
                                          web:3000 · api:4000 · admin:3001
```

## One-time server setup

SSH to the server, then:

### 1. Install Docker
```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER && exit   # log out; SSH back in so the group applies
```

### 2. Create the production env file
```bash
nano ~/backpacklink.env   # paste deploy/backpacklink.env.example and fill in secrets
```
Set the public URLs to the server's address (e.g. `http://135.119.89.30:4000`) and
use a **rotated** esimcard token + a strong `JWT_SECRET`.

### 3. Install & register the runner
```bash
mkdir -p ~/actions-runner && cd ~/actions-runner
curl -o r.tar.gz -L https://github.com/actions/runner/releases/download/v2.335.1/actions-runner-linux-x64-2.335.1.tar.gz
tar xzf r.tar.gz && rm r.tar.gz
./config.sh --url https://github.com/shahed-swe/backpacklink --token <RUNNER_TOKEN> --labels self-hosted,linux --unattended
sudo ./svc.sh install $USER
sudo ./svc.sh start
```
Get `<RUNNER_TOKEN>` from **repo → Settings → Actions → Runners → New self-hosted runner**
(it expires ~1 hour).

### 4. First deploy
Trigger the **Deploy (self-hosted)** workflow (Actions tab → Run workflow), or just
push to `master`. The runner builds and starts everything.

## Open the firewall
Allow the app ports (and 22):
```bash
sudo ufw allow 22,3000,4000,3001/tcp && sudo ufw enable
```

## Notes / next steps
- **HTTPS + domain:** put Nginx/Caddy in front and point `NEXT_PUBLIC_*` / `WEB_URL`
  at your domain; re-run the deploy so the browser URLs are baked correctly.
- **Postgres:** the api uses SQLite on a docker volume by default — fine to start,
  but switch `DATABASE_URL` + Prisma provider to Postgres for production scale.
- Secrets live only in `~/backpacklink.env` on the server — never in the repo.
