# Contributing

Thanks for contributing.

## Branching
- Main branch: `main`
- Use feature branches:
  - `feat/...`
  - `fix/...`
  - `chore/...`

## Commit style
Use clear, short commit messages:
- `feat: add moderation settings endpoint`
- `fix: correct mobile toggle layout`

## Local checks before PR
### Backend
```bash
cd backend
.\venv\Scripts\python.exe -m pytest -q
```

### Frontend
```bash
cd frontend
npm run build
```

## Pull Request checklist
1. Explain what changed and why.
2. Add or update tests when logic changes.
3. Update docs when API/deploy/UX behavior changes.
4. Do not include secrets in commits.
