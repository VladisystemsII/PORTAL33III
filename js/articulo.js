// articulo.js — Lógica de carga del detalle de artículo de Portal33
// Dependencia: config.js debe cargarse antes que este script.
// Dependencia: marked.js debe cargarse antes que este script.
// Dependencia: DOM debe tener #loadingArticulo y #articleContainer.

document.addEventListener("DOMContentLoaded", function () {

  const loading     = document.getElementById("loadingArticulo");
  const containerEl = document.getElementById("articleContainer");
  const titleEl     = document.getElementById("articleTitle");
  const dateEl      = document.getElementById("articleDate");
  const resumenEl   = document.getElementById("articleResumen");
  const contentEl   = document.getElementById("articleContent");

  // Configuración de marked.js — seguro y limpio
  marked.setOptions({
    breaks: true,        // saltos de línea simples = <br>
    gfm: true,           // GitHub Flavored Markdown — negrillas, listas, etc.
    headerIds: false,    // no genera IDs en encabezados
    mangle: false        // no altera el texto
  });

  // Obtener código desde parámetro URL
  const params = new URLSearchParams(window.location.search);
  const codigo = params.get("codigo");

  // Sin código en URL → mostrar error inmediato
  if (!codigo) {
    loading.style.display = "none";
    titleEl.textContent   = "Artículo no encontrado";
    containerEl.style.display = "block";
    return;
  }

  loading.style.display = "block";

  fetch(PORTAL33_CONFIG.BLOG_ENDPOINT)
    .then(function (response) {
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      return response.json();
    })
    .then(function (data) {

      const post = data.find(function (p) {
        return (
          p["CÓDIGO"]?.trim() === codigo.trim() &&
          String(p["Activo (si/no)"]).toLowerCase() === "si"
        );
      });

      if (!post) {
        titleEl.textContent = "Artículo no encontrado o inactivo";
        containerEl.style.display = "block";
        return;
      }

      // Título — con o sin tilde
      titleEl.textContent = post["Título"] || post["Titulo"] || "";

      // Fecha formateada
      dateEl.textContent = new Date(post["Fecha"]).toLocaleDateString("es-CO", {
        year: "numeric",
        month: "long",
        day: "numeric"
      });

      // Resumen — texto plano debajo de la fecha
      resumenEl.textContent = post["Resumen"] || "";

      // Contenido — Markdown → HTML
      const contenido = post["Contenido"] || post["contenido"] || "";
      contentEl.innerHTML = contenido.trim()
        ? marked.parse(contenido)
        : "<p>Este artículo no tiene contenido disponible.</p>";

      containerEl.style.display = "block";
    })
    .catch(function (err) {
      console.error("❌ Error cargando artículo:", err);
      titleEl.textContent = "Error al cargar el artículo. Intenta más tarde.";
      containerEl.style.display = "block";
    })
    .finally(function () {
      loading.style.display = "none";
    });
});
