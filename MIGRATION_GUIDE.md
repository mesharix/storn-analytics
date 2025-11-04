# Migration Guide: MySQL to Supabase (PostgreSQL)

This guide will walk you through migrating the Storn Analytics application from MySQL to Supabase's PostgreSQL database.

## Overview

The migration involves:
1. Setting up a Supabase project
2. Updating the Prisma schema
3. Exporting existing data (if any)
4. Running migrations
5. Importing data into Supabase
6. Testing and deploying

## Prerequisites

- A Supabase account (create one at [supabase.com](https://supabase.com))
- Access to your current MySQL database (if you have existing data)
- Node.js 18+ installed
- Git repository access

## Step-by-Step Migration

### Step 1: Create Supabase Project

1. **Sign up/Login to Supabase:**
   - Go to [supabase.com](https://supabase.com)
   - Sign in or create a new account

2. **Create a New Project:**
   - Click "New Project"
   - Fill in the details:
     - **Name**: `storn-analytics` (or your preferred name)
     - **Database Password**: Create a strong password and **save it securely**
     - **Region**: Choose the region closest to your users
   - Click "Create new project"
   - Wait 2-3 minutes for initialization

3. **Get Connection String:**
   - Go to **Project Settings** (gear icon) ’ **Database**
   - Scroll to **Connection String** section
   - Select **Session** mode (recommended for Next.js)
   - Copy the connection string:
     ```
     postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxxx.supabase.co:5432/postgres
     ```
   - Replace `[YOUR-PASSWORD]` with your actual database password

4. **Enable UUID Extension (Recommended):**
   - Go to **Database** ’ **Extensions**
   - Search for `uuid-ossp`
   - Click "Enable" if not already enabled

### Step 2: Update Local Project

1. **Pull Latest Code:**
   ```bash
   cd /Users/msh/storn-analytics
   git pull origin main
   ```

2. **Update Environment Variables:**

   Edit your `.env` file:
   ```env
   # OLD (MySQL):
   # DATABASE_URL="mysql://username:password@host:3306/storn_analytics"

   # NEW (Supabase PostgreSQL):
   DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.xxxxxxxxxxxxx.supabase.co:5432/postgres"

   # Add these if not already present:
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
   NEXTAUTH_URL="http://localhost:3000"
   ADMIN_EMAIL="your-admin-email@example.com"
   ```

   **Generate NEXTAUTH_SECRET:**
   ```bash
   openssl rand -base64 32
   ```

3. **Verify Prisma Schema Update:**

   The schema should already be updated to use PostgreSQL:
   ```bash
   cat prisma/schema.prisma | grep "provider"
   ```

   Should show:
   ```
   provider = "postgresql"
   ```

### Step 3: Export Existing Data (If You Have Data)

**If you have existing data in MySQL, export it first:**

1. **Install Prisma's database tools:**
   ```bash
   npm install -g prisma
   ```

2. **Create a backup using Prisma:**
   ```bash
   # This creates a SQL dump of your data
   npx prisma db pull
   ```

3. **Alternative: Manual Export via MySQL:**
   ```bash
   # Export all data
   mysqldump -u username -p storn_analytics > backup.sql

   # Export specific tables
   mysqldump -u username -p storn_analytics users datasets records analyses > backup.sql
   ```

4. **Save the exported data safely:**
   ```bash
   mkdir -p backups
   mv backup.sql backups/mysql_backup_$(date +%Y%m%d).sql
   ```

### Step 4: Generate and Apply Migrations

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Generate Prisma Client:**
   ```bash
   npx prisma generate
   ```

3. **Create Initial Migration:**
   ```bash
   npx prisma migrate dev --name init
   ```

   This will:
   - Create migration files in `prisma/migrations/`
   - Apply the migration to your Supabase database
   - Create all tables (users, datasets, records, analyses, accounts, sessions, etc.)

4. **Verify Tables Created:**
   - Go to Supabase Dashboard ’ **Table Editor**
   - You should see all tables: `users`, `datasets`, `records`, `analyses`, `accounts`, `sessions`, `verification_tokens`

### Step 5: Import Existing Data (If Applicable)

**If you exported data from MySQL:**

#### Option A: Using Prisma Seed Script

1. **Create a seed script** (`prisma/seed.ts`):
   ```typescript
   import { PrismaClient } from '@prisma/client';
   const prisma = new PrismaClient();

   async function main() {
     // Import your data here
     // Example:
     const userData = [
       {
         id: 'uuid-1',
         email: 'user@example.com',
         password: 'hashed-password',
         name: 'User Name',
         role: 'user'
       }
     ];

     for (const user of userData) {
       await prisma.user.upsert({
         where: { email: user.email },
         update: {},
         create: user,
       });
     }

     console.log('Seed completed!');
   }

   main()
     .catch((e) => {
       console.error(e);
       process.exit(1);
     })
     .finally(async () => {
       await prisma.$disconnect();
     });
   ```

2. **Run the seed:**
   ```bash
   npx prisma db seed
   ```

#### Option B: Direct SQL Import

1. **Convert MySQL dump to PostgreSQL format:**
   - Use a tool like `pgloader` or manually adjust SQL syntax
   - Replace MySQL-specific syntax with PostgreSQL equivalents

2. **Import via Supabase SQL Editor:**
   - Go to **SQL Editor** in Supabase dashboard
   - Paste your converted SQL
   - Click "Run"

#### Option C: Manual Import via CSV

1. **Export from MySQL as CSV:**
   ```sql
   SELECT * INTO OUTFILE '/tmp/users.csv'
   FIELDS TERMINATED BY ','
   ENCLOSED BY '"'
   LINES TERMINATED BY '\n'
   FROM users;
   ```

2. **Import in Supabase:**
   - Use Supabase Table Editor ’ Import from CSV
   - Or use Prisma to read CSV and create records

### Step 6: Test Locally

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Test Authentication:**
   - Go to `http://localhost:3000`
   - Try registering a new user
   - Try logging in

3. **Test Data Upload:**
   - Upload a CSV/Excel file
   - Verify data is saved correctly
   - Check Supabase Table Editor to see records

4. **Test Analytics:**
   - Run various analyses (revenue, RFM, products, etc.)
   - Verify results are displayed correctly

5. **Check Prisma Studio:**
   ```bash
   npx prisma studio
   ```
   - Browse your data visually
   - Verify all relationships work

### Step 7: Update Production Environment

#### For Vercel:

1. **Update Environment Variables:**
   - Go to Vercel Dashboard ’ Your Project ’ Settings ’ Environment Variables
   - Update `DATABASE_URL` with Supabase connection string
   - Add/update other env vars (`NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `ADMIN_EMAIL`)

2. **Deploy:**
   ```bash
   git add .
   git commit -m "Migrate from MySQL to Supabase PostgreSQL"
   git push origin main
   ```

3. **Run Migrations in Production:**
   - Vercel will automatically run `npm run build`
   - Migrations will apply during build if configured

#### For Coolify:

1. **Update Environment Variables:**
   - Go to your Coolify application ’ Environment Variables
   - Update `DATABASE_URL` with Supabase connection string
   - Update other environment variables

2. **Deploy:**
   ```bash
   git add .
   git commit -m "Migrate from MySQL to Supabase PostgreSQL"
   git push origin main
   ```

3. **Run Migrations Manually:**
   - In Coolify, open the application terminal
   - Run:
     ```bash
     npx prisma migrate deploy
     ```

### Step 8: Verify Production Deployment

1. **Check Application Logs:**
   - Look for any database connection errors
   - Verify migrations ran successfully

2. **Test Core Features:**
   - User registration/login
   - Dataset upload
   - Data visualization
   - Analysis execution
   - Data export

3. **Monitor Supabase Dashboard:**
   - Go to **Logs** ’ **Postgres Logs**
   - Check for any errors or warnings
   - Monitor query performance

## Rollback Plan (If Issues Occur)

If you encounter problems and need to rollback:

1. **Revert Environment Variables:**
   ```env
   DATABASE_URL="mysql://username:password@host:3306/storn_analytics"
   ```

2. **Revert Prisma Schema:**
   ```bash
   git checkout HEAD~1 prisma/schema.prisma
   ```

3. **Regenerate Prisma Client:**
   ```bash
   npx prisma generate
   ```

4. **Redeploy:**
   ```bash
   npm run dev  # Test locally first
   git push     # Deploy to production
   ```

## Benefits of Supabase Migration

After successful migration, you'll have access to:

1. **Better Performance**: PostgreSQL is optimized for complex queries
2. **Connection Pooling**: Built-in pooling for serverless deployments
3. **Automatic Backups**: Daily backups on free tier
4. **Real-time Capabilities**: Add real-time subscriptions if needed
5. **Storage Integration**: Easily add file storage with Supabase Storage
6. **Row Level Security**: Database-level security policies
7. **Better Scalability**: Scale from free tier to enterprise
8. **Modern Dashboard**: Powerful UI for database management
9. **Edge Functions**: Add serverless functions for heavy processing
10. **OAuth Support**: Easy integration with social login providers

## Troubleshooting

### Connection Issues

**Error: "Can't reach database server"**
- Check your DATABASE_URL is correct
- Verify Supabase project is active
- Try using different connection modes (Session vs Direct)

**Error: "SSL connection required"**
- Supabase requires SSL by default
- Add `?sslmode=require` to connection string if needed

### Migration Errors

**Error: "Migration failed to apply"**
```bash
# Check migration status
npx prisma migrate status

# Reset and retry (dev only - deletes data!)
npx prisma migrate reset

# Force apply
npx prisma migrate resolve --applied MIGRATION_NAME
```

### Type Errors

**Error: "Property X does not exist"**
```bash
# Regenerate Prisma client
npx prisma generate

# Clear Next.js cache
rm -rf .next
npm run build
```

### Performance Issues

**Slow queries:**
- Check Supabase dashboard ’ Database ’ Logs
- Add indexes if needed
- Use connection pooling (Transaction mode)

## Best Practices

1. **Use Connection Pooling**: For serverless/edge deployments, use Transaction mode
2. **Enable Prisma Query Logging**: Set `log: ['query']` in Prisma Client for debugging
3. **Monitor Database Size**: Free tier has 500MB limit
4. **Use Indexes**: Add indexes for frequently queried columns
5. **Regular Backups**: Download backups from Supabase dashboard weekly
6. **Environment Variables**: Never commit `.env` files to git
7. **Test Before Deploying**: Always test migrations locally first

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Prisma PostgreSQL Guide](https://www.prisma.io/docs/concepts/database-connectors/postgresql)
- [NextAuth with Prisma](https://next-auth.js.org/adapters/prisma)
- [Supabase Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)

## Support

Need help with migration?
- Join Discord: [https://discord.gg/vnRaKvHv](https://discord.gg/vnRaKvHv)
- Twitter: [@mshalbogami](https://x.com/mshalbogami)
- Open an issue on GitHub

## Migration Checklist

- [ ] Created Supabase project
- [ ] Copied database connection string
- [ ] Updated local `.env` file
- [ ] Generated NEXTAUTH_SECRET
- [ ] Verified Prisma schema uses PostgreSQL
- [ ] Exported existing MySQL data (if applicable)
- [ ] Ran `npx prisma generate`
- [ ] Ran `npx prisma migrate dev --name init`
- [ ] Verified tables created in Supabase
- [ ] Imported existing data (if applicable)
- [ ] Tested locally (auth, upload, analysis)
- [ ] Updated production environment variables
- [ ] Deployed to production
- [ ] Ran `npx prisma migrate deploy` in production
- [ ] Verified production deployment works
- [ ] Monitored logs for errors
- [ ] Created backup of Supabase database

---

**Migration Date**: _____________
**Migrated By**: _____________
**Status**:  Pending  In Progress  Completed  Rolled Back
