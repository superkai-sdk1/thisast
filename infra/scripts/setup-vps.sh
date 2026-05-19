#!/usr/bin/env bash
# =============================================================================
# Эста CRM — VPS bootstrap for Ubuntu 24.04 LTS
# Usage: bash setup-vps.sh [--domain crm.yourdomain.com] [--email admin@yourdomain.com]
# =============================================================================
set -euo pipefail

# ── Colours ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
info()    { echo -e "${BLUE}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }

# ── Parse args ───────────────────────────────────────────────────────────────
DOMAIN=""
EMAIL=""
REPO_URL="https://github.com/superkai-sdk1/thisast.git"
DEPLOY_DIR="/opt/crm"
CRM_USER="crm"

while [[ $# -gt 0 ]]; do
  case $1 in
    --domain) DOMAIN="$2"; shift 2 ;;
    --email)  EMAIL="$2";  shift 2 ;;
    --repo)   REPO_URL="$2"; shift 2 ;;
    *) warn "Unknown option: $1"; shift ;;
  esac
done

# ── Root check ───────────────────────────────────────────────────────────────
[[ $EUID -ne 0 ]] && error "Run as root: sudo bash setup-vps.sh"

echo ""
echo -e "${BLUE}╔══════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Эста CRM — VPS Setup (Ubuntu 24.04)  ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════╝${NC}"
echo ""

# ── 1. System update ─────────────────────────────────────────────────────────
info "Updating system packages..."
apt-get update -qq
DEBIAN_FRONTEND=noninteractive apt-get upgrade -y -qq
apt-get install -y -qq \
  curl wget git unzip gnupg ca-certificates \
  ufw fail2ban htop jq nodejs npm
success "System updated"

# ── 2. Create deploy user ────────────────────────────────────────────────────
if ! id "$CRM_USER" &>/dev/null; then
  info "Creating system user '$CRM_USER'..."
  useradd -m -s /bin/bash -G sudo "$CRM_USER"
  success "User '$CRM_USER' created"
else
  info "User '$CRM_USER' already exists"
fi

# ── 3. Docker ────────────────────────────────────────────────────────────────
if ! command -v docker &>/dev/null; then
  info "Installing Docker..."
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
    | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg
  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
    https://download.docker.com/linux/ubuntu \
    $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update -qq
  apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  systemctl enable --now docker
  usermod -aG docker "$CRM_USER"
  usermod -aG docker root
  success "Docker installed ($(docker --version))"
else
  info "Docker already installed: $(docker --version)"
fi

# ── 4. Firewall ──────────────────────────────────────────────────────────────
info "Configuring UFW firewall..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
success "Firewall configured (22, 80, 443 open)"

# ── 5. Fail2ban ──────────────────────────────────────────────────────────────
info "Configuring fail2ban..."
cat > /etc/fail2ban/jail.local << 'EOF'
[sshd]
enabled  = true
port     = ssh
filter   = sshd
logpath  = /var/log/auth.log
maxretry = 5
bantime  = 3600
EOF
systemctl enable --now fail2ban
success "fail2ban configured"

# ── 6. Clone repository ──────────────────────────────────────────────────────
if [[ ! -d "$DEPLOY_DIR/.git" ]]; then
  info "Cloning repository to $DEPLOY_DIR..."
  git clone "$REPO_URL" "$DEPLOY_DIR"
  chown -R "$CRM_USER:$CRM_USER" "$DEPLOY_DIR"
  success "Repository cloned"
else
  info "Repository already exists at $DEPLOY_DIR, pulling latest..."
  cd "$DEPLOY_DIR" && git pull origin main
fi

# ── 7. Generate secrets ──────────────────────────────────────────────────────
info "Generating secrets..."

JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')
POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -d '\n/+=')
REDIS_PASSWORD=$(openssl rand -base64 32 | tr -d '\n/+=')
MEILI_MASTER_KEY=$(openssl rand -base64 32 | tr -d '\n/+=')
MINIO_ROOT_PASSWORD=$(openssl rand -base64 32 | tr -d '\n/+=')
IMGPROXY_KEY=$(openssl rand -hex 32)
IMGPROXY_SALT=$(openssl rand -hex 32)

