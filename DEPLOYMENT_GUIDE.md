# Deployment Guide for Contabo Server with Coolify

## Quick Start Guide

### Step 1: Get MySQL Database Credentials from Coolify

1. Log into your Coolify dashboard at `http://31.220.76.3:8000` (or your Coolify domain)
2. Go to your MySQL database service
3. Find the connection details:
   - Username (usually `root` or custom)
   - Password
   - Host (internal docker hostname, e.g., `mysql-service-name`)
   - Port (usually `3306`)
   - Database name: `storn_analytics`

### Step 2: Upload Code to Server

**Option A: Using Git (Recommended)**

1. On your local machine, initialize git and push to GitHub:

```bash
cd /Users/msh/storn-analytics
git init
git add .
git commit -m "Initial commit: Storn Analytics Platform"
git branch -M main
# Create a repo on GitHub first, then:
git remote add origin https://github.com/YOUR_USERNAME/storn-analytics.git
git push -u origin main
```

2. In Coolify:
   - Click "New Resource" → "Application"
   - Choose "Public Repository"
   - Enter your GitHub repo URL
   - Coolify will auto-detect the Dockerfile

**Option B: Direct Upload to Server**

1. From your local machine:

```bash
cd /Users/msh/storn-analytics
# Create a zip excluding node_modules
tar -czf storn-analytics.tar.gz --exclude='node_modules' --exclude='.next' --exclude='.git' .
```

2. Upload to server:

```bash
scp storn-analytics.tar.gz root@31.220.76.3:/root/
```

3. SSH into server:

```bash
ssh root@31.220.76.3
# Password: mshdata123
```

4. Extract files:

```bash
cd /root
mkdir -p /var/www/storn-analytics
tar -xzf storn-analytics.tar.gz -C /var/www/storn-analytics
```

### Step 3: Deploy in Coolify

1. **Create New Application:**
   - Go to Coolify dashboard
   - Navigate to your project
   - Click "New Resource" → "Application"

2. **Configure Application:**
   - **Name**: `storn-analytics`
   - **Source**:
     - If using Git: Select "Public Repository" and enter your repo URL
     - If using local files: Select "Directory" and enter `/var/www/storn-analytics`
   - **Build Pack**: Select "Dockerfile"

3. **Environment Variables:**
   Click on "Environment Variables" and add:

   ```
   DATABASE_URL=mysql://USERNAME:PASSWORD@MYSQL_HOST:3306/storn_analytics
   NEXT_PUBLIC_APP_URL=http://31.220.76.3:3000
   ```

   **Important**: Replace:
   - `USERNAME` with your MySQL username (from Step 1)
   - `PASSWORD` with your MySQL password (from Step 1)
   - `MYSQL_HOST` with the MySQL internal hostname (from Step 1)

   Example:
   ```
   DATABASE_URL=mysql://root:mypassword123@mysql-storn:3306/storn_analytics
   NEXT_PUBLIC_APP_URL=http://31.220.76.3:3000
   ```

4. **Port Configuration:**
   - Set exposed port to `3000`

5. **Deploy:**
   - Click "Save" then "Deploy"
   - Watch the build logs

### Step 4: Initialize Database

After the first deployment completes:

1. In Coolify, go to your `storn-analytics` application
2. Click on "Terminal" or "Execute Command"
3. Run these commands:

```bash
npx prisma generate
npx prisma migrate deploy
```

Or if you need to create the database schema:

```bash
npx prisma db push
```

### Step 5: Configure Domain (Optional)

1. In Coolify, go to your application → "Domains"
2. Add a custom domain or use the auto-generated one
3. Coolify will automatically provision SSL certificates

### Step 6: Access Your Application

Your application should now be accessible at:
- `http://31.220.76.3:PORT` (check Coolify for the actual port)
- Or your custom domain if configured

## Troubleshooting

### Build Fails

**Check build logs in Coolify for errors. Common issues:**

1. **Missing DATABASE_URL:**
   - Ensure environment variable is set correctly

2. **Prisma errors:**
   - Make sure MySQL database exists
   - Check DATABASE_URL format is correct

3. **Port conflicts:**
   - Change the port in Coolify settings

### Application Won't Start

1. **Check logs in Coolify:**
   - Look for database connection errors
   - Verify DATABASE_URL is correct

2. **Database not accessible:**
   - Ensure MySQL service is running
   - Check that both services are in the same Docker network

3. **Run migrations manually:**
   ```bash
   npx prisma migrate deploy
   ```

### Can't Upload Files

1. **Check file size limits:**
   - Default is 10MB (configured in next.config.js)

2. **Check permissions:**
   - Ensure the application has write permissions

## Updating Your Application

### Via Git:

1. Make changes locally
2. Commit and push:
   ```bash
   git add .
   git commit -m "Your changes"
   git push
   ```
3. In Coolify, click "Redeploy" or enable auto-deploy

### Manual Update:

1. Upload new files to server
2. In Coolify, click "Redeploy"

## Backup Database

In Coolify:
1. Go to your MySQL database
2. Click "Backup"
3. Or use mysqldump:

```bash
docker exec MYSQL_CONTAINER_NAME mysqldump -u root -p storn_analytics > backup.sql
```

## Monitoring

- **Logs**: View real-time logs in Coolify dashboard
- **Metrics**: Check resource usage in Coolify
- **Health**: Coolify automatically monitors application health

## Security Notes

1. **Change default passwords** for MySQL
2. **Use environment variables** for sensitive data (never commit to Git)
3. **Enable HTTPS** via Coolify's automatic SSL
4. **Firewall**: Ensure only necessary ports are exposed

## Need Help?

- Check Coolify documentation: https://coolify.io/docs
- View application logs in Coolify dashboard
- Check Prisma docs for database issues: https://www.prisma.io/docs
