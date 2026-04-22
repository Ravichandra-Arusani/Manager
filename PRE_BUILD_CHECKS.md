> Before making any changes to the codebase, do these checks first every single time:
>
> 1. **Check all API model names** — run this command and confirm `gemini-2.5-flash` is the model name used everywhere:
> ```bash
> grep -r "gemini" src/
> ```
>
> 2. **Check all environment variables** — confirm every `import.meta.env.VITE_*` used in code exists in `.env`:
> ```bash
> grep -r "import.meta.env" src/
> ```
>
> 3. **Check all npm imports** — confirm every imported package exists in `package.json`:
> ```bash
> grep -r "from '@" src/
> ```
>
> 4. **Only after all 3 checks pass** — make the changes
>
> 5. **Always end with** `npm run build` and fix ALL errors before stopping
