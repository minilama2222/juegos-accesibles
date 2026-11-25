# CI

`tests.yml` es la plantilla de GitHub Actions: dos jobs, uno de sintaxis + unitarios y otro de
Playwright/Chromium.

Para activarla hace falta un token con el scope `workflow`:

```bash
gh auth refresh -h github.com -s workflow
mkdir -p .github/workflows
cp docs/ci/tests.yml .github/workflows/tests.yml
git add .github/workflows/tests.yml && git commit -m "ci: activar tests" && git push
```

Mientras no esté activa, la guardrail local es:

```bash
npm run check        # sintaxis + unitarios (rápido)
npm run test:browser # Playwright
npm test             # todo
```
