
# ⚡️ Setup Guide: Connecting Supabase Database

Your application front-end is ready! Now we need to create the backend database tables to make the "Capacity Meter" work for real.

## Step 1: Open Supabase Project

1.  Go to your Supabase Dashboard.
2.  Select your project (the one matching `omfknjlklhcuahlbuzyv`).
3.  Click on the **"SQL Editor"** icon in the left sidebar.
4.  Click **"New Query"**.

## Step 2: Run the Migration Script

1.  We have prepared a full database schema file for you.
2.  Open the file `web/supabase/migrations/20240523000000_initial_schema.sql` in VS Code.
3.  **Copy the entire content** of that file.
4.  **Paste** it into the Supabase SQL Editor.
5.  Click **"Run"** (bottom right).

## Step 3: Verify

1.  Once the script finishes successfully, go to the **"Table Editor"** (spreadsheet icon).
2.  You should see tables like `organizations`, `capacity_types`, `orders`, etc.
3.  The `organizations` table should already have one row: "Traiteur Démo".

## Step 4: Test the App

1.  Restart your local development server if running:
    ```bash
    npm run dev
    ```
2.  Refresh `http://localhost:3000`.
3.  The "Capacity Meter" should now show **"0% / Sain"** (because we have no orders yet) instead of the "Demo Mode" warning.
4.  This confirms the app is successfully talking to your database!

---

## 💡 Troubleshooting

*   **Error: "permission denied"**: Make sure you are running the SQL query as a user with admin rights (the default in SQL Editor).
*   **Capacity Meter still shows "Demo Mode"**: Check the browser console. If you see specific errors, verify your tables were created.
