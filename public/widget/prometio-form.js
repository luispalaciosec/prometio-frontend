(function () {
  if (customElements.get("prometio-formulario")) {
    return;
  }

  /** Site key hCaptcha (pública, hardcodeada). */
  const HCAPTCHA_SITE_KEY = "0f7cabfa-c2ba-414e-ade0-2b2472222c96";
  const HCAPTCHA_SCRIPT = "https://js.hcaptcha.com/1/api.js";

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

  const TIPOGRAFIA = {
    sistema: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
    inter: '"Inter", ui-sans-serif, system-ui, sans-serif',
    poppins: '"Poppins", ui-sans-serif, system-ui, sans-serif',
  };

  const FONT_LINKS = {
    inter: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap",
    poppins: "https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap",
  };

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
    ::slotted(.hcaptcha-wrap) {
      display: block;
      margin: 0.15rem 0 0.85rem;
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

  function cargarTipografia(tipo) {
    const key = typeof tipo === "string" ? tipo.trim().toLowerCase() : "sistema";
    if (key === "inter" || key === "poppins") {
      const id = `prometio-font-${key}`;
      if (!document.getElementById(id)) {
        const link = document.createElement("link");
        link.id = id;
        link.rel = "stylesheet";
        link.href = FONT_LINKS[key];
        document.head.appendChild(link);
      }
    }
    return TIPOGRAFIA[key] ?? TIPOGRAFIA.sistema;
  }

  function radioBordesPx(marca) {
    const px = marca?.formulario_radio_bordes_px;
    if (typeof px === "number" && Number.isFinite(px) && px >= 0) {
      return `${px}px`;
    }
    return null;
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

  function armarPayload(form, campos, hcaptchaToken) {
    const body = {
      honeypot: vacioANull(form.elements.namedItem("honeypot")?.value),
      hcaptcha_token: hcaptchaToken,
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
      if (data && Array.isArray(data.detail) && data.detail.length > 0) {
        const first = data.detail[0];
        if (first && typeof first.msg === "string" && first.msg.trim()) {
          return first.msg.trim();
        }
      }
    } catch {
      /* cuerpo no JSON */
    }
    return null;
  }

  let hcaptchaScriptPromise = null;

  function cargarHcaptchaScript() {
    if (window.hcaptcha) {
      return Promise.resolve();
    }
    if (hcaptchaScriptPromise) {
      return hcaptchaScriptPromise;
    }
    hcaptchaScriptPromise = new Promise((resolve, reject) => {
      const existente = document.querySelector(`script[src="${HCAPTCHA_SCRIPT}"]`);
      if (existente) {
        existente.addEventListener("load", () => resolve(), { once: true });
        existente.addEventListener("error", () => reject(new Error("hcaptcha")), { once: true });
        if (window.hcaptcha) {
          resolve();
        }
        return;
      }
      const script = document.createElement("script");
      script.src = HCAPTCHA_SCRIPT;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("hcaptcha"));
      document.head.appendChild(script);
    });
    return hcaptchaScriptPromise;
  }

  function tokenHcaptcha(widgetId) {
    if (widgetId === null || widgetId === undefined || !window.hcaptcha) {
      return "";
    }
    try {
      return String(window.hcaptcha.getResponse(widgetId) ?? "").trim();
    } catch {
      return "";
    }
  }

  function resetHcaptcha(widgetId) {
    if (widgetId === null || widgetId === undefined || !window.hcaptcha) {
      return;
    }
    try {
      window.hcaptcha.reset(widgetId);
    } catch {
      /* widget ya removido */
    }
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
      this.captchaWidgetId = null;
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
      this.destruirCaptcha();
      this.shadowRoot.innerHTML = `<style>${CSS}</style><p class="loading">Cargando formulario…</p>`;
    }

    renderFatal(message) {
      this.destruirCaptcha();
      this.shadowRoot.innerHTML = `<style>${CSS}</style><p class="fatal">${escapeHtml(message)}</p>`;
    }

    destruirCaptcha() {
      const wrap = this.querySelector(".hcaptcha-wrap");
      if (wrap) {
        wrap.remove();
      }
      if (this.captchaWidgetId !== null) {
        resetHcaptcha(this.captchaWidgetId);
        if (window.hcaptcha) {
          try {
            window.hcaptcha.remove(this.captchaWidgetId);
          } catch {
            /* ya removido */
          }
        }
      }
      this.captchaWidgetId = null;
    }

    asegurarContenedorCaptcha() {
      let wrap = this.querySelector(".hcaptcha-wrap");
      if (!wrap) {
        wrap = document.createElement("div");
        wrap.className = "hcaptcha-wrap";
        wrap.setAttribute("slot", "hcaptcha");
        this.appendChild(wrap);
      }
      return wrap;
    }

    async montarCaptcha() {
      const wrap = this.asegurarContenedorCaptcha();
      wrap.replaceChildren();
      if (this.captchaWidgetId !== null) {
        if (window.hcaptcha) {
          try {
            window.hcaptcha.remove(this.captchaWidgetId);
          } catch {
            /* noop */
          }
        }
        this.captchaWidgetId = null;
      }

      await cargarHcaptchaScript();
      if (!window.hcaptcha) {
        throw new Error("hcaptcha");
      }

      this.captchaWidgetId = window.hcaptcha.render(wrap, {
        sitekey: HCAPTCHA_SITE_KEY,
      });
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

      const [marcaResult, camposResult, hcaptchaResult] = await Promise.allSettled([
        marcaUrl ? fetch(marcaUrl, { headers: { Accept: "application/json" } }) : Promise.reject(),
        camposUrl ? fetch(camposUrl, { headers: { Accept: "application/json" } }) : Promise.reject(),
        cargarHcaptchaScript(),
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

      if (hcaptchaResult.status === "rejected") {
        const err = this.shadowRoot.querySelector(".err");
        if (err) {
          err.textContent = "No se pudo cargar el captcha. Recargá la página.";
          err.hidden = false;
        }
        return;
      }

      try {
        await this.montarCaptcha();
      } catch {
        const err = this.shadowRoot.querySelector(".err");
        if (err) {
          err.textContent = "No se pudo cargar el captcha. Recargá la página.";
          err.hidden = false;
        }
      }
    }

    renderForm() {
      const camposHtml = this.campos.map((def) => htmlCampo(def)).join("");
      const textoBoton =
        typeof this.marca.formulario_texto_boton === "string" && this.marca.formulario_texto_boton.trim()
          ? escapeHtml(this.marca.formulario_texto_boton.trim())
          : "Enviar";
      const tituloHtml =
        typeof this.marca.formulario_titulo === "string" && this.marca.formulario_titulo.trim()
          ? `<h2 class="titulo">${escapeHtml(this.marca.formulario_titulo.trim())}</h2>`
          : "";

      this.shadowRoot.innerHTML = `
        <style>${CSS}</style>
        <form novalidate>
          <div class="logo-wrap" hidden>
            <img class="logo" alt="" />
          </div>
          ${tituloHtml}
          <p class="err" hidden></p>
          ${camposHtml}
          <div class="hp" aria-hidden="true">
            <label for="prometio-hp">Sitio web</label>
            <input id="prometio-hp" name="honeypot" type="text" tabindex="-1" autocomplete="off" />
          </div>
          <slot name="hcaptcha"></slot>
          <button type="submit">${textoBoton}</button>
        </form>
      `;

      this.shadowRoot.querySelector("form").addEventListener("submit", (event) => {
        void this.onSubmit(event);
      });

      this.asegurarContenedorCaptcha();
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

      const radio = radioBordesPx(marca);
      if (radio) {
        this.style.setProperty("--pf-radio", radio);
      }

      const fontFamily = cargarTipografia(marca.formulario_tipografia);
      this.style.setProperty("--pf-font-family", fontFamily);

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

      const captchaToken = tokenHcaptcha(this.captchaWidgetId);
      if (!captchaToken) {
        err.textContent = "Completá el captcha.";
        err.hidden = false;
        return;
      }

      const payload = armarPayload(form, this.campos, captchaToken);

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
          resetHcaptcha(this.captchaWidgetId);
          this.enviando = false;
          btn.disabled = false;
          return;
        }

        if (!res.ok) {
          throw new Error("http");
        }

        this.destruirCaptcha();
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
