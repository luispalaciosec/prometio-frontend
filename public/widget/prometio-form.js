(function () {
  if (customElements.get("prometio-formulario")) {
    return;
  }

  /** Fase 3 — site key hCaptcha (aún no se renderiza en fase 1). */
  const HCAPTCHA_SITE_KEY = "0f7cabfa-c2ba-414e-ade0-2b2472222c96";

  const UTM_KEYS = [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_content",
    "utm_term",
    "fclid",
    "gclid",
  ];

  /** Claves que van sueltas en el body del POST (no en campos_custom). */
  const TOP_LEVEL_KEYS = new Set([
    "nombre_completo",
    "email_trabajo",
    "telefono_movil",
    "empresa",
    "producto_interes",
    "ciudad",
    "provincia",
    "cargo",
  ]);

  const HEX6 = /^#[0-9A-Fa-f]{6}$/;

  const CSS = `
    :host {
      display: block;
      max-width: 26rem;
      font-family: var(--pf-font-family, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif);
      color: #06080b;
      line-height: 1.4;
      --pf-primario: #05729f;
      --pf-acento: #05c7e8;
      --pf-radio: 0.5rem;
    }
    * { box-sizing: border-box; }
    .loading, form, .ok {
      margin: 0;
      padding: 1.25rem;
      background: #ffffff;
      border: 1px solid #e4eaed;
      border-radius: var(--pf-radio);
    }
    .loading {
      color: #5c6b78;
      font-size: 0.9rem;
    }
    .titulo {
      margin: 0 0 1rem;
      font-size: 1.05rem;
      font-weight: 600;
      color: var(--pf-primario);
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
    input, select, textarea {
      width: 100%;
      padding: 0 0.7rem;
      border: 1px solid #e4eaed;
      border-radius: var(--pf-radio);
      background: #ffffff;
      color: #06080b;
      font: inherit;
      font-size: 0.9rem;
      outline: none;
    }
    input, select {
      height: 2.25rem;
    }
    textarea {
      min-height: 5rem;
      padding-top: 0.55rem;
      padding-bottom: 0.55rem;
      resize: vertical;
    }
    input:focus, select:focus, textarea:focus {
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
    button[type="submit"] {
      width: 100%;
      margin-top: 0.35rem;
      height: 2.35rem;
      border: 0;
      border-radius: var(--pf-radio);
      background: var(--pf-primario);
      color: #ffffff;
      font: inherit;
      font-size: 0.9rem;
      font-weight: 500;
      cursor: pointer;
    }
    button[type="submit"]:hover:not(:disabled) {
      background: color-mix(in srgb, var(--pf-primario) 88%, #000000);
    }
    button[type="submit"]:disabled {
      opacity: 0.55;
      cursor: not-allowed;
    }
    .ok, .err, .fatal {
      margin: 0;
      padding: 1.25rem;
      border-radius: var(--pf-radio);
      font-size: 0.9rem;
    }
    .ok {
      background: #f2f6f8;
      color: var(--pf-primario);
      border: 1px solid #e4eaed;
    }
    .fatal {
      background: #f2f6f8;
      color: #9b2c2c;
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

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function leerUtms() {
    const params = new URLSearchParams(window.location.search);
    const out = {};
    for (const key of UTM_KEYS) {
      const value = params.get(key);
      if (value) {
        out[key] = value;
      }
    }
    return out;
  }

  function vacioANull(value) {
    const trimmed = String(value ?? "").trim();
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

  function urlDerivada(api, suffix) {
    if (!api) {
      return null;
    }
    try {
      const parsed = new URL(api, window.location.href);
      const path = parsed.pathname.replace(/\/+$/, "");
      if (path.endsWith("/formulario")) {
        parsed.pathname = `${path}${suffix}`;
      } else {
        parsed.pathname = `${path}/formulario${suffix}`;
      }
      parsed.search = "";
      parsed.hash = "";
      return parsed.toString();
    } catch {
      return null;
    }
  }

  function urlMarca(api) {
    return urlDerivada(api, "/marca");
  }

  function urlCampos(api) {
    return urlDerivada(api, "/campos");
  }

  function autocompletePara(clave) {
    switch (clave) {
      case "nombre_completo":
        return "name";
      case "email_trabajo":
        return "email";
      case "telefono_movil":
        return "tel";
      case "ciudad":
        return "address-level2";
      case "provincia":
        return "address-level1";
      default:
        return "off";
    }
  }

  function inputTypePara(def) {
    switch (def.tipo) {
      case "email":
        return "email";
      case "telefono":
        return "tel";
      default:
        return "text";
    }
  }

  function htmlCampo(def) {
    const id = `pf-${def.clave}`;
    const reqAttr = def.requerido ? " required" : "";
    const reqLabel = def.requerido ? ' <span class="req">*</span>' : "";
    const placeholder = def.placeholder ? ` placeholder="${escapeHtml(def.placeholder)}"` : "";
    const autocomplete = ` autocomplete="${autocompletePara(def.clave)}"`;

    if (def.tipo === "textarea") {
      return `
        <div class="campo">
          <label for="${id}">${escapeHtml(def.etiqueta)}${reqLabel}</label>
          <textarea id="${id}" name="${escapeHtml(def.clave)}" rows="3"${placeholder}${reqAttr}${autocomplete}></textarea>
        </div>`;
    }

    if (def.tipo === "select") {
      const opciones = Array.isArray(def.opciones) ? def.opciones : [];
      if (opciones.length === 0) {
        return "";
      }
      const opts = opciones
        .map((opt) => `<option value="${escapeHtml(opt)}">${escapeHtml(opt)}</option>`)
        .join("");
      return `
        <div class="campo">
          <label for="${id}">${escapeHtml(def.etiqueta)}${reqLabel}</label>
          <select id="${id}" name="${escapeHtml(def.clave)}"${reqAttr}${autocomplete}>
            <option value="">Seleccionar…</option>
            ${opts}
          </select>
        </div>`;
    }

    return `
      <div class="campo">
        <label for="${id}">${escapeHtml(def.etiqueta)}${reqLabel}</label>
        <input id="${id}" name="${escapeHtml(def.clave)}" type="${inputTypePara(def)}"${placeholder}${reqAttr}${autocomplete} />
      </div>`;
  }

  function armarPayload(form, campos) {
    const body = {
      honeypot: vacioANull(form.elements.namedItem("honeypot")?.value),
      ...leerUtms(),
    };
    const camposCustom = {};

    for (const def of campos) {
      const el = form.elements.namedItem(def.clave);
      if (!el) {
        continue;
      }
      const value = vacioANull(el.value);
      if (TOP_LEVEL_KEYS.has(def.clave)) {
        body[def.clave] = value;
      } else if (value !== null) {
        camposCustom[def.clave] = value;
      }
    }

    if (Object.keys(camposCustom).length > 0) {
      body.campos_custom = camposCustom;
    }

    return body;
  }

  async function leerDetail(res) {
    try {
      const data = await res.json();
      if (data && typeof data.detail === "string" && data.detail.trim()) {
        return data.detail.trim();
      }
    } catch {
      /* cuerpo no JSON */
    }
    return null;
  }

  class PrometioFormulario extends HTMLElement {
    static get observedAttributes() {
      return ["api"];
    }

    constructor() {
      super();
      this.enviando = false;
      this.campos = [];
      this.marca = {};
      this.attachShadow({ mode: "open" });
    }

    connectedCallback() {
      void this.bootstrap();
    }

    attributeChangedCallback(name, prev, next) {
      if (name === "api" && next && next !== prev) {
        void this.bootstrap();
      }
    }

    renderLoading() {
      this.shadowRoot.innerHTML = `<style>${CSS}</style><p class="loading">Cargando formulario…</p>`;
    }

    renderFatal(message) {
      this.shadowRoot.innerHTML = `<style>${CSS}</style><p class="fatal">${escapeHtml(message)}</p>`;
    }

    async bootstrap() {
      const api = this.getAttribute("api");
      if (!api) {
        this.renderFatal("Falta el atributo api del widget.");
        return;
      }

      this.renderLoading();

      const marcaUrl = urlMarca(api);
      const camposUrl = urlCampos(api);

      const [marcaResult, camposResult] = await Promise.allSettled([
        marcaUrl ? fetch(marcaUrl, { headers: { Accept: "application/json" } }) : Promise.reject(),
        camposUrl ? fetch(camposUrl, { headers: { Accept: "application/json" } }) : Promise.reject(),
      ]);

      if (camposResult.status !== "fulfilled" || !camposResult.value.ok) {
        this.renderFatal("No se pudo cargar el formulario.");
        return;
      }

      let campos = [];
      try {
        campos = await camposResult.value.json();
      } catch {
        this.renderFatal("No se pudo cargar el formulario.");
        return;
      }

      if (!Array.isArray(campos) || campos.length === 0) {
        this.renderFatal("No hay campos configurados para este formulario.");
        return;
      }

      this.campos = campos.slice().sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));

      this.marca = {};
      if (marcaResult.status === "fulfilled" && marcaResult.value.ok) {
        try {
          this.marca = await marcaResult.value.json();
        } catch {
          this.marca = {};
        }
      }

      this.renderForm();
      this.pintarMarca(this.marca);
    }

    renderForm() {
      const camposHtml = this.campos.map((def) => htmlCampo(def)).join("");
      const textoBoton =
        typeof this.marca.formulario_texto_boton === "string" && this.marca.formulario_texto_boton.trim()
          ? escapeHtml(this.marca.formulario_texto_boton.trim())
          : "Enviar";

      this.shadowRoot.innerHTML = `
        <style>${CSS}</style>
        <form novalidate>
          <div class="logo-wrap" hidden>
            <img class="logo" alt="" />
          </div>
          <p class="err" hidden></p>
          ${camposHtml}
          <div class="hp" aria-hidden="true">
            <label for="prometio-hp">Sitio web</label>
            <input id="prometio-hp" name="honeypot" type="text" tabindex="-1" autocomplete="off" />
          </div>
          <button type="submit">${textoBoton}</button>
        </form>
      `;

      this.shadowRoot.querySelector("form").addEventListener("submit", (event) => {
        void this.onSubmit(event);
      });
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
      if (wrap && img) {
        if (esUrlHttp(marca.logo_url)) {
          img.src = marca.logo_url.trim();
          wrap.hidden = false;
        } else {
          img.removeAttribute("src");
          wrap.hidden = true;
        }
      }
    }

    validarRequeridos(form) {
      for (const def of this.campos) {
        if (!def.requerido) {
          continue;
        }
        const el = form.elements.namedItem(def.clave);
        if (!el || !String(el.value ?? "").trim()) {
          return `"${def.etiqueta}" es obligatorio.`;
        }
      }
      return null;
    }

    async onSubmit(event) {
      event.preventDefault();
      if (this.enviando) {
        return;
      }

      const form = event.currentTarget;
      const err = form.querySelector(".err");
      const btn = form.querySelector('button[type="submit"]');
      err.hidden = true;

      const api = this.getAttribute("api");
      if (!api) {
        err.textContent = "Falta el atributo api del widget.";
        err.hidden = false;
        return;
      }

      const validacion = this.validarRequeridos(form);
      if (validacion) {
        err.textContent = validacion;
        err.hidden = false;
        return;
      }

      /** Fase 3 — hcaptcha_token obligatorio; en fase 1 el backend puede responder 422. */
      const payload = armarPayload(form, this.campos);

      this.enviando = true;
      btn.disabled = true;

      try {
        const res = await fetch(api, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(payload),
        });

        if (res.status === 422) {
          const detail = await leerDetail(res);
          err.textContent = detail ?? "Revisá los datos e intentá de nuevo.";
          err.hidden = false;
          this.enviando = false;
          btn.disabled = false;
          return;
        }

        if (!res.ok) {
          throw new Error("http");
        }

        const exito =
          typeof this.marca.formulario_texto_exito === "string" && this.marca.formulario_texto_exito.trim()
            ? escapeHtml(this.marca.formulario_texto_exito.trim())
            : "Recibimos tus datos. Te contactaremos pronto.";
        this.shadowRoot.innerHTML = `<style>${CSS}</style><p class="ok">${exito}</p>`;
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
