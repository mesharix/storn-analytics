# Data Analysis Platform

A professional, free data analysis and visualization platform - The best alternative to Power BI.

Built with Next.js 14, TypeScript, Supabase (PostgreSQL), and Prisma.

## 🌐 Connect With Us

- 💬 **Discord**: [Join our community](https://discord.gg/vnRaKvHv) - Get help, share ideas, and connect with other users
- 🐦 **X (Twitter)**: [Follow @mshalbogami](https://x.com/mshalbogami) - Stay updated with the latest features and news

## Features

- **Data Upload**: Upload CSV, XLSX, and XLS files
- **Automatic Analysis**: Instant statistical summaries on upload
- **Visualizations**: Interactive charts and graphs using Recharts
- **Advanced Analysis Tools**:
  - Outlier Detection: Find unusual values using IQR method
  - Trend Analysis: Identify increasing/decreasing patterns
  - Data Quality Check: Detect missing values and duplicates
- **Power BI-Level Features**: DAX-like functions, KPIs, advanced filters
- **Data Export**: Export to CSV, Excel, SQL, and JSON formats
- **Supabase Storage**: Persistent PostgreSQL storage with real-time capabilities

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript, TailwindCSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL) with Prisma ORM
- **Charts**: Recharts
- **File Parsing**: PapaParse (CSV), XLSX (Excel)

## Setup & Deployment

### Prerequisites

1. A Supabase account (free tier available at [supabase.com](https://supabase.com))
2. Node.js 18+ installed locally
3. Git repository (recommended for deployment)

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

### Supabase Database Setup

1. **Create a Supabase Project:**
   - Go to [supabase.com](https://supabase.com) and sign in
   - Click "New Project"
   - Fill in project details (name, database password, region)
   - Wait for the project to initialize

2. **Get Your Database Connection String:**
   - In Supabase dashboard, go to **Project Settings** → **Database**
   - Scroll to **Connection String** section
   - Select **Session** mode (recommended for serverless)
   - Copy the connection string (format: `postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres`)
   - Replace `[PASSWORD]` with your actual database password

3. **Enable Required Extensions (Optional):**
   - Go to **Database** → **Extensions**
   - Enable `uuid-ossp` for UUID generation

### Environment Variables

Set these environment variables in your deployment platform (Vercel, Coolify, etc.):

```env
DATABASE_URL=postgresql://postgres:your-password@db.xxxxxxxxxxxxx.supabase.co:5432/postgres
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXTAUTH_SECRET=your-generated-secret-key
NEXTAUTH_URL=https://yourdomain.com
ADMIN_EMAIL=your-admin-email@example.com
```

**Important:**
- Generate `NEXTAUTH_SECRET` using: `openssl rand -base64 32`
- The first user registering with `ADMIN_EMAIL` will get admin privileges

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

1. **Clone and install dependencies:**

```bash
git clone https://github.com/yourusername/storn-analytics.git
cd storn-analytics
npm install
```

2. **Set up environment variables:**

Create a `.env` file:

```env
DATABASE_URL="postgresql://postgres:your-password@db.xxxxxxxxxxxxx.supabase.co:5432/postgres"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-generated-secret-key"
NEXTAUTH_URL="http://localhost:3000"
ADMIN_EMAIL="your-admin-email@example.com"
```

3. **Set up database:**

```bash
# Generate Prisma client
npx prisma generate

# Run migrations to create tables
npx prisma migrate dev --name init
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

**Note:** Make sure your `.env` file contains the Supabase `DATABASE_URL` before running Docker.

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
   - Outlier Detection: Identify unusual values in your data
   - Trend Analysis: Discover patterns and trends
   - Data Quality Check: Find missing and duplicate data

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

## Supabase Features & Extensions

Since this app uses Supabase, you can easily extend it with powerful features:

### Already Available
- **PostgreSQL Database**: Robust, scalable storage with full ACID compliance
- **Connection Pooling**: Built-in connection pooling for serverless deployments
- **Automatic Backups**: Daily backups included in Supabase free tier

### Easy to Add
1. **Row Level Security (RLS)**: Add database-level security policies
   ```sql
   -- Example: Users can only see their own datasets
   ALTER TABLE datasets ENABLE ROW LEVEL SECURITY;

   CREATE POLICY "Users can view own datasets"
   ON datasets FOR SELECT
   USING (auth.uid() = user_id);
   ```

2. **Real-time Subscriptions**: Get live updates when data changes
   ```typescript
   // Listen to new dataset uploads
   const channel = supabase
     .channel('datasets')
     .on('postgres_changes', {
       event: 'INSERT',
       schema: 'public',
       table: 'datasets'
     }, (payload) => {
       console.log('New dataset uploaded!', payload)
     })
     .subscribe()
   ```

3. **Supabase Storage**: Store uploaded files before processing
   - Instead of parsing files immediately, store them in Supabase Storage
   - Process files in background jobs
   - Keep original files for re-processing

4. **Edge Functions**: Add serverless functions for complex processing
   - Run heavy computations without blocking the main app
   - Schedule periodic analysis jobs
   - Process large datasets asynchronously

5. **Additional Auth Providers**: Extend NextAuth with OAuth
   - Google, GitHub, Microsoft, etc.
   - Social login integration
   - Magic link authentication

### Database Management

**Prisma Studio** (Visual database browser):
```bash
npx prisma studio
```

**Supabase Dashboard**:
- Table Editor: View and edit data directly
- SQL Editor: Run custom queries
- Database Logs: Monitor queries and performance
- API Docs: Auto-generated API documentation

**Migration Management**:
```bash
# Create a new migration
npx prisma migrate dev --name migration_name

# Apply migrations in production
npx prisma migrate deploy

# Reset database (development only - deletes all data)
npx prisma migrate reset
```

## Troubleshooting

### Database Connection Issues
- Verify your `DATABASE_URL` is correct
- Check that your Supabase project is active
- Ensure you're using the correct connection mode (Session, Transaction, or Direct)
- Check Supabase dashboard for any service issues

### Migration Errors
```bash
# Check migration status
npx prisma migrate status

# Force reset (WARNING: deletes all data)
npx prisma migrate reset
```

### Build Errors
```bash
# Clear Next.js cache
rm -rf .next

# Regenerate Prisma client
npx prisma generate

# Rebuild
npm run build
```

## Support

For issues or questions:
- Check deployment logs in your hosting platform
- Review Supabase logs in the dashboard
- Join our Discord community (link above)
- Open an issue on GitHub

## License

MIT
