# Connect to the Local Database and Seed Data

The backend uses PostgreSQL through Prisma. Run the commands below in PowerShell from the `backend` directory.

## 1. Install and start PostgreSQL

Install PostgreSQL for Windows if it is not already installed. During setup, note the PostgreSQL user and password you choose, and make sure the PostgreSQL service is running.

Confirm the PostgreSQL command-line client is available:

```powershell
psql --version
```

If `psql` is not on `PATH`, run it from PostgreSQL's `bin` directory, commonly `C:\Program Files\PostgreSQL\<version>\bin`.

## 2. Create a local database

Create the database using your PostgreSQL administrator account. Replace `postgres` if you chose a different PostgreSQL user:

```powershell
psql -U postgres -h localhost -p 5432 -c "CREATE DATABASE earthing_erp;"
```

If the database already exists, do not create it again; use that database.

## 3. Configure the backend connection

From the repository root, copy the example environment file:

```powershell
Copy-Item .\backend\.env.example .\backend\.env
```

Open `backend\.env` and set `DATABASE_URL` to match your local PostgreSQL credentials:

```dotenv
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/earthing_erp?schema=public"
```

Replace `postgres` and `YOUR_PASSWORD` with the user and password you configured. If the password contains URL-reserved characters (such as `@`, `:`, `/`, `#`, or `%`), percent-encode those characters in the URL. Keep `.env` local; never commit database credentials.

## 4. Install backend dependencies

```powershell
Set-Location .\backend
npm install
```

Use Node.js 22 for this project:

```powershell
node --version
```

The version should start with `v22`.

## 5. Create the schema and seed sample records

For a new, empty development database, apply the Prisma schema and insert the sample data:

```powershell
npm run db:push
npm run db:seed
```

The seed is safe to rerun. It creates sample categories, a product, a customer, a lead, a vendor, and an inventory item. Demo admin and sales accounts are skipped unless both `SEED_ADMIN_PASSWORD` and `SEED_SALES_PASSWORD` are set in `backend\.env`. Each password must be at least 12 characters. Never use production credentials for seeded demo users.

`db:push` synchronizes the database schema directly from `prisma\schema.prisma`; it is intended here for local development, not as a production migration workflow.

## 6. Verify the connection and inspect the data

Open Prisma Studio to browse the seeded records:

```powershell
npx prisma studio
```

Or start the backend API:

```powershell
npm run dev
```

With the example `PORT=5000`, check the health endpoint at `http://localhost:5000/api/v1/health`.

## Troubleshooting

- **Connection refused:** Ensure the PostgreSQL service is running and that the host and port in `DATABASE_URL` are correct.
- **Authentication failed:** Check the PostgreSQL username/password and URL-encode reserved password characters.
- **Database does not exist:** Run the database creation command in step 2.
- **Prisma cannot find `DATABASE_URL`:** Run Prisma commands from `backend` and confirm `backend\.env` exists and defines `DATABASE_URL`.