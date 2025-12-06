# Contributing to FoodShare MERN App

## Development Setup

1. Fork and clone the repository
2. Install dependencies: `npm run install-all`
3. Set up environment variables (see .env.example files)
4. Start development servers: `npm run dev`

## Code Standards

### JavaScript/React
- Use ES6+ features
- Follow React functional components with hooks
- Use meaningful variable and function names
- Add JSDoc comments for complex functions

### File Structure
- Components in `frontend/src/components/`
- API routes in `backend/routes/`
- Models in `backend/models/`
- Utilities in respective `utils/` folders

### Commit Messages
- Use conventional commits format
- Examples:
  - `feat: add food quality scanner`
  - `fix: resolve authentication bug`
  - `docs: update API documentation`

## Testing

- Run integration tests: `npm test`
- Frontend tests: `npm run test:frontend`
- Backend tests: `npm run test:backend`

## Pull Request Process

1. Create feature branch from main
2. Make changes following code standards
3. Add tests for new features
4. Update documentation if needed
5. Submit PR with clear description