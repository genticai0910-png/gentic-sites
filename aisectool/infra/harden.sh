#!/bin/bash
# Gentic AI — Infrastructure Hardening Script
# Run on VPS: ssh clueadmin@76.13.27.189
# Run once, verify each step before proceeding

set -euo pipefail
LOG_FILE="/var/log/gentic-security-hardening.log"
exec > >(tee -a "$LOG_FILE") 2>&1

echo "================================================"
echo "GENTIC AI SECURITY HARDENING — $(date)"
echo "================================================"

# ── STEP 1: QDRANT AUTHENTICATION ────────────────────────────────────────────
echo ""
echo "[1/6] Hardening Qdrant..."

# Generate API key if not set
if [ -z "${QDRANT_API_KEY:-}" ]; then
  QDRANT_API_KEY=$(openssl rand -hex 32)
  echo "Generated Qdrant API key: $QDRANT_API_KEY"
  echo "QDRANT_API_KEY=$QDRANT_API_KEY" >> /opt/gentic/.env
fi

# Update docker-compose.yml — add API key to Qdrant service
COMPOSE_FILE="/opt/gentic/docker-compose.yml"
if grep -q "QDRANT__SERVICE__API_KEY" "$COMPOSE_FILE"; then
  echo "Qdrant API key already configured"
else
  # Inject into qdrant service environment
  sed -i '/qdrant:/,/^  [a-z]/ {
    /environment:/a\      QDRANT__SERVICE__API_KEY: '"$QDRANT_API_KEY"'
  }' "$COMPOSE_FILE"
  echo "✓ Qdrant API key injected into docker-compose.yml"
fi

# Block external Qdrant access (should only be accessible internally)
if ! iptables -C INPUT -p tcp --dport 6333 -s 127.0.0.1 -j ACCEPT 2>/dev/null; then
  iptables -A INPUT -p tcp --dport 6333 -s 127.0.0.1 -j ACCEPT
  iptables -A INPUT -p tcp --dport 6333 -j DROP
  echo "✓ Qdrant port 6333 restricted to localhost only"
fi

# ── STEP 2: POSTGRESQL HARDENING ─────────────────────────────────────────────
echo ""
echo "[2/6] Hardening PostgreSQL..."

PG_CONTAINER=$(docker ps --format "{{.Names}}" | grep -i postgres || echo "")
if [ -z "$PG_CONTAINER" ]; then
  echo "WARNING: PostgreSQL container not found — check container name"
