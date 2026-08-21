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

  const CSS = `
    :host {
      display: block;
      max-width: 26rem;
      font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
      color: #06080b;
      line-height: 1.4;
    }
    * { box-sizing: border-box; }
    form {
      margin: 0;
      padding: 1.25rem;
      background: #ffffff;
      border: 1px solid #e4eaed;
      border-radius: 0.625rem;
    }
    .campo { margin: 0 0 0.85rem; }
    label {
      display: block;
      margin-bottom: 0.35rem;
      font-size: 0.8rem;
      font-weight: 500;
      color: #083b55;
    }
    .req { color: #05729f; }
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
      border-color: #05c7e8;
      box-shadow: 0 0 0 3px color-mix(in srgb, #05c7e8 35%, transparent);
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
      background: #05729f;
      color: #ffffff;
      font: inherit;
      font-size: 0.9rem;
      font-weight: 500;
      cursor: pointer;
    }
    button:hover:not(:disabled) { background: #075373; }
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
      color: #083b55;
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

  class PrometioFormulario extends HTMLElement {
    constructor() {
      super();
      this.enviando = false;
      this.attachShadow({ mode: "open" });
    }

    connectedCallback() {
      if (this.shadowRoot.childElementCount) {
        return;
      }
      this.render();
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
