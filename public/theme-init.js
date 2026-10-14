// Aplica el tema oscuro antes del primer render (evita el flash claro).
// Vive fuera de index.html para que la CSP no necesite 'unsafe-inline' ni un hash.
;(function () {
  try {
    var key = "prometio-theme"
    var theme = localStorage.getItem(key)
    var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    var isDark = theme === "dark" || (theme === "system" && prefersDark)
    if (isDark) document.documentElement.classList.add("dark")
  } catch (_) {}
})()
