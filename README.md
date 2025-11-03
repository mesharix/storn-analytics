# Data Analysis Platform

A professional, free data analysis and visualization platform - The best alternative to Power BI.

Built with Next.js 14, TypeScript, MySQL, and Prisma.

## 🌐 Connect With Us

- 💬 **Discord**: [Join our community](https://discord.gg/vnRaKvHv) - Get help, share ideas, and connect with other users
- 🐦 **X (Twitter)**: [Follow @mshalbogami](https://x.com/mshalbogami) - Stay updated with the latest features and news

## Features

- **Data Upload**: Upload CSV, XLSX, and XLS files
- **Automatic Analysis**: Instant statistical summaries on upload
- **Visualizations**: Interactive charts and graphs using Recharts
- **Correlation Analysis**: Find relationships between numeric columns
- **Distribution Analysis**: Analyze data distributions
- **MySQL Storage**: Persistent storage of datasets and analyses

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript, TailwindCSS
- **Backend**: Next.js API Routes
- **Database**: MySQL with Prisma ORM
- **Charts**: Recharts
- **File Parsing**: PapaParse (CSV), XLSX (Excel)

## Deployment to Coolify on Contabo Server

### Prerequisites

1. Coolify installed on your Contabo server (31.220.76.3)
2. MySQL database created in Coolify
3. Git repository (optional but recommended)

### Option 1: Deploy via Git Repository (Recommended)

1. **Push your code to GitHub/GitLab:**

```bash
cd storn-analytics
git init
git add .
git commit -m "Initial commit: Data Analysis Platform"
git branch -M main
git remote add origin YOUR_GIT_REPO_URL
git push -u origin main
```

2. **In Coolify:**
   - Go to your project
   - Click "New Resource" → "Application"
   - Select "Public Repository" or connect your private repo
   - Paste your Git repository URL
   - Set build pack to "Dockerfile"
   - Configure environment variables (see below)
   - Click "Deploy"

### Option 2: Deploy via Direct Upload

1. **Zip your project:**

```bash
cd storn-analytics
zip -r storn-analytics.zip . -x "node_modules/*" ".next/*" ".git/*"
```

2. **Upload to server:**

```bash
scp storn-analytics.zip root@31.220.76.3:/root/
```

3. **SSH into your server:**

```bash
ssh root@31.220.76.3
```

4. **Extract and prepare:**

```bash
cd /root
unzip storn-analytics.zip -d storn-analytics
cd storn-analytics
```

5. **In Coolify:**
   - Create a new Application
   - Select "Dockerfile"
   - Set the source to the local directory: `/root/storn-analytics`
   - Configure environment variables (see below)
   - Deploy

### Environment Variables in Coolify

Set these environment variables in your Coolify application:

```env
DATABASE_URL=mysql://username:password@mysql-host:3306/storn_analytics
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

**Get MySQL credentials from Coolify:**
1. Go to your MySQL database in Coolify
2. Copy the connection details
3. Format as: `mysql://USERNAME:PASSWORD@HOST:PORT/DATABASE_NAME`

### Post-Deployment Steps

1. **Run Database Migrations:**

   In Coolify, after first deployment, run this command in the application terminal:

   ```bash
   npx prisma migrate deploy
   ```

2. **Access Your Application:**

   Coolify will provide you with a URL. You can also configure your own domain.

3. **Configure Domain (Optional):**

   - In Coolify, go to your application → Domains
   - Add your custom domain
   - Coolify will automatically generate SSL certificates

## Local Development

1. **Install dependencies:**

```bash
npm install
```

2. **Set up environment variables:**

Create a `.env` file:

```env
DATABASE_URL="mysql://root:password@localhost:3306/storn_analytics"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

3. **Set up database:**

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev
```

4. **Start development server:**

```bash
npm run dev
```

5. **Open browser:**

Visit `http://localhost:3000`

## Docker Development

Run with Docker Compose:

```bash
docker-compose up --build
```

This will start both the Next.js app and MySQL database.

## Usage

1. **Upload Data:**
   - Click "Upload Data"
   - Select a CSV or Excel file
   - Add name and description
   - Upload

2. **View Dataset:**
   - See data preview
   - View automatic statistical analysis
   - See column types, counts, means, medians, etc.

3. **Run Analysis:**
   - Correlation Analysis: Find relationships between columns
   - Distribution Analysis: See frequency distributions

## Project Structure

```
data-analysis/
├── app/
│   ├── api/              # API routes
│   │   ├── datasets/     # Dataset CRUD operations
│   │   ├── upload/       # File upload handler
│   │   └── analyze/      # Analysis endpoints
│   ├── dataset/[id]/     # Dataset detail page
│   ├── upload/           # Upload page
│   └── page.tsx          # Dashboard home
├── lib/
│   ├── prisma.ts         # Prisma client
│   └── dataAnalysis.ts   # Analysis utilities
├── prisma/
│   └── schema.prisma     # Database schema
├── Dockerfile            # Docker configuration
└── docker-compose.yml    # Docker Compose config
```

## Support

For issues or questions, check the deployment logs in Coolify.

## License

MIT
