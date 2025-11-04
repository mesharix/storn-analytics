#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔═══════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Storn Analytics - Supabase Setup       ║${NC}"
echo -e "${BLUE}╔═══════════════════════════════════════════╗${NC}"
echo ""

# Check if in correct directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Not in storn-analytics directory${NC}"
    echo "Please run: cd /Users/msh/storn-analytics"
    exit 1
fi

echo -e "${YELLOW}📝 Step 1: Get Supabase Connection String${NC}"
echo ""
echo "Please paste your Supabase connection string:"
echo "(Format: postgresql://postgres:PASSWORD@db.xxxxx.supabase.co:5432/postgres)"
echo ""
read -p "Connection string: " DATABASE_URL

# Validate connection string
if [[ ! $DATABASE_URL =~ ^postgresql:// ]]; then
    echo -e "${RED}❌ Invalid connection string format${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Connection string received${NC}"
echo ""

# Generate NEXTAUTH_SECRET
echo -e "${YELLOW}🔐 Generating NEXTAUTH_SECRET...${NC}"
NEXTAUTH_SECRET=$(openssl rand -base64 32)
echo -e "${GREEN}✅ Secret generated${NC}"
echo ""

# Get admin email
read -p "Enter your admin email: " ADMIN_EMAIL

# Create .env file
echo -e "${YELLOW}📝 Creating .env file...${NC}"
cat > .env << EOF
# Supabase PostgreSQL Database
DATABASE_URL="$DATABASE_URL"

# Next.js
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# NextAuth
NEXTAUTH_SECRET="$NEXTAUTH_SECRET"
NEXTAUTH_URL="http://localhost:3000"

# Admin
ADMIN_EMAIL="$ADMIN_EMAIL"
EOF

echo -e "${GREEN}✅ .env file created${NC}"
echo ""

# Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ npm install failed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# Generate Prisma client
echo -e "${YELLOW}🔧 Generating Prisma client...${NC}"
npx prisma generate
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Prisma generate failed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Prisma client generated${NC}"
echo ""

# Run migrations
echo -e "${YELLOW}🗄️  Creating database tables...${NC}"
npx prisma migrate dev --name init
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Migration failed${NC}"
    echo ""
    echo "Please check:"
    echo "1. Your connection string is correct"
    echo "2. Your Supabase project is active"
    echo "3. You replaced [YOUR-PASSWORD] with actual password"
    exit 1
fi
echo -e "${GREEN}✅ Database tables created${NC}"
echo ""

# Test connection
echo -e "${YELLOW}🔍 Testing database connection...${NC}"
npx prisma db pull > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Database connection successful!${NC}"
else
    echo -e "${RED}⚠️  Connection test inconclusive (but might still work)${NC}"
fi
echo ""

# Success message
echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║          🎉 Setup Complete! 🎉            ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo ""
echo -e "1️⃣  Start development server:"
echo -e "   ${YELLOW}npm run dev${NC}"
echo ""
echo -e "2️⃣  Open browser:"
echo -e "   ${YELLOW}http://localhost:3000${NC}"
echo ""
echo -e "3️⃣  Test the following:"
echo -e "   ✅ Register new user with your admin email"
echo -e "   ✅ Upload a CSV/Excel file"
echo -e "   ✅ View data with charts and KPIs"
echo -e "   ✅ Check Supabase dashboard for data"
echo ""
echo -e "4️⃣  View data in Supabase:"
echo -e "   Go to ${YELLOW}supabase.com${NC} → Your Project → Table Editor"
echo ""
echo -e "${BLUE}Useful commands:${NC}"
echo -e "   ${YELLOW}npx prisma studio${NC}     - Visual database browser"
echo -e "   ${YELLOW}npm run dev${NC}           - Start dev server"
echo -e "   ${YELLOW}npm run build${NC}         - Build for production"
echo ""
echo -e "${GREEN}Happy analyzing! 🚀${NC}"
echo ""
