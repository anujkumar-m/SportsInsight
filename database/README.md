# Database Setup — MySQL Workbench

## Connection Details

| Setting  | Value            |
|----------|------------------|
| Host     | localhost        |
| Port     | 3306             |
| User     | root             |
| Password | adhithyan@123    |
| Database | sports_acadmey   |

## Setup Steps in MySQL Workbench

1. Open MySQL Workbench and connect to your local MySQL server.
2. Run **`schema.sql`** first — creates the database and all tables.
3. Run **`seed.sql`** second — inserts sample roles, users, sports, athletes, and dashboard data.

## Default Login Credentials

All seeded users share the same password:

| Role     | Username          | Password   |
|----------|-------------------|------------|
| Admin    | admin             | Admin@123  |
| Coach    | coach.rajesh      | Admin@123  |
| Selector | selector.vikram   | Admin@123  |
| Athlete  | athlete.arjun     | Admin@123  |

## Alternative: Command Line Init

From the `server` folder:

```bash
npm run db:init
```

This runs both SQL files automatically using credentials from `server/.env`.
