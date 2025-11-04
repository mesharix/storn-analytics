# OAuth Setup Guide - Google & GitHub Authentication

This guide will help you add Google and GitHub OAuth authentication to your Storn Analytics application.

## What's Already Done

The OAuth authentication code is **already integrated** into your application. You just need to:
1. Create OAuth applications in Google and GitHub
2. Get the client credentials
3. Add them to your environment variables

## Step 1: Setup Google OAuth (5 minutes)

### 1.1 Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **Select a project** → **New Project**
3. Name: `storn-analytics` (or your preferred name)
4. Click **Create**

### 1.2 Configure OAuth Consent Screen

1. In the sidebar, go to **APIs & Services** → **OAuth consent screen**
2. Select **External** user type
3. Click **Create**
4. Fill in the required fields:
   - **App name**: Storn Analytics
   - **User support email**: Your email (mesharix911@gmail.com)
   - **Developer contact**: Your email (mesharix911@gmail.com)
5. Click **Save and Continue**
6. Skip "Scopes" for now (click **Save and Continue**)
7. Add test users if needed (click **Save and Continue**)
8. Click **Back to Dashboard**

### 1.3 Create OAuth Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **+ Create Credentials** → **OAuth client ID**
3. Application type: **Web application**
4. Name: `Storn Analytics Web Client`
5. **Authorized JavaScript origins**:
   - `http://localhost:3000` (for local development)
   - `http://mksk08w04gk0c4scwcsccok8.31.220.76.3.sslip.io` (for production)
6. **Authorized redirect URIs**:
   - `http://localhost:3000/api/auth/callback/google` (for local)
   - `http://mksk08w04gk0c4scwcsccok8.31.220.76.3.sslip.io/api/auth/callback/google` (for production)
7. Click **Create**
8. **Copy and save**:
   - Client ID (looks like: `123456789-abcdefg.apps.googleusercontent.com`)
   - Client Secret (looks like: `GOCSPX-abc123xyz`)

## Step 2: Setup GitHub OAuth (3 minutes)

### 2.1 Create GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **OAuth Apps** → **New OAuth App**
3. Fill in the details:
   - **Application name**: Storn Analytics
   - **Homepage URL**: `http://mksk08w04gk0c4scwcsccok8.31.220.76.3.sslip.io`
   - **Application description**: Data Analysis Platform
   - **Authorization callback URL**: `http://mksk08w04gk0c4scwcsccok8.31.220.76.3.sslip.io/api/auth/callback/github`
4. Click **Register application**
5. **Copy and save**:
   - Client ID (visible immediately)
   - Click **Generate a new client secret** and copy it

### 2.2 Create Another OAuth App for Local Development (Optional but Recommended)

Repeat the above steps with:
- **Homepage URL**: `http://localhost:3000`
- **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`

This keeps your local and production environments separate.

## Step 3: Update Environment Variables

### 3.1 Local Development (.env file)

Update your local `.env` file:

```env
# OAuth Providers
GOOGLE_CLIENT_ID="your-google-client-id-here"
GOOGLE_CLIENT_SECRET="your-google-client-secret-here"

GITHUB_CLIENT_ID="your-github-client-id-here"
GITHUB_CLIENT_SECRET="your-github-client-secret-here"
```

### 3.2 Production (Coolify)

1. Open Coolify dashboard
2. Go to your application → **Environment Variables**
3. Add these 4 new variables:

```
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
GITHUB_CLIENT_ID=your-github-client-id-here
GITHUB_CLIENT_SECRET=your-github-client-secret-here
```

4. Click **Save**
5. Restart your application

## Step 4: Test OAuth Login

### 4.1 Test Locally

1. Start your dev server:
   ```bash
   npm run dev
   ```

2. Go to `http://localhost:3000/login`

3. You should see:
   - Email/password form (existing)
   - "Or continue with" separator
   - Google and GitHub buttons

4. Click **Google** or **GitHub** to test OAuth login

### 4.2 Test Production

1. Go to `http://mksk08w04gk0c4scwcsccok8.31.220.76.3.sslip.io/login`

2. Click **Google** or **GitHub** buttons

3. You'll be redirected to Google/GitHub for authentication

4. After authorization, you'll be redirected back to your dashboard

## How It Works

### Authentication Flow

1. **User clicks OAuth button** → NextAuth initiates OAuth flow
2. **User authorizes** → Google/GitHub redirects back with authorization code
3. **NextAuth exchanges code** → Gets user info (email, name, profile picture)
4. **User created/updated** → Stored in Supabase PostgreSQL
5. **Session created** → User logged in with database session

### Admin Role Assignment

If a user signs in with Google/GitHub using the email in `ADMIN_EMAIL`, they'll automatically get admin privileges.

### Database Tables Used

