# Glaucus v1 (Static Site)

Sitio 100% estatico listo para GitHub Pages.

## Estructura

- `index.html`
- `styles.css`
- `script.js`
- `assets/logo-glaucus.svg`

## Activar formulario de contacto (Formspree)

1. Crea una cuenta en [Formspree](https://formspree.io/).
2. Crea un formulario y copia tu endpoint (formato: `https://formspree.io/f/xxxxxx`).
3. Abre `script.js` y reemplaza:

```js
const FORMSPREE_ENDPOINT = "https://formspree.io/f/REEMPLAZA_CON_TU_ID";
```

4. Guarda y publica en GitHub Pages.

## Comportamiento del formulario

- Valida campos obligatorios.
- Muestra estado en pantalla:
  - `Enviando...`
  - `Mensaje enviado correctamente.`
  - `Error al enviar.`

## Publicacion en GitHub Pages

1. Sube estos archivos al repositorio.
2. En GitHub: `Settings > Pages`.
3. Source: `Deploy from a branch`.
4. Branch: `main` (o la que uses) y carpeta `/root`.
5. Guarda.

