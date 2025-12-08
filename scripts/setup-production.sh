#!/bin/bash

# Production Environment Setup Script
# This script helps set up the production environment for the Professional Life Management Platform

set -e  # Exit on error

echo "=========================================="
echo "Production Environment Setup"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "ℹ $1"
}

# Check if .env.production exists
if [ -f ".env.production" ]; then
    print_warning ".env.production already exists. Backing up to .env.production.backup"
    cp .env.production .env.production.backup
fi

# Copy example file
print_info "Creating .env.production from template..."
cp .env.production.example .env.production
print_success ".env.production created"

echo ""
echo "=========================================="
echo "Generating Secure Keys"
echo "=========================================="
echo ""

# Generate NEXTAUTH_SECRET
print_info "Generating NEXTAUTH_SECRET..."
NEXTAUTH_SECRET=$(openssl rand -base64 32)
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s|NEXTAUTH_SECRET=\".*\"|NEXTAUTH_SECRET=\"$NEXTAUTH_SECRET\"|g" .env.production
else
    # Linux
    sed -i "s|NEXTAUTH_SECRET=\".*\"|NEXTAUTH_SECRET=\"$NEXTAUTH_SECRET\"|g" .env.production
fi
print_success "NEXTAUTH_SECRET generated"

# Generate ENCRYPTION_KEY
print_info "Generating ENCRYPTION_KEY..."
ENCRYPTION_KEY=$(openssl rand -base64 32)
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s|ENCRYPTION_KEY=\".*\"|ENCRYPTION_KEY=\"$ENCRYPTION_KEY\"|g" .env.production
else
    # Linux
    sed -i "s|ENCRYPTION_KEY=\".*\"|ENCRYPTION_KEY=\"$ENCRYPTION_KEY\"|g" .env.production
fi
print_success "ENCRYPTION_KEY generated"

echo ""
echo "=========================================="
echo "Configuration Checklist"
echo "=========================================="
echo ""

print_warning "Please update the following values in .env.production:"
echo ""
echo "  1. DATABASE_URL - PostgreSQL connection string"
echo "  2. NEXTAUTH_URL - Your production domain"
echo "  3. REDIS_URL - Redis connection string"
echo "  4. APM_DSN - Application monitoring DSN (optional)"
echo "  5. ERROR_TRACKING_DSN - Error tracking DSN (optional)"
echo ""

echo "=========================================="
echo "Database Setup"
echo "=========================================="
echo ""

read -p "Do you want to run database migrations now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_info "Running database migrations..."
    if npx prisma migrate deploy; then
        print_success "Database migrations completed"
    else
        print_error "Database migrations failed"
        exit 1
    fi
    
    print_info "Generating Prisma client..."
    if npx prisma generate; then
        print_success "Prisma client generated"
    else
        print_error "Prisma client generation failed"
        exit 1
    fi
else
    print_warning "Skipping database migrations. Run 'npx prisma migrate deploy' manually."
fi

echo ""
echo "=========================================="
echo "Build Verification"
echo "=========================================="
echo ""

read -p "Do you want to test the production build? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_info "Building application..."
    if npm run build; then
        print_success "Production build successful"
    else
        print_error "Production build failed"
        exit 1
    fi
else
    print_warning "Skipping build verification. Run 'npm run build' manually."
fi

echo ""
echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
echo ""

print_success "Production environment setup completed"
echo ""
print_info "Next steps:"
echo "  1. Review and update .env.production with your actual values"
echo "  2. Set up your PostgreSQL database"
echo "  3. Set up your Redis cache"
echo "  4. Configure your CDN (optional)"
echo "  5. Set up monitoring and error tracking"
echo "  6. Deploy to your hosting platform"
echo ""
print_warning "Security reminder:"
echo "  - Never commit .env.production to version control"
echo "  - Store secrets in your hosting platform's environment variables"
echo "  - Enable HTTPS/SSL for all production traffic"
echo "  - Set up regular database backups"
echo ""
