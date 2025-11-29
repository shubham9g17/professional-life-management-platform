#!/bin/bash

# Database Setup Script for Professional Life Management Platform
# This script helps initialize the SQLite database and run migrations

set -e

echo "🚀 Professional Life Management Platform - Database Setup"
echo "=========================================================="
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found"
    echo "Please create a .env file with DATABASE_URL configured"
    echo "Example: DATABASE_URL=\"file:./dev.db\""
    exit 1
fi

# Check if DATABASE_URL is set
if ! grep -q "DATABASE_URL" .env; then
    echo "❌ Error: DATABASE_URL not found in .env file"
    echo "Please add DATABASE_URL to your .env file"
    exit 1
fi

echo "✅ Environment configuration found"
echo ""

# Generate Prisma Client
echo "📦 Generating Prisma Client..."
npx prisma generate
echo "✅ Prisma Client generated"
echo ""

# Run migrations
echo "🔄 Running database migrations..."
npx prisma migrate deploy
echo "✅ Migrations applied successfully"
echo ""

# Show database status
echo "📊 Database Status:"
if [ -f "prisma/dev.db" ]; then
    DB_SIZE=$(du -h prisma/dev.db | cut -f1)
    echo "  Database file: prisma/dev.db"
    echo "  Size: $DB_SIZE"
    echo "  ✅ Database created successfully"
else
    echo "  ⚠️  Database file not found at prisma/dev.db"
fi

echo ""
echo "✨ Database setup complete!"
echo ""
echo "Next steps:"
echo "  1. Run 'npm run dev' to start the development server"
echo "  2. Run 'npx prisma studio' to explore the database"
echo ""
