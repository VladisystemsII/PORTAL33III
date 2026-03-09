// detalle-propiedad.js — Lógica de carga del detalle de una propiedad
// Dependencia: config.js debe cargarse antes que este script.
// Recibe ?codigo=XXXX desde la URL — mismo patrón que articulo.js

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
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1200`;
  }
  return url;
}

// ===== CARGA PRINCIPAL =====
async function cargarPropiedad() {
  const mensajeCarga      = document.getElementById('mensajeCarga');
  const contenidoPropiedad = document.getElementById('contenidoPropiedad');

  const params = new URLSearchParams(window.location.search);
  const codigo = params.get("codigo");

  if (!codigo) {
    mostrarError('No se especificó el código de la propiedad.');
    return;
  }

  try {
    mensajeCarga.style.display = 'block';
    contenidoPropiedad.style.display = 'none';

    const response = await fetch(PORTAL33_CONFIG.PROPIEDADES_ENDPOINT);
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);

    const data = await response.json();

    const propiedad = data.find(p =>
      p["CÓDIGO"]?.trim() === codigo.trim() &&
      String(p["Activo (si/no)"]).toLowerCase() === "si"
    );

    if (!propiedad) {
      mostrarError('Propiedad no encontrada o inactiva.');
      return;
    }

    renderizarPropiedad(propiedad);
    mensajeCarga.style.display = 'none';
    contenidoPropiedad.style.display = 'block';

  } catch (error) {
    console.error('❌ Error cargando propiedad:', error);
    mostrarError('Error al cargar la información. Intenta más tarde.');
  }
}

// ===== RENDERIZAR =====
function renderizarPropiedad(prop) {
  // Título y ubicación
  document.getElementById('propTitulo').textContent = prop["Título"] || "Sin título";
  const ciudad = prop["Ciudad"] || "";
  const barrio = prop["Barrio/Sector"] || "";
  document.getElementById('propUbicacion').textContent =
    `${ciudad}${barrio ? ', ' + barrio : ''}`;

  // Tipo
  const tipo = prop["Tipo"] || "Propiedad";
  const clasificacion = prop["Residencial / Comercial"] || "";
  document.getElementById('propTipo').textContent = `${tipo} ${clasificacion}`.trim();

  // Características
  document.getElementById('propArea').textContent         = prop["Área m2"] || "0";
  document.getElementById('propHabitaciones').textContent = prop["Habitaciones"] || "0";
  document.getElementById('propBanos').textContent        = prop["Baños"] || "0";
  document.getElementById('propParqueaderos').textContent = prop["Parqueaderos"] || "0";

  // Descripción
  document.getElementById('propDescripcion').textContent =
    prop["Descripción"] || "Sin descripción disponible.";

  // Precios
  const estado      = prop["Estado"] || "";
  const pVenta      = prop["Precio Venta COP"] || "";
  const pArriendo   = prop["Precio Arriendo COP"] || "";

  if (estado.includes("Venta") && pVenta) {
    document.getElementById('propPrecioVenta').textContent  = pVenta;
    document.getElementById('propEstadoVenta').textContent  = "Precio de venta";
  } else if (estado.includes("Arriendo") && pArriendo) {
    document.getElementById('propPrecioVenta').textContent  = pArriendo;
    document.getElementById('propEstadoVenta').textContent  = "Precio de arriendo";
  } else {
    document.getElementById('propPrecioVenta').textContent  = "Consultar";
    document.getElementById('propEstadoVenta').textContent  = "";
  }

  if (estado.includes("Venta") && estado.includes("Arriendo") && pArriendo) {
    document.getElementById('precioArriendoBox').style.display = 'block';
    document.getElementById('propPrecioArriendo').textContent  = pArriendo;
  }

  // Detalles extra
  document.getElementById('propEstrato').textContent        = prop["Estrato"] || "-";
  document.getElementById('propAdministracion').textContent = prop["Administración"] || "-";
  document.getElementById('propClasificacion').textContent  = prop["Residencial / Comercial"] || "-";

  // Galería
  cargarGaleria(prop);

  // WhatsApp
  document.getElementById('btnWhatsapp').onclick = () => {
    const titulo   = prop["Título"] || "esta propiedad";
    const codProp  = prop["CÓDIGO"] || "";
    const mensaje  = `Hola! Estoy interesado en la propiedad *${codProp}*: ${titulo}`;
    window.open(
      `https://wa.me/${PORTAL33_CONFIG.WHATSAPP_NUMBER}?text=${encodeURIComponent(mensaje)}`,
      '_blank'
    );
  };
}

// ===== GALERÍA =====
function cargarGaleria(prop) {
  const fotosArray = [];

  for (let i = 1; i <= 8; i++) {
    const url = prop[`Foto ${i}`];
    if (!url || url.trim() === '') continue;
    const normalizada = normalizarFoto(url);
    if (normalizada) fotosArray.push(normalizada);
  }

  if (fotosArray.length === 0) {
    fotosArray.push('img/sin-imagen.png');
  }

  // Foto principal
  const imgPrincipal = document.getElementById('imgPrincipal');
  imgPrincipal.src = fotosArray[0];
  imgPrincipal.onerror = function () { this.src = 'img/sin-imagen.png'; };

  // Thumbnails
  const thumbnailsContainer = document.getElementById('thumbnailsContainer');
  thumbnailsContainer.innerHTML = '';

  fotosArray.forEach((foto, index) => {
    const thumbnail = document.createElement('div');
    thumbnail.className = 'thumbnail' + (index === 0 ? ' active' : '');

    const img = document.createElement('img');
    img.src     = foto;
    img.alt     = `Foto ${index + 1}`;
    img.loading = 'lazy';
    img.onerror = function () { this.src = 'img/sin-imagen.png'; };

    thumbnail.appendChild(img);

    thumbnail.addEventListener('click', () => {
      document.getElementById('imgPrincipal').src = foto;
      document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
      thumbnail.classList.add('active');
    });

    thumbnailsContainer.appendChild(thumbnail);
  });
}

// ===== ERROR =====
function mostrarError(mensaje) {
  document.getElementById('mensajeCarga').innerHTML = `
    <div class="mensaje-error">
      <h2>⚠️ ${mensaje}</h2>
      <p>La propiedad que buscas no está disponible.</p>
      <a href="propiedades.html" class="btn-volver"
         style="display:inline-flex; position:static; margin:20px auto 0;">
        ← Volver al listado
      </a>
    </div>
  `;
}

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', cargarPropiedad);
