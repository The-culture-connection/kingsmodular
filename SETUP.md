# Setup Instructions

## Assets Configuration

The project expects static assets (logos, fonts, videos) to be accessible. You have two options:

### Option 1: Move Assets to Public Folder (Recommended)

Move or copy the `Assets` folder to `public/Assets`:

```bash
# On Windows (PowerShell)
Copy-Item -Path Assets -Destination public\Assets -Recurse

# On Mac/Linux
cp -r Assets public/Assets
```

### Option 2: Create Symlink (Alternative)

Create a symbolic link from public to Assets:

```bash
# On Windows (PowerShell as Administrator)
New-Item -ItemType SymbolicLink -Path public\Assets -Target ..\Assets

# On Mac/Linux
ln -s ../Assets public/Assets
```

## Next Steps

1. Install dependencies: `npm install`
2. Configure assets (see above)
3. Run development server: `npm run dev`
4. Open http://localhost:3000

## Authentication

The authentication system is set up but requires backend integration. Currently, the app uses mock authentication for demonstration purposes.

## Roles

- **Office Admin**: Full access to admin portal
- **Project Manager**: Access to jobs, schedule, and updates
- **Bookkeeper**: Access to financial features
- **Field Staff/Employee**: Mobile-optimized field portal
- **Customer**: Customer portal for project visibility

## Portals

- Customer Portal: `/customer/*`
- Admin Portal: `/admin/*`
- Field Portal: `/field/*`
