# Next.js & Django REST Framework Boilerplate

<div align="center">
  <img src="https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=nextdotjs" alt="Next.js">
  <img src="https://img.shields.io/badge/Django-5-092E20?style=for-the-badge&logo=django" alt="Django">
  <img src="https://img.shields.io/badge/TypeScript-blue?style=for-the-badge&logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/Bun-gray?style=for-the-badge&logo=bun" alt="Bun">
</div>

<p align="center">
  A professional, production-ready boilerplate for building powerful web applications with a Next.js frontend and a Django REST Framework backend.
</p>

---

## Introduction

This boilerplate provides a solid foundation for building full-stack applications, combining the best of the modern web: a reactive, server-rendered frontend with Next.js and a robust, scalable API backend with Django REST Framework.

It's pre-configured with a suite of professional tools for code quality, commit standards, and a seamless developer experience, allowing you to focus on building features instead of wrestling with setup.

## Key Features

- **Frontend (Next.js 14):**
  - React 19 with the App Router
  - Full TypeScript support
  - [**NextAuth.js**](https://next-auth.js.org/) for secure, flexible authentication
  - [**Tailwind CSS**](https://tailwindcss.com/) for modern, utility-first styling
  - Strict, pre-configured linting and formatting with **ESLint** and **Prettier**

- **Backend (Django 5):**
  - [**Django REST Framework**](https://www.django-rest-framework.org/) for building powerful APIs
  - [**Django Ratelimit**](https://django-ratelimit.readthedocs.io/) for API rate-limiting and brute-force protection
  - Token-based authentication ready to integrate with NextAuth.js
  - Optimized for PostgreSQL in production, with SQLite for easy development

- **Professional Developer Experience:**
  - [**Bun**](https://bun.sh/) as the fast JavaScript runtime and package manager
  - [**Husky**](https://typicode.github.io/husky/) for managing Git hooks
  - [**`lint-staged`**](https://github.com/okonet/lint-staged) to run checks on staged files before committing
  - [**`commitlint`**](https://commitlint.js.org/) to enforce Conventional Commits for a clean and readable git history
  - Pre-configured Git hooks (`pre-commit`, `commit-msg`, `pre-push`) to ensure code quality and prevent bad pushes

## Project Structure

The project is organized into two main parts within a monorepo structure: the frontend application and the backend server.

```
/
├── .husky/             # Husky Git hooks configuration
├── app/                # Next.js frontend application (App Router)
├── public/             # Static assets for the Next.js app
├── server/             # Django REST Framework backend server
├── .gitignore          # Organized gitignore for both projects
├── commitlint.config.ts# Configuration for commit message linting
├── lint-staged.config.ts# Configuration for pre-commit checks
├── package.json        # Frontend dependencies and scripts
└── ...                 # Other Next.js and project config files
```

## Getting Started

Follow these instructions to get the project up and running on your local machine.

### Prerequisites

- [**Bun**](https://bun.sh/docs/installation) (or Node.js `v18.17.0+` and `npm`/`yarn`)
- [**Python**](https://www.python.org/downloads/) (`3.10+`)
- A Python package manager like `pip` with `venv` or [**Poetry**](https://python-poetry.org/)

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/nextjs-django-boilerplate.git
cd nextjs-django-boilerplate
```

### 2. Frontend Setup

Install the JavaScript dependencies using Bun.

```bash
bun install
```

Create a local environment file by copying the example.

```bash
cp .env.example .env.local
```

Now, update `.env.local` with your own secrets. At a minimum, you'll need a `NEXTAUTH_SECRET`. You can generate one with `openssl rand -base64 32`.

### 3. Backend Setup

Navigate to the `server` directory and create a Python virtual environment.

```bash
cd server
python3 -m venv venv
source venv/bin/activate
```

Install the Python dependencies.

```bash
pip install -r requirements.txt
```

Create a local environment file for the backend.

```bash
cp .env.example .env
```

Update the `.env` file with your database URL and a `SECRET_KEY`.

Apply the database migrations to create your database schema.

```bash
python manage.py migrate
```

### 4. Running the Development Servers

You'll need to run both the frontend and backend servers concurrently in separate terminal windows.

**Terminal 1: Start the Next.js Frontend**

```bash
# From the project root
bun run dev
```

The Next.js app will be available at `http://localhost:3000`.

**Terminal 2: Start the Django Backend**

```bash
# From the server/ directory
cd server
source venv/bin/activate
python manage.py runserver
```

The Django API will be available at `http://localhost:8000`.

## Development Workflow

This boilerplate is equipped with tools to ensure high code quality and a consistent development process.

- **Formatting**: All files are automatically formatted on commit by `lint-staged` and `prettier`.
- **Linting**: Code is checked for errors and style issues by `eslint`. This also runs automatically on commit.
- **Commit Guidelines**: Your commit messages are linted to enforce the [**Conventional Commits**](https://www.conventionalcommits.org/en/v1.0.0/) standard. This is critical for maintainability and automated changelog generation.
  - **Example:** `git commit -m "feat: add user profile page"`
  - **Example:** `git commit -m "fix(api): correct user serialization bug"`
- **Git Hooks**: The `pre-commit`, `commit-msg`, and `pre-push` hooks are configured to automate these checks, ensuring that no bad code or commit messages ever get pushed to the repository.

## Deployment

To deploy this project, you need to treat the frontend and backend as two separate services.

- **Next.js Frontend**: The frontend is a standard Next.js application and can be deployed to platforms like [**Vercel**](https://vercel.com/) (recommended) or [**Netlify**](https://www.netlify.com/).
- **Django Backend**: The Django API should be deployed as a separate web service on platforms like [**Render**](https://render.com/), [**Heroku**](https://www.heroku.com/), or any cloud provider (AWS, GCP, Azure).

## Contributing

Contributions are welcome! If you have suggestions or find a bug, please open an issue. If you'd like to contribute code, please fork the repository and open a pull request.

1.  **Fork** the repository.
2.  Create your feature branch (`git checkout -b feat/AmazingFeature`).
3.  Commit your changes (`git commit -m 'feat: Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feat/AmazingFeature`).
5.  Open a **Pull Request**.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.