# Generate VAPID keys using web-push
npm install -g web-push --quiet 2>/dev/null || true
VAPID_KEYS=$(web-push generate-vapid-keys --json 2>/dev/null || echo '{"publicKey":"REPLACE_ME","privateKey":"REPLACE_ME"}')
VAPID_PUBLIC=$(echo "$VAPID_KEYS"  | jq -r '.publicKey')
VAPID_PRIVATE=$(echo "$VAPID_KEYS" | jq -r '.privateKey')

success "Secrets generated"

# ── 8. Create .env ───────────────────────────────────────────────────────────
ENV_FILE="$DEPLOY_DIR/.env"

if [[ -f "$ENV_FILE" ]]; then
  warn ".env already exists — skipping generation (delete it to regenerate)"
else
  info "Writing $ENV_FILE..."

  [[ -z "$DOMAIN" ]]  && read -rp "  Enter your domain (e.g. crm.yourdomain.com): " DOMAIN
  [[ -z "$EMAIL" ]]   && read -rp "  Enter your email for Let's Encrypt: " EMAIL
  [[ -z "$DOMAIN" ]]  && error "Domain is required"
  [[ -z "$EMAIL" ]]   && error "Email is required"

  cat > "$ENV_FILE" << EOF
# Auto-generated by setup-vps.sh on $(date)
POSTGRES_USER=crm
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
POSTGRES_DB=crm_db

REDIS_PASSWORD=${REDIS_PASSWORD}

JWT_SECRET=${JWT_SECRET}

MEILI_MASTER_KEY=${MEILI_MASTER_KEY}

MINIO_ROOT_USER=minio_admin
MINIO_ROOT_PASSWORD=${MINIO_ROOT_PASSWORD}

IMGPROXY_KEY=${IMGPROXY_KEY}
IMGPROXY_SALT=${IMGPROXY_SALT}

VAPID_PUBLIC_KEY=${VAPID_PUBLIC}
VAPID_PRIVATE_KEY=${VAPID_PRIVATE}
VAPID_SUBJECT=mailto:${EMAIL}

DOMAIN=${DOMAIN}
CERTBOT_EMAIL=${EMAIL}

DOCKER_HUB_USER=
IMAGE_TAG=latest

NEXT_PUBLIC_API_URL=https://${DOMAIN}/api
NEXT_PUBLIC_VAPID_PUBLIC_KEY=${VAPID_PUBLIC}
EOF

  chmod 600 "$ENV_FILE"
  chown "$CRM_USER:$CRM_USER" "$ENV_FILE"
  success ".env created with generated secrets"
fi

# Load env vars
set -a; source "$ENV_FILE"; set +a

# ── 9. Nginx domain substitution ─────────────────────────────────────────────
info "Configuring nginx for domain '$DOMAIN'..."
NGINX_CONF="$DEPLOY_DIR/infra/nginx/conf.d/app.conf"
if [[ -n "$DOMAIN" ]] && grep -q '\${DOMAIN}' "$NGINX_CONF" 2>/dev/null; then
  sed -i "s/\${DOMAIN}/$DOMAIN/g" "$NGINX_CONF"
  success "Nginx config updated with domain"
fi

# ── 10. Create certbot directories ───────────────────────────────────────────
mkdir -p "$DEPLOY_DIR/infra/certbot/conf" "$DEPLOY_DIR/infra/certbot/www"
chown -R "$CRM_USER:$CRM_USER" "$DEPLOY_DIR/infra"

# ── 11. Pull Docker images ───────────────────────────────────────────────────
cd "$DEPLOY_DIR"

if [[ -z "${DOCKER_HUB_USER:-}" ]]; then
  warn "DOCKER_HUB_USER not set in .env — skipping image pull"
  warn "Set it and run: docker compose pull && docker compose up -d"
else
  info "Pulling infrastructure images..."
  docker compose pull postgres redis meilisearch minio imgproxy 2>/dev/null || true

  info "Starting infrastructure services first..."
  docker compose up -d postgres redis meilisearch minio
  sleep 15

  info "Pulling application images..."
  docker compose pull gateway svc-auth svc-properties svc-demands svc-deals svc-matching svc-notifications web nginx 2>/dev/null || \
    warn "Could not pull app images — push them first via GitHub Actions CI"
