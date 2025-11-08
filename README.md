# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/8d6c882b-4c9b-4fef-b7b8-ef9a044dc4f6

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/8d6c882b-4c9b-4fef-b7b8-ef9a044dc4f6) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/8d6c882b-4c9b-4fef-b7b8-ef9a044dc4f6) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

## Development Modes

This project supports two development modes:

### 1. Local Development (SQLite)

Perfect for fast iteration and testing without external dependencies:

```bash
# Set in .env.local
VITE_USE_LOCAL_DB=true
```

- Uses SQLite database (better-sqlite3)
- Mock authentication (no email confirmation)
- All data stored locally in `local-dev.db`
- No internet connection required

### 2. Supabase Mode

Production-like environment with full Supabase features:

```bash
# Set in .env.local
VITE_USE_LOCAL_DB=false
```

- Uses hosted Supabase database
- Full Supabase auth and features
- Requires internet connection

## Database Setup

### For Local Development (SQLite)
No setup required - database is created automatically.

### For Supabase Mode
1. Run the bootstrap script in your Supabase SQL Editor:
   ```sql
   -- Copy contents of supabase/BOOTSTRAP.sql
   ```
2. **Disable email confirmation** (for faster testing):
   - Supabase Dashboard → Authentication → Settings → Email Auth
   - Toggle OFF "Enable email confirmations"
   - Save changes

⚠️ **Important**: For production deployments, consider re-enabling email confirmation for security.

## Quick Start

```bash
# Install dependencies
npm install

# For local development
echo "VITE_USE_LOCAL_DB=true" > .env.local
npm run dev

# For Supabase development  
echo "VITE_USE_LOCAL_DB=false" > .env.local
# Set up Supabase database (see above)
npm run dev
```

# Deploy trigger Fri Oct 24 01:25:11 UTC 2025
