.PHONY: help start start-front start-back migrate makemigrations

# =============================================================================
# NEXT.JS & DJANGO BOILERPLATE - DEVELOPMENT COMMANDS
# =============================================================================
# This Makefile provides convenient commands for managing both frontend and backend
# development workflows using Bun for the frontend and UV for the backend.
# =============================================================================

# Default target - show help
help:
	@echo "🚀 Next.js & Django Boilerplate - Development Commands"
	@echo "=========================================================="
	@echo ""
	@echo "Frontend Commands (using Bun):"
	@echo "  make start-front     Start Next.js development server"
	@echo ""
	@echo "Backend Commands (using UV):"
	@echo "  make start-back      Start Django ASGI server with uvicorn"
	@echo "  make migrate         Apply database migrations"
	@echo "  make makemigrations  Create new database migrations"
	@echo ""
	@echo "Full Stack Commands:"
	@echo "  make start           Start both frontend and backend servers concurrently"
	@echo "  make help            Show this help message"
	@echo ""
	@echo "Usage examples:"
	@echo "  make start           # Start full development environment"
	@echo "  make migrate         # Apply database changes"
	@echo "  make makemigrations  # Create migration files"

# Start both frontend and backend servers concurrently
start:
	@echo "🚀 Starting full development environment..."
	@echo "Frontend: http://localhost:3000"
	@echo "Backend:  http://localhost:8000"
	@echo "--------------------------------------------------------"
	@(make start-back & make start-front)

# Start Next.js frontend development server
start-front:
	@echo "🚀 Starting Next.js frontend server..."
	bun run dev

# Start Django backend ASGI server
start-back:
	@echo "🐍 Starting Django backend server..."
	cd server && uv run --project . uvicorn app.asgi:application --reload --host 0.0.0.0 --port 8000

# Apply database migrations
migrate:
	@echo "🗄️  Applying database migrations..."
	cd server && uv run --project . python manage.py migrate

# Create new database migrations
makemigrations:
	@echo "📝 Creating database migrations..."
	cd server && uv run --project . python manage.py makemigrations
