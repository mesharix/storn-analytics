# Storn Analytics Deployment Guide for mshdata.com

## Prerequisites

### On Your Server (mshdata.com)
- Docker and Docker Compose installed
- Nginx or reverse proxy configured
- SSL certificate for mshdata.com
- SSH access

### On Your Local Machine
- Docker installed
- SSH access to the server
- Git repository cloned

## Deployment Steps

### Option 1: Automated Deployment (Recommended)

1. **Configure deployment settings** (optional):
   ```bash
   export REMOTE_USER="root"           # Your SSH user
   export REMOTE_HOST="mshdata.com"    # Your domain
   export REMOTE_PATH="/var/www/storn-analytics"  # Installation path
   ```

2. **Run the deployment script**:
   ```bash
   cd /Users/msh/storn-analytics
   ./deploy.sh
   ```

### Option 2: Manual Deployment

#### Step 1: Prepare the Server

SSH into your server:
```bash
ssh root@mshdata.com
```

Create the application directory:
```bash
mkdir -p /var/www/storn-analytics
cd /var/www/storn-analytics
```

#### Step 2: Build and Transfer

On your local machine:
```bash
cd /Users/msh/storn-analytics

# Build the Docker image
docker build -t storn-analytics:latest .

# Save and compress
docker save storn-analytics:latest | gzip > storn-analytics.tar.gz

# Transfer to server
scp storn-analytics.tar.gz root@mshdata.com:/var/www/storn-analytics/
scp docker-compose.production.yml root@mshdata.com:/var/www/storn-analytics/docker-compose.yml
scp .env.production root@mshdata.com:/var/www/storn-analytics/.env.production
```

#### Step 3: Deploy on Server

SSH into your server and run:
```bash
cd /var/www/storn-analytics

# Load the Docker image
docker load < storn-analytics.tar.gz

# Start the application
docker-compose up -d

# Check status
docker-compose ps
docker-compose logs -f
```

## Nginx Configuration

Create/update your Nginx configuration at `/etc/nginx/sites-available/mshdata.com`:

```nginx
server {
    listen 80;
    server_name mshdata.com www.mshdata.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name mshdata.com www.mshdata.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/mshdata.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/mshdata.com/privkey.pem;

    # SSL Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Proxy settings
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Increase timeouts for AI processing
        proxy_connect_timeout 600;
        proxy_send_timeout 600;
        proxy_read_timeout 600;
        send_timeout 600;
    }

    # Increase max body size for file uploads
    client_max_body_size 50M;
}
```

Enable the site and reload Nginx:
```bash
ln -s /etc/nginx/sites-available/mshdata.com /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

## SSL Certificate Setup (if not already configured)

```bash
# Install Certbot
apt-get update
apt-get install certbot python3-certbot-nginx

# Obtain SSL certificate
certbot --nginx -d mshdata.com -d www.mshdata.com

# Auto-renewal is configured by default
```

## Environment Variables

The [.env.production](.env.production) file contains all necessary environment variables:

- `DATABASE_URL`: Supabase PostgreSQL connection
- `NEXT_PUBLIC_APP_URL`: https://mshdata.com
- `NEXTAUTH_URL`: https://mshdata.com
- `ZAI_API_KEY`: z.ai GLM-4.6 API key
- `LANGCHAIN_API_KEY`: LangChain tracing
- And more...

## Management Commands

### View Logs
```bash
ssh root@mshdata.com
cd /var/www/storn-analytics
docker-compose logs -f
```

### Restart Application
```bash
ssh root@mshdata.com
cd /var/www/storn-analytics
docker-compose restart
```

### Stop Application
```bash
ssh root@mshdata.com
cd /var/www/storn-analytics
docker-compose down
```

### Update Application
Just run the deployment script again:
```bash
./deploy.sh
```

### Check Container Status
```bash
ssh root@mshdata.com
cd /var/www/storn-analytics
docker-compose ps
```

### Access Container Shell
```bash
ssh root@mshdata.com
cd /var/www/storn-analytics
docker-compose exec storn-analytics sh
```

## Troubleshooting

### Container Won't Start
Check logs:
```bash
docker-compose logs storn-analytics
```

### Database Connection Issues
Verify DATABASE_URL in `.env.production` is correct

### Port Already in Use
Check what's using port 3000:
```bash
lsof -i :3000
```

### Nginx Not Proxying
Check Nginx configuration:
```bash
nginx -t
systemctl status nginx
```

## Features Available

Once deployed, your users can access:

1. **AI Data Analyst** - https://mshdata.com/ai-analyst
   - Upload CSV/Excel files
   - E-commerce analytics
   - Statistical analysis
   - Export to Excel with visualizations

2. **Private Accounting Agent** - https://mshdata.com/x7k9p2m
   - Saudi ZATCA-compliant accounting
   - Invoice image processing
   - Automatic journal entries
   - Accrual-based VAT processing
   - Excel export

## Security Notes

- The API key for z.ai is exposed in this conversation. **Regenerate it** after deployment for security.
- Ensure `.env.production` is never committed to Git (already in `.gitignore`)
- Consider using Docker secrets for production credentials
- Keep Nginx and SSL certificates updated

## Monitoring

Consider setting up:
- **Uptime monitoring**: UptimeRobot, Pingdom
- **Error tracking**: Sentry
- **Analytics**: Google Analytics or Plausible
- **Log aggregation**: Papertrail, Logtail

## Backup

Regular backups recommended:
- Database: Supabase handles automatic backups
- Application state: `/var/www/storn-analytics`
- Docker images: Keep tagged versions

---

**Developed by Msh (hi@msh.sa)**
- X: https://x.com/mshalbogami
- Website: https://mshdata.com
