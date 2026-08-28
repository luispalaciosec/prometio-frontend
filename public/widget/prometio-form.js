(function () {
  if (customElements.get("prometio-formulario")) {
    return;
  }

  const CAMPOS = [
    { name: "nombre_completo", label: "Nombre completo", type: "text", required: true, autocomplete: "name" },
    { name: "email_trabajo", label: "Email de trabajo", type: "email", required: false, autocomplete: "email" },
    { name: "telefono_movil", label: "Teléfono móvil", type: "tel", required: false, autocomplete: "tel" },
    { name: "producto_interes", label: "Producto de interés", type: "text", required: false, autocomplete: "off" },
    { name: "ciudad", label: "Ciudad", type: "text", required: false, autocomplete: "address-level2" },
    { name: "provincia", label: "Provincia", type: "text", required: false, autocomplete: "address-level1" },
  ];

  const UTM = ["utm_source", "utm_medium", "utm_campaign", "fclid", "gclid"];
  const HEX6 = /^#[0-9A-Fa-f]{6}$/;

  const CSS = `
    :host {
      display: block;
      max-width: 26rem;
      font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
      color: #06080b;
      line-height: 1.4;
      --pf-primario: #05729f;
      --pf-acento: #05c7e8;
    }
    * { box-sizing: border-box; }
    form {
      margin: 0;
      padding: 1.25rem;
      background: #ffffff;
      border: 1px solid #e4eaed;
      border-radius: 0.625rem;
    }
    .logo-wrap {
      margin: 0 0 1rem;
    }
    .logo-wrap[hidden] { display: none; }
    .logo {
      display: block;
      max-height: 2.5rem;
      max-width: 11rem;
      object-fit: contain;
    }
    .campo { margin: 0 0 0.85rem; }
    label {
      display: block;
      margin-bottom: 0.35rem;
      font-size: 0.8rem;
      font-weight: 500;
      color: var(--pf-primario);
    }
    .req { color: var(--pf-acento); }
    input {
      width: 100%;
      height: 2.25rem;
      padding: 0 0.7rem;
      border: 1px solid #e4eaed;
      border-radius: 0.5rem;
      background: #ffffff;
      color: #06080b;
      font: inherit;
      font-size: 0.9rem;
      outline: none;
    }
    input:focus {
      border-color: var(--pf-acento);
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--pf-acento) 35%, transparent);
    }
    .hp {
      position: absolute;
      left: -10000px;
      top: auto;
      width: 1px;
      height: 1px;
      overflow: hidden;
    }
    button {
      width: 100%;
      margin-top: 0.35rem;
      height: 2.35rem;
      border: 0;
      border-radius: 0.5rem;
      background: var(--pf-primario);
      color: #ffffff;
      font: inherit;
      font-size: 0.9rem;
      font-weight: 500;
      cursor: pointer;
    }
    button:hover:not(:disabled) {
      background: color-mix(in srgb, var(--pf-primario) 88%, #000000);
    }
    button:disabled {
      opacity: 0.55;
      cursor: not-allowed;
    }
    .ok, .err {
      margin: 0;
      padding: 1.25rem;
      border-radius: 0.625rem;
      font-size: 0.9rem;
    }
    .ok {
      background: #f2f6f8;
      color: var(--pf-primario);
      border: 1px solid #e4eaed;
    }
    .err {
      margin: 0 0 0.85rem;
      padding: 0.55rem 0.7rem;
      background: color-mix(in srgb, #c0392b 8%, #ffffff);
      color: #9b2c2c;
      font-size: 0.8rem;
    }
  `;

  function leerParams() {
    const params = new URLSearchParams(window.location.search);
    const out = {};
    for (const key of UTM) {
      const value = params.get(key);
      if (value) {
        out[key] = value;
      }
    }
    return out;
  }

  function vacioANull(value) {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }

  function esHex(value) {
    return typeof value === "string" && HEX6.test(value.trim());
  }

  function esUrlHttp(value) {
    if (typeof value !== "string" || !value.trim()) {
      return false;
    }
    try {
      const parsed = new URL(value.trim());
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  }

  function urlMarca(api) {
    if (!api) {
      return null;
    }
    try {
      const parsed = new URL(api, window.location.href);
      const path = parsed.pathname.replace(/\/+$/, "");
      if (path.endsWith("/formulario")) {
        parsed.pathname = `${path.slice(0, -"/formulario".length)}/formulario/marca`;
      } else {
        parsed.pathname = `${path}/formulario/marca`;
      }
      parsed.search = "";
      parsed.hash = "";
      return parsed.toString();
    } catch {
      return null;
    }
  }

  class PrometioFormulario extends HTMLElement {
    static get observedAttributes() {
      return ["api"];
    }

    constructor() {
      super();
      this.enviando = false;
      this.attachShadow({ mode: "open" });
    }

    connectedCallback() {
      if (!this.shadowRoot.childElementCount) {
        this.render();
      }
      void this.aplicarMarca();
    }

    attributeChangedCallback(name, prev, next) {
      if (name === "api" && next && next !== prev) {
        void this.aplicarMarca();
      }
    }

    render() {
      const wrap = document.createElement("div");
      const campos = CAMPOS.map(
        (campo) => `
          <div class="campo">
            <label for="${campo.name}">${campo.label}${campo.required ? ' <span class="req">*</span>' : ""}</label>
            <input id="${campo.name}" name="${campo.name}" type="${campo.type}"
              autocomplete="${campo.autocomplete}" ${campo.required ? "required" : ""} />
          </div>`,
      ).join("");

      wrap.innerHTML = `
        <style>${CSS}</style>
        <form novalidate>
          <div class="logo-wrap" hidden>
            <img class="logo" alt="" />
          </div>
          <p class="err" hidden></p>
          ${campos}
          <div class="hp" aria-hidden="true">
            <label for="prometio-hp">Sitio web</label>
            <input id="prometio-hp" name="honeypot" type="text" tabindex="-1" autocomplete="off" />
          </div>
          <button type="submit">Enviar</button>
        </form>
      `;
      this.shadowRoot.replaceChildren(wrap);
      this.shadowRoot.querySelector("form").addEventListener("submit", (event) => {
        void this.onSubmit(event);
      });
    }

    async aplicarMarca() {
      const url = urlMarca(this.getAttribute("api"));
      if (!url) {
        return;
      }
      let marca = {};
      try {
        const res = await fetch(url, { headers: { Accept: "application/json" } });
        if (res.ok) {
          marca = await res.json();
        }
      } catch {
        return;
      }
      this.pintarMarca(marca);
    }

    pintarMarca(marca) {
      if (esHex(marca.color_primario)) {
        this.style.setProperty("--pf-primario", marca.color_primario.trim());
      }
      const acento = esHex(marca.color_terciario)
        ? marca.color_terciario.trim()
        : esHex(marca.color_secundario)
          ? marca.color_secundario.trim()
          : esHex(marca.color_primario)
            ? marca.color_primario.trim()
            : null;
      if (acento) {
        this.style.setProperty("--pf-acento", acento);
      }

      const wrap = this.shadowRoot.querySelector(".logo-wrap");
      const img = this.shadowRoot.querySelector(".logo");
      if (!wrap || !img) {
        return;
      }
      if (esUrlHttp(marca.logo_url)) {
        img.src = marca.logo_url.trim();
        wrap.hidden = false;
      } else {
        img.removeAttribute("src");
        wrap.hidden = true;
      }
    }

    async onSubmit(event) {
      event.preventDefault();
      if (this.enviando) {
        return;
      }

      const form = event.currentTarget;
      const err = form.querySelector(".err");
      const btn = form.querySelector('button[type="submit"]');
      const nombre = form.elements.namedItem("nombre_completo").value.trim();
      err.hidden = true;

      if (!nombre) {
        err.textContent = "El nombre completo es obligatorio.";
        err.hidden = false;
        return;
      }

      const api = this.getAttribute("api");
      if (!api) {
        err.textContent = "Falta el atributo api del widget.";
        err.hidden = false;
        return;
      }

      this.enviando = true;
      btn.disabled = true;

      const payload = {
        nombre_completo: nombre,
        email_trabajo: vacioANull(form.elements.namedItem("email_trabajo").value),
        telefono_movil: vacioANull(form.elements.namedItem("telefono_movil").value),
        producto_interes: vacioANull(form.elements.namedItem("producto_interes").value),
        ciudad: vacioANull(form.elements.namedItem("ciudad").value),
        provincia: vacioANull(form.elements.namedItem("provincia").value),
        honeypot: vacioANull(form.elements.namedItem("honeypot").value),
        ...leerParams(),
      };

      try {
        const res = await fetch(api, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          throw new Error("http");
        }
        this.shadowRoot.innerHTML = `<style>${CSS}</style><p class="ok">Recibimos tus datos. Te contactaremos pronto.</p>`;
      } catch {
        this.enviando = false;
        btn.disabled = false;
        err.textContent = "No se pudo enviar. Intentá de nuevo.";
        err.hidden = false;
      }
    }
  }

  customElements.define("prometio-formulario", PrometioFormulario);
})();
