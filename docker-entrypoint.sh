#!/bin/sh

# Function to wait for PostgreSQL to be ready
wait_for_postgres() {
    echo "Waiting for PostgreSQL to be ready..."
    while ! nc -z postgres-db 5432; do
        sleep 1
    done
    echo "PostgreSQL is ready!"
}

# Wait for dependencies
wait_for_postgres

# Run database migrations
echo "Running database migrations..."
pnpm db:push

# Start the application
echo "Starting the application..."
exec pnpm start 