- **users** - User profiles
- **accounts** - OAuth provider accounts (Google/GitHub)
- **sessions** - Active user sessions

## Features

### What's Enabled

- Sign in with Google
- Sign in with GitHub
- Sign in with email/password (existing)
- Automatic user creation on first OAuth login
- Admin role for users with ADMIN_EMAIL
- Profile picture from OAuth provider
- Database sessions (not JWT)

### User Experience

#### For Users
- Click Google/GitHub button
- Authorize once
- Never need to remember passwords
- Profile synced from Google/GitHub

#### For Admins
- All auth methods work together
- Same user can use email or OAuth
- OAuth accounts linked to existing emails

## Troubleshooting

### "Invalid redirect URI"

**Problem**: OAuth provider rejects the callback URL

**Solution**:
1. Check your redirect URIs in Google Cloud Console or GitHub
2. Make sure they match exactly:
   - `http://localhost:3000/api/auth/callback/google`
   - `http://localhost:3000/api/auth/callback/github`
3. No trailing slashes
4. Correct protocol (http vs https)

### "Client ID not found"

**Problem**: Environment variables not loaded

**Solution**:
1. Verify `.env` file has the credentials
2. Restart your dev server (`npm run dev`)
3. For production, restart Coolify application

### "Failed to sign in with google/github"

**Problem**: Client Secret might be incorrect

**Solution**:
1. Regenerate Client Secret in Google Cloud Console or GitHub
2. Update environment variables
3. Restart application

### OAuth works locally but not in production

**Problem**: Production redirect URIs not configured

**Solution**:
1. Go to Google Cloud Console → Credentials
2. Add production redirect URI:
   ```
   http://mksk08w04gk0c4scwcsccok8.31.220.76.3.sslip.io/api/auth/callback/google
   ```
3. Go to GitHub OAuth App settings
4. Update Authorization callback URL:
   ```
   http://mksk08w04gk0c4scwcsccok8.31.220.76.3.sslip.io/api/auth/callback/github
   ```

### Database session errors

**Problem**: Session table issues

**Solution**:
```bash
# Make sure all tables are created
npx prisma db push
```

## Security Best Practices

1. **Never commit credentials** - `.env` is in `.gitignore`
2. **Use different OAuth apps** - Separate for dev and prod
3. **Rotate secrets regularly** - Regenerate client secrets periodically
4. **Monitor OAuth usage** - Check Google/GitHub dashboards for suspicious activity
5. **Enable 2FA** - On your Google/GitHub accounts

## Advanced Configuration

### Customize OAuth Scopes

Edit `lib/auth.ts` to request additional permissions:

```typescript
GoogleProvider({
  clientId: process.env.GOOGLE_CLIENT_ID as string,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
  authorization: {
    params: {
      scope: 'openid email profile', // Add more scopes
    },
  },
}),
```

### Add More OAuth Providers

NextAuth supports 50+ providers. To add more:

1. Install provider package (if needed)
2. Import provider in `lib/auth.ts`
3. Add to providers array
4. Configure credentials in `.env`

Example for Microsoft:
```typescript
import MicrosoftProvider from 'next-auth/providers/microsoft';

// In providers array:
MicrosoftProvider({
  clientId: process.env.MICROSOFT_CLIENT_ID as string,
  clientSecret: process.env.MICROSOFT_CLIENT_SECRET as string,
}),
```

## Testing Checklist

- [ ] Created Google OAuth application
- [ ] Created GitHub OAuth application
- [ ] Added all environment variables locally
- [ ] Added all environment variables in Coolify
- [ ] Tested Google login locally
- [ ] Tested GitHub login locally
- [ ] Tested Google login in production
- [ ] Tested GitHub login in production
- [ ] Verified admin role works with OAuth
- [ ] Checked user profile displays correctly
- [ ] Tested sign out functionality

## Next Steps

1. **Setup Google OAuth** - Get credentials from Google Cloud Console
2. **Setup GitHub OAuth** - Get credentials from GitHub
3. **Update .env** - Add credentials locally
4. **Update Coolify** - Add credentials to production
5. **Test** - Try logging in with Google and GitHub
6. **Monitor** - Check for any errors in logs

## Support

- Google OAuth Docs: [https://developers.google.com/identity/protocols/oauth2](https://developers.google.com/identity/protocols/oauth2)
- GitHub OAuth Docs: [https://docs.github.com/en/apps/oauth-apps](https://docs.github.com/en/apps/oauth-apps)
- NextAuth Docs: [https://next-auth.js.org/providers/google](https://next-auth.js.org/providers/google)

Need help?
- Discord: [Join community](https://discord.gg/vnRaKvHv)
- X/Twitter: [@mshalbogami](https://x.com/mshalbogami)
