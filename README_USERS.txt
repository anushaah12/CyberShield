CyberShield Users Administration
================================

The Admin Console now includes a Users section.

1. Start the project:
   npm run dev

2. Open the Admin Console and sign in with:
   admin@gmail.com
   Admin@12345

3. Click Users in the Admin Console sidebar.

The Users page displays:
- Name
- Email
- Role
- Status
- Registration date
- Last login

The administrator can change a user's status between active and suspended.

The local SQLite database is data/cybershield.sqlite.
User authentication itself remains handled by the project's Supabase auth;
the local users table is a synchronized admin/reporting list.
