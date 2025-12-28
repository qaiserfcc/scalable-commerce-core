#!/bin/bash

echo "==================================="
echo "Scalable Commerce Core Setup"
echo "==================================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "Creating .env file from .env.example..."
    cp .env.example .env
    echo "✓ .env file created. Please edit it with your configuration."
    echo ""
else
    echo "✓ .env file already exists"
    echo ""
fi

# Install root dependencies
echo "Installing root dependencies..."
npm install
echo "✓ Root dependencies installed"
echo ""

# Install service dependencies
echo "Installing service dependencies..."
services=(
    "api-gateway"
    "auth-service"
    "product-service"
    "cart-service"
    "order-service"
    "payment-service"
    "discount-service"
    "admin-service"
    "notification-service"
)

for service in "${services[@]}"
do
    echo "Installing $service dependencies..."
    cd "services/$service"
    npm install
    cd ../..
    echo "✓ $service dependencies installed"
done
echo ""

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd frontend
npm install
cd ..
echo "✓ Frontend dependencies installed"
echo ""

echo "==================================="
echo "Setup Complete!"
echo "==================================="
echo ""
echo "Next steps:"
echo "1. Configure your .env file with database credentials"
echo "2. Create databases: mysql -u root -p < scripts/create-databases.sql"
echo "3. Start all services: npm run start:all"
echo "4. Access the application at http://localhost:3000"
echo ""