fi

# ── 12. Bootstrap Let's Encrypt (first run only) ─────────────────────────────
if [[ -n "$DOMAIN" && -n "$EMAIL" ]]; then
  CERT_PATH="$DEPLOY_DIR/infra/certbot/conf/live/$DOMAIN/fullchain.pem"
  if [[ ! -f "$CERT_PATH" ]]; then
    info "Obtaining Let's Encrypt certificate for $DOMAIN..."
    bash "$DEPLOY_DIR/infra/scripts/init-letsencrypt.sh" || \
      warn "Certificate issue — run init-letsencrypt.sh manually after DNS is pointed"
  else
    info "Certificate already exists for $DOMAIN"
  fi
fi

# ── 13. Run database migrations ──────────────────────────────────────────────
if docker compose ps svc-auth 2>/dev/null | grep -q "running\|Up"; then
  info "Running database migrations..."
  docker compose exec svc-auth node dist/database/migrate.js && success "Migrations complete" || \
    warn "Migration failed — run manually: docker compose exec svc-auth node dist/database/migrate.js"
else
  warn "svc-auth not running yet — run migrations manually after full deploy"
fi

# ── 14. Start all services ───────────────────────────────────────────────────
if [[ -n "${DOCKER_HUB_USER:-}" ]]; then
  info "Starting all services..."
  docker compose up -d
  sleep 10
  docker compose ps
fi

# ── 15. Certbot renewal cron ─────────────────────────────────────────────────
CRON_JOB="0 3 * * * cd $DEPLOY_DIR && docker compose run --rm certbot renew --quiet && docker compose exec nginx nginx -s reload"
(crontab -l 2>/dev/null | grep -v "certbot renew"; echo "$CRON_JOB") | crontab -
success "Certbot renewal cron installed (daily at 3am)"

# ── 16. Auto-deploy script ───────────────────────────────────────────────────
cat > /usr/local/bin/crm-deploy << 'DEPLOY_SCRIPT'
#!/usr/bin/env bash
# Run by GitHub Actions via SSH: ssh vps "crm-deploy <IMAGE_TAG>"
set -euo pipefail
TAG="${1:-latest}"
cd /opt/crm
git pull origin main
export IMAGE_TAG="$TAG"
source .env
docker compose pull gateway svc-auth svc-properties svc-demands svc-deals svc-matching svc-notifications web
docker compose up -d --no-deps gateway svc-auth svc-properties svc-demands svc-deals svc-matching svc-notifications web
docker compose exec svc-auth node dist/database/migrate.js
docker image prune -f
echo "✓ Deployed $TAG"
DEPLOY_SCRIPT
chmod +x /usr/local/bin/crm-deploy

# ── Done ─────────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║              Setup complete!                         ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${BLUE}Secrets file:${NC}  $ENV_FILE"
echo -e "  ${BLUE}Deploy dir:${NC}    $DEPLOY_DIR"
echo ""
echo -e "  ${YELLOW}Next steps:${NC}"
echo -e "  1. Point your DNS:  A  $DOMAIN  →  $(curl -s ifconfig.me 2>/dev/null || echo '<this server IP>')"
echo -e "  2. Add GitHub Secrets (DOCKER_HUB_USER, DOCKER_HUB_TOKEN, VPS_HOST, VPS_USER, VPS_SSH_KEY,"
echo -e "     NEXT_PUBLIC_API_URL, VAPID_PUBLIC_KEY)"
echo -e "  3. Push to main branch → CI builds images → deploys automatically"
echo -e "  4. Or manually: cd $DEPLOY_DIR && docker compose up -d"
echo ""
echo -e "  ${YELLOW}Useful commands:${NC}"
echo -e "  docker compose -f $DEPLOY_DIR/docker-compose.yml ps"
echo -e "  docker compose -f $DEPLOY_DIR/docker-compose.yml logs -f gateway"
echo -e "  docker compose exec svc-auth node dist/database/migrate.js"
echo ""