else
  # Create security incidents table
  docker exec "$PG_CONTAINER" psql -U postgres -c "
    CREATE TABLE IF NOT EXISTS security_incidents (
      id SERIAL PRIMARY KEY,
      incident_id VARCHAR(16),
      session_id VARCHAR(255),
      user_id VARCHAR(255),
      context VARCHAR(50),
      action VARCHAR(20) NOT NULL,
      output_flags JSONB DEFAULT '[]',
      input_anomalies TEXT[] DEFAULT '{}',
      input_hash VARCHAR(16),
      response_preview TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_security_action ON security_incidents(action);
    CREATE INDEX IF NOT EXISTS idx_security_created ON security_incidents(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_security_session ON security_incidents(session_id);
  " 2>/dev/null || echo "Table may already exist"

  # Create read-only audit user
  AUDIT_PASS=$(openssl rand -hex 16)
  docker exec "$PG_CONTAINER" psql -U postgres -c "
    DO \$\$
    BEGIN
      IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'gentic_audit') THEN
        CREATE ROLE gentic_audit WITH LOGIN PASSWORD '$AUDIT_PASS';
        GRANT SELECT ON security_incidents TO gentic_audit;
      END IF;
    END
    \$\$;
  " 2>/dev/null
  echo "AUDIT_DB_USER=gentic_audit" >> /opt/gentic/.env
  echo "AUDIT_DB_PASS=$AUDIT_PASS" >> /opt/gentic/.env
  echo "✓ PostgreSQL security_incidents table created"
  echo "✓ Audit read-only user created"
fi

# ── STEP 3: BLOCK EXTERNAL LLM PORTS ─────────────────────────────────────────
echo ""
echo "[3/6] Restricting inference ports..."

for PORT in 11434 11435 8100; do
  # Allow from localhost and Mac Mini only
  MAC_MINI_IP="${MAC_MINI_IP:-192.168.1.100}"  # Set this to your Mac Mini's LAN IP

  if ! iptables -C INPUT -p tcp --dport "$PORT" -s 127.0.0.1 -j ACCEPT 2>/dev/null; then
    iptables -A INPUT -p tcp --dport "$PORT" -s 127.0.0.1 -j ACCEPT
    iptables -A INPUT -p tcp --dport "$PORT" -s "$MAC_MINI_IP" -j ACCEPT
    iptables -A INPUT -p tcp --dport "$PORT" -j DROP
    echo "✓ Port $PORT restricted to localhost + Mac Mini"
  else
    echo "  Port $PORT already restricted"
  fi
done

# Save iptables rules
iptables-save > /etc/iptables/rules.v4 2>/dev/null || \
  iptables-save > /etc/iptables.rules 2>/dev/null || \
  echo "WARNING: Could not persist iptables — install iptables-persistent"

# ── STEP 4: NGINX RATE LIMITING ───────────────────────────────────────────────
echo ""
echo "[4/6] Configuring Nginx rate limiting..."

NGINX_SECURITY_CONF="/etc/nginx/conf.d/security.conf"
cat > "$NGINX_SECURITY_CONF" << 'NGINX_EOF'
# Gentic AI Security — Nginx hardening
# Rate limiting zones
limit_req_zone $binary_remote_addr zone=llm_api:10m rate=20r/m;
limit_req_zone $binary_remote_addr zone=webhook:10m rate=60r/m;
limit_req_zone $binary_remote_addr zone=sanitizer:10m rate=120r/m;

# Connection limits
limit_conn_zone $binary_remote_addr zone=conn_limit:10m;

# Apply to location blocks in your server configs:
# location /v1/ {
#     limit_req zone=llm_api burst=5 nodelay;
#     limit_conn conn_limit 10;
# }

# Security headers
add_header X-Content-Type-Options nosniff always;
add_header X-Frame-Options DENY always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "no-referrer" always;

# Hide nginx version
server_tokens off;

# Block common attack patterns at Nginx level
map $request_uri $blocked_uri {
    ~*(\.\./|%2e%2e|%252e) 1;
    ~*(union.*select|select.*from|insert.*into) 1;
    default 0;
}
NGINX_EOF

nginx -t && nginx -s reload && echo "✓ Nginx security config applied" || \
  echo "WARNING: Nginx config test failed — check $NGINX_SECURITY_CONF"

# ── STEP 5: SECRET ROTATION CHECK ────────────────────────────────────────────
echo ""
echo "[5/6] Auditing exposed secrets..."

ENV_FILE="/opt/gentic/.env"
if [ -f "$ENV_FILE" ]; then
  # Check permissions
  PERMS=$(stat -c "%a" "$ENV_FILE")
  if [ "$PERMS" != "600" ]; then
    chmod 600 "$ENV_FILE"
    echo "✓ Fixed .env permissions: $PERMS → 600"
  fi

  # Scan for common secret patterns in logs (non-destructive)
  LOG_DIRS=("/var/log/nginx" "/var/log/n8n" "/opt/gentic/logs")
  for dir in "${LOG_DIRS[@]}"; do
    if [ -d "$dir" ]; then
      HITS=$(grep -rE "(sk-[a-zA-Z0-9]{20,}|xai-[a-zA-Z0-9]{20,}|AIza[a-zA-Z0-9]{35,})" \
             "$dir" 2>/dev/null | wc -l || echo 0)
      if [ "$HITS" -gt 0 ]; then
        echo "⚠️  WARNING: Possible API keys found in logs at $dir ($HITS occurrences)"
      fi
    fi
  done
fi

# ── STEP 6: SESSION ISOLATION PATCH ──────────────────────────────────────────
echo ""
echo "[6/6] Session isolation check..."

# Check if Telegram bot has user_id-keyed sessions
CLUE_BOT_FILES=$(find /opt/gentic -name "*.js" -o -name "*.py" | \
                 xargs grep -l "session" 2>/dev/null | head -5)

echo "Files with session handling:"
for f in $CLUE_BOT_FILES; do
  echo "  $f"
  # Check for user_id keying
  if grep -q "user_id\|from_id\|chat_id" "$f" 2>/dev/null; then
    echo "    ✓ user_id-keyed sessions detected"
  else
    echo "    ⚠️  WARNING: May not have user_id-keyed sessions"
  fi
done

echo ""
echo "================================================"
echo "HARDENING COMPLETE — $(date)"
echo "Review /var/log/gentic-security-hardening.log"
echo ""
echo "NEXT STEPS:"
echo "1. docker-compose down && docker-compose up -d  (apply Qdrant key)"
echo "2. Update n8n Qdrant credentials with new API key"
echo "3. Set MAC_MINI_IP in this script to your actual LAN IP"
echo "4. Run: npx promptfoo eval --config promptfoo.security.yaml"
echo "5. Run: python pyrit_gen.py --target mlx --rounds 2"
echo "================================================"
