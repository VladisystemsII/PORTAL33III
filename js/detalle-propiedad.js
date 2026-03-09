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

  // Extraer fileId de cualquier formato de URL de Drive
  const fileId = extraerFileId(url);
  if (fileId) {
    // uc?export=view funciona en móvil real y GitHub Pages sin sesión
    return `https://drive.google.com/uc?export=view&id=${fileId}`;
  }

  // Si no es Drive, retornar URL original
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
      p["codigo"]?.trim() === codigo.trim() &&
      String(p["activo (si/no)"]).toLowerCase() === "si"
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
  document.getElementById('propTitulo').textContent = prop["titulo"] || "Sin título";
  const ciudad = prop["ciudad"] || "";
  const barrio = prop["barrio/sector"] || "";
  document.getElementById('propUbicacion').textContent =
    `${ciudad}${barrio ? ', ' + barrio : ''}`;

  // Tipo
  const tipo = prop["tipo"] || "Propiedad";
  const clasificacion = prop["residencial / comercial"] || "";
  document.getElementById('propTipo').textContent = `${tipo} ${clasificacion}`.trim();

  // Características
  document.getElementById('propArea').textContent         = prop["area m2"] || "0";
  document.getElementById('propHabitaciones').textContent = prop["habitaciones"] || "0";
  document.getElementById('propBanos').textContent        = prop["banos"] || "0";
  document.getElementById('propParqueaderos').textContent = prop["parqueaderos"] || "0";

  // Descripción
  document.getElementById('propDescripcion').textContent =
    prop["descripcion"] || "Sin descripción disponible.";

  // Precios
  const estado      = prop["estado"] || "";
  const pVenta      = prop["precio venta cop"] || "";
  const pArriendo   = prop["precio arriendo cop"] || "";

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
  document.getElementById('propEstrato').textContent        = prop["estrato"] || "-";
  document.getElementById('propAdministracion').textContent = prop["administracion"] || "-";
  document.getElementById('propClasificacion').textContent  = prop["residencial / comercial"] || "-";

  // Galería
  cargarGaleria(prop);

  // WhatsApp
  document.getElementById('btnWhatsapp').onclick = () => {
    const titulo   = prop["titulo"] || "esta propiedad";
    const codProp  = prop["codigo"] || "";
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
    const url = prop[`foto ${i}`];
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
