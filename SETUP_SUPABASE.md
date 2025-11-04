# =€ Quick Supabase Setup Guide

Everything is ready! You only need to do 2 simple steps:

## Step 1: Create Supabase Project (2 minutes)

1. **Go to**: [supabase.com](https://supabase.com)
2. **Sign in** (or create free account)
3. **Click**: "New Project"
4. **Fill in**:
   - Name: `storn-analytics`
   - Password: Create a strong one (SAVE THIS!)
   - Region: Select closest to you
5. **Click**: "Create new project"
6. **Wait** 2-3 minutes for setup

## Step 2: Get Your Connection String

1. In Supabase dashboard, click **Project Settings** (gear icon)
2. Click **Database** in sidebar
3. Scroll to **Connection String** section
4. Select **Session mode** (recommended)
5. **Copy** the connection string (looks like):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```
6. **Replace** `[YOUR-PASSWORD]` with your actual database password

## Step 3: Run the Automated Setup Script

Open your terminal and run:

```bash
cd /Users/msh/storn-analytics
./setup-supabase.sh
```

The script will:
1. Ask for your Supabase connection string
2. Update your .env file
3. Install dependencies
4. Generate Prisma client
5. Create all database tables
6. Test the connection
7. Start the development server

## What to Test After Setup

Once the server is running at `http://localhost:3000`:

###  Test 1: User Registration (30 seconds)
- Click "Register"
- Create account with your ADMIN_EMAIL
- Should redirect to dashboard

###  Test 2: Upload Dataset (1 minute)
- Click "Upload Dataset"
- Select a CSV/Excel file
- Add name and click Upload
- Should show success message

###  Test 3: View Data (30 seconds)
- Click on your uploaded dataset
- Should see data table with filters
- Try the KPIs, Charts, and Insights tabs

###  Test 4: Verify in Supabase (1 minute)
Go to Supabase dashboard ’ **Table Editor**

You should see data in these tables:
-  **users** - Your registered user
-  **datasets** - Your uploaded dataset
-  **records** - JSON data rows
-  **analyses** - Initial analysis results

## Troubleshooting

### Connection Issues
If you get connection errors:
1. Check your DATABASE_URL in `.env` is correct
2. Verify your Supabase project is active
3. Make sure you replaced `[YOUR-PASSWORD]` with actual password

### Run Setup Again
If something fails:
```bash
cd /Users/msh/storn-analytics
./setup-supabase.sh
```

### Manual Setup (if script doesn't work)
```bash
cd /Users/msh/storn-analytics

# Update .env with your Supabase connection string
nano .env

# Install and setup
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

## All Set! <‰

Your migration from MySQL to Supabase is complete!

**Benefits you now have:**
-  PostgreSQL database (more powerful)
-  Built-in connection pooling
-  Automatic daily backups
-  Real-time capabilities (ready to add)
-  Supabase Storage (ready to add)
-  Row Level Security (ready to add)

## Need Help?

- =¬ Discord: [Join community](https://discord.gg/vnRaKvHv)
- =& X/Twitter: [@mshalbogami](https://x.com/mshalbogami)
- =Ú Docs: Check [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md)
