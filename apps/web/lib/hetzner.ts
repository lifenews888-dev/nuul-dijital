/**
 * Hetzner Cloud API client for nuul.digital hosting provisioning
 *
 * Env vars:
 *   HETZNER_API_TOKEN — Hetzner Cloud API bearer token
 *
 * If HETZNER_API_TOKEN is not set, returns mock data for development.
 */

// ── Plan mapping ─────────────────────────────────────────────────────

export const HETZNER_PLANS = {
  STARTER: { type: "cx22", price: 99000 },
  BUSINESS: { type: "cx32", price: 249000 },
  ENTERPRISE: { type: "cx42", price: 490000 },
} as const;

export type PlanKey = keyof typeof HETZNER_PLANS;

// ── Types ────────────────────────────────────────────────────────────

export interface HetznerServer {
  id: number;
  name: string;
  status: string;
  ip: string | null;
}

interface HetznerApiServer {
  id: number;
  name: string;
  status: string;
  public_net?: {
    ipv4?: { ip?: string };
  };
}

// ── Config ───────────────────────────────────────────────────────────

const HETZNER_BASE = "https://api.hetzner.cloud/v1";

function getToken(): string | null {
  return process.env.HETZNER_API_TOKEN ?? null;
}

function isMockMode(): boolean {
  return !getToken();
}

async function hetznerFetch(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const token = getToken();
  if (!token) {
    throw new Error("HETZNER_API_TOKEN is not configured");
  }

  const res = await fetch(`${HETZNER_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Hetzner API error: ${res.status} — ${text}`);
  }

  return res;
}

// ── Cloud-init script ────────────────────────────────────────────────

function getCloudInitScript(domain?: string): string {
  return `#!/bin/bash
set -e

export DEBIAN_FRONTEND=noninteractive

# Update system
apt-get update -y
apt-get upgrade -y

# Install nginx
apt-get install -y nginx

# Install PHP 8.2
apt-get install -y software-properties-common
add-apt-repository -y ppa:ondrej/php
apt-get update -y
apt-get install -y php8.2-fpm php8.2-mysql php8.2-xml php8.2-mbstring php8.2-curl php8.2-zip php8.2-gd php8.2-intl php8.2-bcmath php8.2-imagick

# Install MySQL
apt-get install -y mysql-server
systemctl enable mysql
systemctl start mysql

# Create WordPress database and user
DB_NAME="wordpress"
DB_USER="wp_user"
DB_PASS="$(openssl rand -base64 24)"

mysql -e "CREATE DATABASE IF NOT EXISTS $DB_NAME DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -e "CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASS';"
mysql -e "GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';"
mysql -e "FLUSH PRIVILEGES;"

# Download and install WordPress
cd /var/www/html
rm -f index.html index.nginx-debian.html
curl -sL https://wordpress.org/latest.tar.gz | tar xz --strip-components=1

# Configure WordPress
cp wp-config-sample.php wp-config.php
sed -i "s/database_name_here/$DB_NAME/" wp-config.php
sed -i "s/username_here/$DB_USER/" wp-config.php
sed -i "s/password_here/$DB_PASS/" wp-config.php

# Generate unique keys and salts
SALT=$(curl -sL https://api.wordpress.org/secret-key/1.1/salt/)
# Escape special characters for sed
SALT_ESCAPED=$(echo "$SALT" | sed 's/[&/\\]/\\\\&/g')
# Remove placeholder keys and append real ones
sed -i "/AUTH_KEY/d;/SECURE_AUTH_KEY/d;/LOGGED_IN_KEY/d;/NONCE_KEY/d;/AUTH_SALT/d;/SECURE_AUTH_SALT/d;/LOGGED_IN_SALT/d;/NONCE_SALT/d" wp-config.php
echo "$SALT" >> wp-config.php

chown -R www-data:www-data /var/www/html
chmod -R 755 /var/www/html

# Configure nginx for WordPress
cat > /etc/nginx/sites-available/default << 'NGINX'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    root /var/www/html;
    index index.php index.html;
    server_name _;

    client_max_body_size 64M;

    location / {
        try_files $uri $uri/ /index.php?$args;
    }

    location ~ \\.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\\.ht {
        deny all;
    }
}
NGINX

# Install certbot for SSL
apt-get install -y certbot python3-certbot-nginx

# Restart services
systemctl restart php8.2-fpm
systemctl restart nginx

# Mark as ready
echo "NUUL_READY" > /var/www/html/ready.txt
chown www-data:www-data /var/www/html/ready.txt
`;
}

// ── Mock helpers ─────────────────────────────────────────────────────

let mockIdCounter = 10000;

function mockServer(name: string): HetznerServer {
  mockIdCounter += 1;
  return {
    id: mockIdCounter,
    name,
    status: "running",
    ip: `10.0.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
  };
}

// ── API functions ────────────────────────────────────────────────────

function parseServer(server: HetznerApiServer): HetznerServer {
  return {
    id: server.id,
    name: server.name,
    status: server.status,
    ip: server.public_net?.ipv4?.ip ?? null,
  };
}

export async function createServer(params: {
  name: string;
  serverType: PlanKey;
  userId: string;
  planId: string;
}): Promise<HetznerServer> {
  if (isMockMode()) {
    console.log("[HETZNER MOCK] createServer:", params);
    return mockServer(params.name);
  }

  const plan = HETZNER_PLANS[params.serverType];
  if (!plan) {
    throw new Error(`Unknown plan type: ${params.serverType}`);
  }

  const res = await hetznerFetch("/servers", {
    method: "POST",
    body: JSON.stringify({
      name: params.name,
      server_type: plan.type,
      location: "hel1",
      image: "ubuntu-22.04",
      labels: {
        userId: params.userId,
        planId: params.planId,
        createdBy: "nuul.digital",
      },
      user_data: getCloudInitScript(),
    }),
  });

  const data = await res.json();
  const server: HetznerApiServer = data.server;

  return parseServer(server);
}

export async function getServer(serverId: number): Promise<HetznerServer> {
  if (isMockMode()) {
    console.log("[HETZNER MOCK] getServer:", serverId);
    return {
      id: serverId,
      name: `mock-server-${serverId}`,
      status: "running",
      ip: `10.0.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
    };
  }

  const res = await hetznerFetch(`/servers/${serverId}`);
  const data = await res.json();

  return parseServer(data.server);
}

export async function deleteServer(serverId: number): Promise<void> {
  if (isMockMode()) {
    console.log("[HETZNER MOCK] deleteServer:", serverId);
    return;
  }

  await hetznerFetch(`/servers/${serverId}`, { method: "DELETE" });
}

export async function listUserServers(userId: string): Promise<HetznerServer[]> {
  if (isMockMode()) {
    console.log("[HETZNER MOCK] listUserServers:", userId);
    return [];
  }

  const res = await hetznerFetch(
    `/servers?label_selector=userId=${encodeURIComponent(userId)}`,
  );
  const data = await res.json();

  return (data.servers as HetznerApiServer[]).map(parseServer);
}
