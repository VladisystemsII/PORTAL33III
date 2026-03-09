// propiedades.js — Lógica de carga y renderizado del listado de propiedades
// Dependencia: config.js debe cargarse antes que este script.

// ===== NORMALIZAR URLs DE GOOGLE DRIVE =====
function extraerFileId(url) {
  if (!url || url.trim() === '') return null;
  url = url.trim();

  let m = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (m) return m[1];

  m = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (m) return m[1];

  m = url.match(/\/d\/([a-zA-Z0-9_-]{10,})/);
  if (m) return m[1];

  return null;
}

function normalizarFoto(url) {
  if (!url || url.trim() === '') return null;
  if (url.includes('drive.google.com/uc?')) return url;

  const fileId = extraerFileId(url);
  if (fileId) {
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w400`;
  }
  return url;
}

// ===== SANITIZAR =====
function sanitize(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

// ===== CARGAR Y RENDERIZAR PROPIEDADES =====
async function loadPropiedades() {
  const loading  = document.getElementById("loadingPropiedades");
  const grid     = document.getElementById("propiedadesGrid");

  try {
    loading.style.display = "block";
    grid.innerHTML = "";

    const response = await fetch(PORTAL33_CONFIG.PROPIEDADES_ENDPOINT);
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);

    const data = await response.json();

    const activas = data.filter(
      p => String(p["Activo (si/no)"]).toLowerCase() === "si"
    );

    if (activas.length === 0) {
      grid.innerHTML = `
        <p style="text-align:center; color:#555; padding:40px; grid-column:1/-1;">
          No hay propiedades disponibles en este momento.
        </p>`;
      return;
    }

    activas.forEach(prop => {
      // Primera foto disponible
      let fotoSrc = 'img/sin-imagen.png';
      for (let i = 1; i <= 8; i++) {
        const url = prop[`Foto ${i}`];
        if (url && url.trim() !== '') {
          const normalizada = normalizarFoto(url);
          if (normalizada) { fotoSrc = normalizada; break; }
        }
      }

      const codigo  = prop["CÓDIGO"] || "";
      const titulo  = prop["Título"] || "Sin título";
      const ciudad  = prop["Ciudad"] || "";
      const barrio  = prop["Barrio/Sector"] || "";
      const tipo    = prop["Tipo"] || "";
      const area    = prop["Área m2"] || "0";
      const hab     = prop["Habitaciones"] || "0";
      const banos   = prop["Baños"] || "0";
      const estado  = prop["Estado"] || "";
      const pVenta  = prop["Precio Venta COP"] || "";
      const pArriendo = prop["Precio Arriendo COP"] || "";

      // Precio a mostrar
      let precio = "Consultar";
      if (estado.includes("Venta") && pVenta)       precio = pVenta;
      else if (estado.includes("Arriendo") && pArriendo) precio = pArriendo;

      const ubicacion = `${ciudad}${barrio ? ', ' + barrio : ''}`;

      const card = document.createElement("div");
      card.className = "prop-card";
      card.innerHTML = `
        <div class="prop-img">
          <img src="${fotoSrc}" alt="${sanitize(titulo)}" loading="lazy"
               onerror="this.src='img/sin-imagen.png'">
        </div>
        <div class="prop-body">
          <h3>${sanitize(titulo)}</h3>
          <p class="prop-meta">📍 ${sanitize(ubicacion)}</p>
          <p class="prop-meta">${sanitize(tipo)} · ${sanitize(area)} m²
            · 🛏️ ${sanitize(hab)} · 🚿 ${sanitize(banos)}</p>
          <p class="prop-meta">${sanitize(estado)}</p>
          <div class="prop-price">${sanitize(precio)}</div>
          <button class="prop-btn" data-codigo="${sanitize(codigo)}">
            Ver detalle
          </button>
        </div>
      `;

      // Navegar a detalle pasando código por URL
      card.querySelector(".prop-btn").addEventListener("click", function () {
        const cod = this.getAttribute("data-codigo");
        window.location.href = `detalle-propiedad.html?codigo=${encodeURIComponent(cod)}`;
      });

      grid.appendChild(card);
    });

  } catch (err) {
    console.error("❌ Error cargando propiedades:", err);
    grid.innerHTML = `
      <p style="text-align:center; color:#d32f2f; padding:40px; grid-column:1/-1;">
        Error al cargar las propiedades. Intenta más tarde.
      </p>`;
  } finally {
    loading.style.display = "none";
  }
}

document.addEventListener("DOMContentLoaded", loadPropiedades);
