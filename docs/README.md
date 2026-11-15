# Documentación de prometIO

Fuente del sitio de documentación (VitePress). Se lee en local; no se publica con el CRM. Cada `.md` de esta carpeta es una
página; la navegación está en `.vitepress/config.mts`.

- Editar en local con vista previa: `npm run docs:dev`
- Compilar el sitio: `npm run docs:build` (sale a `docs/.vitepress/dist`, ignorada por git)
- `npm run build` compila solo la app, que es lo que corre Vercel.

`UI_GUIDE.md` se conserva como la guía de UI original (la vigente es [19-sistema-diseno](19-sistema-diseno.md) y el
`CLAUDE.md` del repo). `manual-prometio*.html` son las fuentes del manual de usuario; el PDF y las capturas se generan
en local con `scripts/` y no se versionan.
