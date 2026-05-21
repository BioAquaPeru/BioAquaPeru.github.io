const AUTH_USER = "admin";
const AUTH_PASS = "eduargarcia";
const AUTH_KEY = "glaucus_report_auth";
const COUNTER_PREFIX = "glaucus_report_counter_";
const MAX_IMAGE_DIMENSION = 1800;
const IMAGE_QUALITY = 0.86;

// Edita aqui la marca fija del PDF. Para cambiar el logo, coloca el archivo en assets
// y actualiza logoSrc, por ejemplo: "assets/logo-tellus.png".
const REPORT_BRAND = {
  logoSrc: "assets/logo-tellus.png",
  name: "Glaucus",
  slogan: "Tecnologia e innovacion en tratamiento de aguas."
};

const SAFE_TRANSPARENT_LOGO =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=";

// Edita esta lista cuando quieras agregar nuevos clientes.
const CLIENTES = [
  
  {
    nombre: "BOMBONERIA DI PERUGIA S.A.C.",
    ruc: "20126426870",
    direccion: "AV. LA PAZ NRO. 2350 URB. MIRAMAR - LIMA - SAN MIGUEL"
  },
  {
    nombre: "FRIOPAN S.A.C.",
    ruc: "20468826951",
    direccion: "MZA. J LOTE. 6-B URB. SAN JUAN BAUTISTA - LIMA - CHORRILLOS"
  },
  {
    nombre: "RESTAURANTECH PERU S.R.L. ( SUCURSAL SURQUILLO )",
    ruc: "20607486990",
    direccion: "JR. MANUEL GONZALES PRADA 1035 URB. SAN JORGE - LIMA - SURQUILLO"
  },
  {
    nombre: "RESTAURANTECH PERU S.R.L. ( SUCURSAL MAGDALENA )",
    ruc: "20607486990",
    direccion: "JCAL.AMAZONAS NRO. 635 RES. OYAGUE LIMA - LIMA - MAGDALENA DEL MAR"
  }
];

const els = {
  loginGate: document.getElementById("loginGate"),
  reportApp: document.getElementById("reportApp"),
  loginForm: document.getElementById("loginForm"),
  loginUser: document.getElementById("loginUser"),
  loginPass: document.getElementById("loginPass"),
  loginStatus: document.getElementById("loginStatus"),
  reportForm: document.getElementById("reportForm"),
  previewCode: document.getElementById("previewCode"),
  cliente: document.getElementById("clienteSelect"),
  ruc: document.getElementById("rucInput"),
  direccion: document.getElementById("direccionInput"),
  responsable: document.getElementById("responsableInput"),
  fecha: document.getElementById("fechaInput"),
  videoTitle: document.getElementById("videoTitleInput"),
  videoUrl: document.getElementById("videoUrlInput"),
  addVideo: document.getElementById("addVideoBtn"),
  videosList: document.getElementById("videosList"),
  addSection: document.getElementById("addSectionBtn"),
  sectionsList: document.getElementById("sectionsList"),
  generatePrompt: document.getElementById("generatePromptBtn"),
  aiPrompt: document.getElementById("aiPromptInput"),
  summary: document.getElementById("summaryInput"),
  copyPrompt: document.getElementById("copyPromptBtn"),
  pasteSummary: document.getElementById("pasteSummaryBtn"),
  recommendationsChecklist: document.getElementById("recommendationsChecklist"),
  generateRecommendationsPrompt: document.getElementById("generateRecommendationsPromptBtn"),
  recommendationsPrompt: document.getElementById("recommendationsPromptInput"),
  recommendations: document.getElementById("recommendationsInput"),
  copyRecommendationsPrompt: document.getElementById("copyRecommendationsPromptBtn"),
  pasteRecommendations: document.getElementById("pasteRecommendationsBtn"),
  previewPdf: document.getElementById("previewPdfBtn"),
  previewPanel: document.getElementById("pdfPreviewPanel"),
  previewGrid: document.getElementById("pdfPreviewGrid"),
  downloadPreview: document.getElementById("downloadFromPreviewBtn"),
  status: document.getElementById("status"),
  pdfRoot: document.getElementById("pdfRenderRoot")
};

const state = {
  brandLogoSrc: REPORT_BRAND.logoSrc,
  sections: [],
  videos: [],
  fallbackStorage: {},
  lastPdfBlob: null,
  lastPdfName: "",
  recommendationSectionIds: new Set()
};

function storageGet(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return state.fallbackStorage[key] || null;
  }
}

function storageSet(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    state.fallbackStorage[key] = value;
  }
}

function sessionGet(key) {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return state.fallbackStorage[key] || null;
  }
}

function sessionSet(key, value) {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    state.fallbackStorage[key] = value;
  }
}

function setStatus(target, message, type = "") {
  if (!target) return;
  target.textContent = message;
  target.classList.remove("ok", "error");
  if (type) target.classList.add(type);
}

function monthKey(date = new Date()) {
  return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function counterKey(date = new Date()) {
  return `${COUNTER_PREFIX}${monthKey(date)}`;
}

function formatReportCode(date, counter) {
  return `GL-${monthKey(date)}${String(counter).padStart(3, "0")}`;
}

function nextCounterPreview(date = new Date()) {
  return Number(storageGet(counterKey(date)) || "0") + 1;
}

function updatePreviewCode() {
  els.previewCode.textContent = formatReportCode(new Date(), nextCounterPreview());
}

function reserveReportCode() {
  const now = new Date();
  const key = counterKey(now);
  const next = Number(storageGet(key) || "0") + 1;
  storageSet(key, String(next));
  updatePreviewCode();
  return formatReportCode(now, next);
}

function draftReportCode() {
  return formatReportCode(new Date(), nextCounterPreview());
}

function todayISO() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function formatDate(value) {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function normalizeUrl(value) {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
}

function getPendingVideo() {
  const url = normalizeUrl(els.videoUrl.value.trim());
  if (!url) return null;
  return {
    id: uniqueId("video"),
    title: els.videoTitle.value.trim(),
    url
  };
}

function sanitizeFilePart(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "") || "Cliente";
}

function uniqueId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function populateClientes() {
  CLIENTES.forEach((cliente) => {
    const option = document.createElement("option");
    option.value = cliente.nombre;
    option.textContent = cliente.nombre;
    els.cliente.appendChild(option);
  });
}

function fillClienteData() {
  const selected = CLIENTES.find((item) => item.nombre === els.cliente.value);
  els.ruc.value = selected?.ruc || "";
  els.direccion.value = selected?.direccion || "";
}

function showApp() {
  els.loginGate.hidden = true;
  els.reportApp.hidden = false;
  updatePreviewCode();
}

function guardAccess() {
  if (sessionGet(AUTH_KEY) === "1") {
    showApp();
    return;
  }
  els.loginGate.hidden = false;
  els.reportApp.hidden = true;
}

function handleLogin(event) {
  event.preventDefault();
  if (!els.loginForm.checkValidity()) {
    els.loginForm.reportValidity();
    return;
  }

  if (els.loginUser.value.trim() === AUTH_USER && els.loginPass.value.trim() === AUTH_PASS) {
    sessionSet(AUTH_KEY, "1");
    setStatus(els.loginStatus, "Acceso concedido.", "ok");
    showApp();
    return;
  }

  setStatus(els.loginStatus, "Credenciales incorrectas.", "error");
}

function loadImageDataUrl(file, options = {}) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;

    if (options.raw) {
      reader.readAsDataURL(file);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const ratio = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(img.width, img.height));
      const width = Math.max(1, Math.round(img.width * ratio));
      const height = Math.max(1, Math.round(img.height * ratio));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d", { alpha: false });
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(objectUrl);
      resolve(canvas.toDataURL("image/jpeg", IMAGE_QUALITY));
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("No se pudo leer la imagen."));
    };
    img.src = objectUrl;
  });
}

async function loadBrandLogo() {
  try {
    const response = await fetch(REPORT_BRAND.logoSrc);
    if (!response.ok) throw new Error("No se pudo cargar el logo.");

    const blob = await response.blob();
    state.brandLogoSrc = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn("No se pudo convertir el logo del membrete:", error);
    state.brandLogoSrc = SAFE_TRANSPARENT_LOGO;
  }
}

function addSection(title = "Nueva seccion") {
  state.sections.push({
    id: uniqueId("section"),
    title,
    images: []
  });
  renderSections();
}

function removeSection(sectionId) {
  state.sections = state.sections.filter((section) => section.id !== sectionId);
  renderSections();
}

function addVideo() {
  const video = getPendingVideo();
  if (!video) {
    setStatus(els.status, "Agrega el link del video antes de guardarlo.", "error");
    els.videoUrl.focus();
    return;
  }

  state.videos.push(video);
  els.videoTitle.value = "";
  els.videoUrl.value = "";
  renderVideos();
  setStatus(els.status, "Video agregado.", "ok");
}

function removeVideo(videoId) {
  state.videos = state.videos.filter((video) => video.id !== videoId);
  renderVideos();
}

function renderVideos() {
  els.videosList.innerHTML = "";

  if (state.videos.length === 0) {
    const empty = document.createElement("p");
    empty.className = "video-empty";
    empty.textContent = "Aun no hay videos agregados.";
    els.videosList.appendChild(empty);
    return;
  }

  state.videos.forEach((video, index) => {
    const card = document.createElement("article");
    card.className = "video-card";

    const fields = document.createElement("div");
    fields.className = "video-card-fields";

    const titleLabel = document.createElement("label");
    titleLabel.className = "field";
    titleLabel.textContent = "Titulo del video";
    const titleInput = document.createElement("input");
    titleInput.type = "text";
    titleInput.value = video.title;
    titleInput.placeholder = `Video ${index + 1}`;
    titleInput.addEventListener("input", (event) => {
      video.title = event.target.value;
    });
    titleLabel.appendChild(titleInput);

    const urlLabel = document.createElement("label");
    urlLabel.className = "field";
    urlLabel.textContent = "Link del video";
    const urlInput = document.createElement("input");
    urlInput.type = "text";
    urlInput.value = video.url;
    urlInput.placeholder = "https://drive.google.com/...";
    urlInput.addEventListener("input", (event) => {
      video.url = normalizeUrl(event.target.value.trim());
    });
    urlLabel.appendChild(urlInput);

    fields.append(titleLabel, urlLabel);

    const tools = document.createElement("div");
    tools.className = "video-tools";
    const deleteVideoBtn = document.createElement("button");
    deleteVideoBtn.type = "button";
    deleteVideoBtn.className = "btn btn-danger";
    deleteVideoBtn.textContent = "Quitar video";
    deleteVideoBtn.addEventListener("click", () => removeVideo(video.id));
    tools.appendChild(deleteVideoBtn);

    card.append(fields, tools);
    els.videosList.appendChild(card);
  });
}

async function addImagesToSection(sectionId, files) {
  const section = state.sections.find((item) => item.id === sectionId);
  if (!section) return;

  setStatus(els.status, "Procesando imagenes...");

  for (const file of files) {
    try {
      const dataUrl = await loadImageDataUrl(file);
      section.images.push({
        id: uniqueId("image"),
        dataUrl,
        description: ""
      });
    } catch {
      setStatus(els.status, `No se pudo procesar ${file.name}.`, "error");
    }
  }

  renderSections();
  setStatus(els.status, "Imagenes listas.", "ok");
}

function removeImage(sectionId, imageId) {
  const section = state.sections.find((item) => item.id === sectionId);
  if (!section) return;
  section.images = section.images.filter((image) => image.id !== imageId);
  renderSections();
}

function buildSectionDescriptionList() {
  const lines = [];

  state.sections
    .filter((section) => section.images.length > 0)
    .forEach((section) => {
      const title = section.title.trim() || "Seccion sin titulo";
      lines.push(`SECCION ${title.toUpperCase()}`);

      const descriptions = section.images
        .map((image) => image.description.trim())
        .filter(Boolean);

      if (descriptions.length === 0) {
        lines.push("- Sin descripciones registradas.");
      } else {
        descriptions.forEach((description) => {
          lines.push(`- ${description}`);
        });
      }

      lines.push("");
    });

  return lines.join("\n").trim();
}

function generateAiPrompt() {
  const list = buildSectionDescriptionList();

  if (!list) {
    setStatus(els.status, "Agrega fotos y descripciones para generar el prompt.", "error");
    return;
  }

  els.aiPrompt.value = [
    "Redacta un resumen tecnico profesional para un reporte de control y monitoreo de tratamiento de aguas.",
    "Usa un tono formal, claro y conciso. Resume las actividades realizadas, las verificaciones observadas y los valores relevantes.",
    "No inventes datos que no aparezcan en la lista. No menciones que analizaste fotos. Entrega 2 parrafos listos para pegar en el reporte.",
    "",
    "Datos registrados por seccion:",
    list
  ].join("\n");

  setStatus(els.status, "Prompt generado. Puedes copiarlo y enviarlo a tu IA.", "ok");
}

function getSelectedRecommendationSections() {
  return state.sections.filter((section) => state.recommendationSectionIds.has(section.id));
}

function buildRecommendationSourceList(sections) {
  return sections.map((section) => {
    const title = section.title.trim() || "Seccion sin titulo";
    const descriptions = section.images
      .map((image) => image.description.trim())
      .filter(Boolean);

    const lines = [`SECCION ${title.toUpperCase()}`];
    if (descriptions.length === 0) {
      lines.push("- Sin descripciones registradas.");
    } else {
      descriptions.forEach((description) => lines.push(`- ${description}`));
    }
    return lines.join("\n");
  }).join("\n\n");
}

function generateRecommendationsPrompt() {
  const selectedSections = getSelectedRecommendationSections();

  if (selectedSections.length === 0) {
    setStatus(els.status, "Selecciona al menos una seccion para generar recomendaciones.", "error");
    return;
  }

  els.recommendationsPrompt.value = [
    "Actua como especialista tecnico en tratamiento de aguas y mantenimiento preventivo.",
    "Con base en los registros indicados, redacta recomendaciones tecnicas y acciones sugeridas para el cliente.",
    "Usa tono formal, directo y profesional. No inventes datos. Prioriza acciones preventivas, seguimiento, limpieza, ajuste operacional o verificacion, solo cuando correspondan a la evidencia.",
    "Entrega una lista breve de recomendaciones listas para pegar en un reporte tecnico.",
    "",
    "Registros seleccionados:",
    buildRecommendationSourceList(selectedSections)
  ].join("\n");

  setStatus(els.status, "Prompt de recomendaciones generado.", "ok");
}

async function writeClipboard(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const helper = document.createElement("textarea");
  helper.value = text;
  helper.setAttribute("readonly", "");
  helper.style.position = "fixed";
  helper.style.left = "-9999px";
  document.body.appendChild(helper);
  helper.select();
  document.execCommand("copy");
  helper.remove();
}

async function copyPrompt() {
  const text = els.aiPrompt.value.trim();
  if (!text) {
    generateAiPrompt();
  }

  const promptText = els.aiPrompt.value.trim();
  if (!promptText) return;

  try {
    await writeClipboard(promptText);
    setStatus(els.status, "Prompt copiado al portapapeles.", "ok");
  } catch {
    els.aiPrompt.focus();
    els.aiPrompt.select();
    setStatus(els.status, "No se pudo copiar automaticamente. El prompt quedo seleccionado.", "error");
  }
}

async function copyRecommendationsPrompt() {
  const text = els.recommendationsPrompt.value.trim();
  if (!text) {
    generateRecommendationsPrompt();
  }

  const promptText = els.recommendationsPrompt.value.trim();
  if (!promptText) return;

  try {
    await writeClipboard(promptText);
    setStatus(els.status, "Prompt de recomendaciones copiado.", "ok");
  } catch {
    els.recommendationsPrompt.focus();
    els.recommendationsPrompt.select();
    setStatus(els.status, "No se pudo copiar automaticamente. El prompt quedo seleccionado.", "error");
  }
}

async function pasteSummary() {
  try {
    if (!navigator.clipboard?.readText) throw new Error("Clipboard no disponible.");
    const text = await navigator.clipboard.readText();
    els.summary.value = text.trim();
    setStatus(els.status, "Resumen pegado.", "ok");
  } catch {
    els.summary.focus();
    setStatus(els.status, "Pega el resumen con Ctrl+V en el campo de resumen.", "error");
  }
}

async function pasteRecommendations() {
  try {
    if (!navigator.clipboard?.readText) throw new Error("Clipboard no disponible.");
    const text = await navigator.clipboard.readText();
    els.recommendations.value = text.trim();
    setStatus(els.status, "Recomendaciones pegadas.", "ok");
  } catch {
    els.recommendations.focus();
    setStatus(els.status, "Pega las recomendaciones con Ctrl+V en el campo correspondiente.", "error");
  }
}

function renderRecommendationsChecklist() {
  els.recommendationsChecklist.innerHTML = "";

  state.sections.forEach((section) => {
    if (!state.recommendationSectionIds.has(section.id)) {
      state.recommendationSectionIds.add(section.id);
    }

    const label = document.createElement("label");
    label.className = "recommendation-option";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = state.recommendationSectionIds.has(section.id);
    checkbox.addEventListener("change", () => {
      if (checkbox.checked) {
        state.recommendationSectionIds.add(section.id);
      } else {
        state.recommendationSectionIds.delete(section.id);
      }
    });

    const text = document.createElement("span");
    text.textContent = section.title.trim() || "Seccion sin titulo";

    label.append(checkbox, text);
    els.recommendationsChecklist.appendChild(label);
  });
}

function renderSections() {
  els.sectionsList.innerHTML = "";
  state.recommendationSectionIds.forEach((sectionId) => {
    if (!state.sections.some((section) => section.id === sectionId)) {
      state.recommendationSectionIds.delete(sectionId);
    }
  });

  state.sections.forEach((section, sectionIndex) => {
    const card = document.createElement("article");
    card.className = "section-card";

    const head = document.createElement("div");
    head.className = "section-card-head";

    const titleInput = document.createElement("input");
    titleInput.className = "section-title-input";
    titleInput.value = section.title;
    titleInput.setAttribute("aria-label", `Titulo de seccion ${sectionIndex + 1}`);
    titleInput.addEventListener("input", (event) => {
      section.title = event.target.value;
    });

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "btn btn-danger";
    removeBtn.textContent = "Eliminar";
    removeBtn.addEventListener("click", () => removeSection(section.id));

    head.append(titleInput, removeBtn);

    const uploadLine = document.createElement("div");
    uploadLine.className = "upload-line";
    uploadLine.innerHTML = `<span>${section.images.length} foto(s). El PDF acomoda 1, 2, 3 o 4 por hoja y continua en la siguiente pagina.</span>`;

    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.multiple = true;
    fileInput.addEventListener("change", (event) => {
      const files = Array.from(event.target.files || []);
      event.target.value = "";
      addImagesToSection(section.id, files);
    });
    uploadLine.appendChild(fileInput);

    const imageList = document.createElement("div");
    imageList.className = "image-list";

    section.images.forEach((image, imageIndex) => {
      const imageCard = document.createElement("article");
      imageCard.className = "image-card";

      const img = document.createElement("img");
      img.src = image.dataUrl;
      img.alt = `Imagen ${imageIndex + 1} de ${section.title}`;

      const caption = document.createElement("textarea");
      caption.className = "caption-input";
      caption.rows = 2;
      caption.placeholder = "Descripcion para esta foto";
      caption.value = image.description;
      caption.addEventListener("input", (event) => {
        image.description = event.target.value;
      });

      const tools = document.createElement("div");
      tools.className = "image-tools";

      const deleteImageBtn = document.createElement("button");
      deleteImageBtn.type = "button";
      deleteImageBtn.className = "btn btn-danger";
      deleteImageBtn.textContent = "Quitar foto";
      deleteImageBtn.addEventListener("click", () => removeImage(section.id, image.id));

      tools.appendChild(deleteImageBtn);
      imageCard.append(img, caption, tools);
      imageList.appendChild(imageCard);
    });

    card.append(head, uploadLine, imageList);
    els.sectionsList.appendChild(card);
  });

  renderRecommendationsChecklist();
}

function chunkImages(images, size = 4) {
  const chunks = [];
  for (let index = 0; index < images.length; index += size) {
    chunks.push(images.slice(index, index + size));
  }
  return chunks;
}

function makeLetterhead(meta) {
  const header = document.createElement("header");
  header.className = "pdf-letterhead";

  const logo = document.createElement("img");
  logo.className = "pdf-logo";
  logo.src = meta.logoSrc;
  logo.alt = "Logo";

  const brand = document.createElement("div");
  brand.className = "pdf-brand";
  const brandName = document.createElement("h1");
  brandName.textContent = meta.brandName;
  const brandSlogan = document.createElement("p");
  brandSlogan.textContent = meta.brandSlogan;
  brand.append(brandName, brandSlogan);

  const codeBox = document.createElement("div");
  codeBox.className = "pdf-code-box";
  const codeLabel = document.createElement("span");
  codeLabel.textContent = "Codigo de informe";
  const code = document.createElement("strong");
  code.textContent = meta.reportCode;
  const date = document.createElement("span");
  date.textContent = `Fecha: ${meta.formattedDate}`;
  codeBox.append(codeLabel, code, date);

  header.append(logo, brand, codeBox);
  return header;
}

function makePage(meta) {
  const page = document.createElement("section");
  page.className = "pdf-page";
  const content = document.createElement("main");
  content.className = "pdf-content";
  const footer = document.createElement("footer");
  footer.className = "pdf-footer";
  footer.innerHTML = `
    <span class="pdf-footer-company">TELLUS ENGINEER SAC</span>
    <span class="pdf-footer-ruc">RUC 20610307087</span>
    <span class="pdf-footer-page">Pagina 1 de 1</span>
  `;
  page.append(makeLetterhead(meta), content, footer);
  return { page, content };
}

function buildDataPage(meta, data) {
  const { page, content } = makePage(meta);
  const title = document.createElement("h2");
  title.className = "pdf-title";
  title.textContent = "REPORTE TECNICO DE CONTROL Y MONITOREO";

  const sectionTitle = document.createElement("h3");
  sectionTitle.className = "pdf-section-title";
  sectionTitle.textContent = "Datos principales";

  const grid = document.createElement("div");
  grid.className = "pdf-data-grid";
  [
    ["Cliente", data.cliente, ""],
    ["RUC", data.ruc, ""],
    ["Direccion", data.direccion, "wide"],
    ["Responsable", data.responsable, ""],
    ["Fecha", meta.formattedDate, ""]
  ].forEach(([label, value, wide]) => {
    const item = document.createElement("div");
    item.className = `pdf-data-item ${wide}`.trim();
    const labelEl = document.createElement("b");
    labelEl.textContent = label;
    const valueEl = document.createElement("span");
    valueEl.textContent = value;
    item.append(labelEl, valueEl);
    grid.appendChild(item);
  });

  content.append(title, sectionTitle, grid);

  const summary = document.createElement("section");
  summary.className = "pdf-summary";
  const summaryTitle = document.createElement("h3");
  summaryTitle.textContent = "Resumen tecnico de actividades realizadas";
  summary.append(summaryTitle, ...makePdfTextParagraphs(data.summary));

  content.append(summary);

  if (data.videos.length > 0) {
    const video = document.createElement("section");
    video.className = "pdf-video";
    const videoTitle = document.createElement("h3");
    videoTitle.textContent = "Videos complementarios de evidencia";
    video.appendChild(videoTitle);
    data.videos.forEach((item, index) => {
      const videoItem = document.createElement("div");
      videoItem.className = "pdf-video-item";
      const videoText = document.createElement("p");
      videoText.textContent = item.title || `Video de evidencia ${index + 1}`;
      const videoLink = document.createElement("a");
      videoLink.className = "pdf-video-link";
      videoLink.href = item.url;
      videoLink.textContent = item.url;
      videoItem.append(videoText, videoLink);
      video.appendChild(videoItem);
    });
    content.append(video);
  }

  if (data.recommendations) {
    const recommendations = document.createElement("section");
    recommendations.className = "pdf-recommendations";
    const recommendationsTitle = document.createElement("h3");
    recommendationsTitle.textContent = "Recomendaciones tecnicas y acciones sugeridas";
    recommendations.append(recommendationsTitle, ...makePdfTextParagraphs(data.recommendations));
    content.append(recommendations);
  }

  return page;
}

function makePdfTextParagraphs(text) {
  return text
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => {
      const item = document.createElement("p");
      item.textContent = paragraph;
      return item;
    });
}

function makePhotoCard(image, index) {
  const card = document.createElement("article");
  card.className = "pdf-photo-card";
  const img = document.createElement("img");
  img.src = image.dataUrl;
  img.alt = `Evidencia ${index + 1}`;
  const caption = document.createElement("p");
  caption.className = "pdf-caption";
  caption.textContent = image.description.trim() || `Evidencia ${index + 1}`;
  card.append(img, caption);
  return card;
}

function buildImagePage(meta, section, images, pageIndex) {
  const { page, content } = makePage(meta);

  const reportTitle = document.createElement("h2");
  reportTitle.className = "pdf-title";
  reportTitle.textContent = "REPORTE TECNICO DE CONTROL Y MONITOREO";

  const title = document.createElement("h3");
  title.className = "pdf-section-title";
  title.textContent = section.title.trim() || "Seccion fotografica";
  if (pageIndex > 0) title.textContent += ` - Continuacion ${pageIndex + 1}`;

  const gallery = document.createElement("div");
  gallery.className = `pdf-gallery count-${images.length}`;
  images.forEach((image, index) => gallery.appendChild(makePhotoCard(image, index)));

  content.append(reportTitle, title, gallery);
  return page;
}

function collectData() {
  const pendingVideo = getPendingVideo();
  const videos = [...state.videos, ...(pendingVideo ? [pendingVideo] : [])]
    .map((video) => ({
      title: video.title.trim(),
      url: normalizeUrl(video.url.trim())
    }))
    .filter((video) => video.url);

  return {
    cliente: els.cliente.value.trim(),
    ruc: els.ruc.value.trim(),
    direccion: els.direccion.value.trim(),
    responsable: els.responsable.value.trim(),
    summary: els.summary.value.trim(),
    videos,
    recommendations: els.recommendations.value.trim()
  };
}

function collectMeta(reportCode) {
  return {
    reportCode,
    logoSrc: state.brandLogoSrc,
    brandName: REPORT_BRAND.name,
    brandSlogan: REPORT_BRAND.slogan,
    formattedDate: formatDate(els.fecha.value)
  };
}

function validateReport() {
  if (!els.reportForm.checkValidity()) {
    els.reportForm.reportValidity();
    setStatus(els.status, "Completa los campos principales.", "error");
    return false;
  }

  const sectionsWithImages = state.sections.filter((section) => section.images.length > 0);
  if (sectionsWithImages.length === 0) {
    setStatus(els.status, "Agrega al menos una seccion con fotos.", "error");
    return false;
  }

  if (!els.summary.value.trim()) {
    setStatus(els.status, "Agrega el resumen tecnico para completar la primera hoja.", "error");
    els.summary.focus();
    return false;
  }

  return true;
}

function buildPages(meta, data) {
  const pages = [buildDataPage(meta, data)];
  state.sections
    .filter((section) => section.images.length > 0)
    .forEach((section) => {
      chunkImages(section.images).forEach((images, index) => {
        pages.push(buildImagePage(meta, section, images, index));
      });
    });

  pages.forEach((page, index) => {
    page.querySelector(".pdf-footer-page").textContent = `Pagina ${index + 1} de ${pages.length}`;
  });

  return pages;
}

function waitForImages(container) {
  const images = Array.from(container.querySelectorAll("img"));
  return Promise.all(images.map((img) => {
    if (img.complete && img.naturalWidth > 0) return Promise.resolve();
    return new Promise((resolve) => {
      img.onload = resolve;
      img.onerror = resolve;
    });
  }));
}

async function capturePage(page) {
  await waitForImages(page);
  const canvas = await html2canvas(page, {
    scale: 2,
    backgroundColor: "#ffffff",
    useCORS: true
  });
  return canvas.toDataURL("image/jpeg", 0.92);
}

function showPreview(images) {
  els.previewGrid.innerHTML = "";
  images.forEach((src, index) => {
    const card = document.createElement("article");
    card.className = "preview-page-card";
    card.innerHTML = `<img src="${src}" alt="Pagina ${index + 1}" /><span>Pagina ${index + 1}</span>`;
    els.previewGrid.appendChild(card);
  });
  els.previewPanel.hidden = false;
}

function downloadBlob(blob, fileName) {
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
}

async function generateReport(options = {}) {
  const { reserveCode = false, download = false } = options;
  if (!validateReport()) return;

  if (!window.jspdf || !window.html2canvas) {
    setStatus(els.status, "No se cargaron las librerias PDF. Revisa tu conexion a internet.", "error");
    return;
  }

  setStatus(els.status, "Preparando PDF...");

  try {
    const reportCode = reserveCode ? reserveReportCode() : draftReportCode();
    const data = collectData();
    const meta = collectMeta(reportCode);
    const pages = buildPages(meta, data);
    els.pdfRoot.innerHTML = "";
    pages.forEach((page) => els.pdfRoot.appendChild(page));

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const previewImages = [];

    for (let index = 0; index < pages.length; index += 1) {
      const imageData = await capturePage(pages[index]);
      previewImages.push(imageData);
      if (index > 0) pdf.addPage();
      pdf.addImage(imageData, "JPEG", 0, 0, 210, 297, undefined, "FAST");
      addPdfPageLinks(pdf, pages[index]);
    }

    const fileName = `Informe_${sanitizeFilePart(data.cliente)}_${reportCode}.pdf`;
    const blob = pdf.output("blob");
    state.lastPdfBlob = blob;
    state.lastPdfName = fileName;
    showPreview(previewImages);

    if (download) {
      downloadBlob(blob, fileName);
      setStatus(els.status, "Informe generado y descargado correctamente.", "ok");
    } else {
      setStatus(els.status, "Vista previa generada correctamente.", "ok");
    }
  } catch (error) {
    console.error(error);
    setStatus(els.status, `Error al generar el PDF. ${error.message || ""}`.trim(), "error");
  } finally {
    els.pdfRoot.innerHTML = "";
  }
}

function addPdfPageLinks(pdf, page) {
  const links = Array.from(page.querySelectorAll("a[href]"));
  if (links.length === 0) return;

  const pageRect = page.getBoundingClientRect();
  const scaleX = 210 / pageRect.width;
  const scaleY = 297 / pageRect.height;

  links.forEach((link) => {
    const rect = link.getBoundingClientRect();
    const url = link.getAttribute("href");
    if (!url) return;

    pdf.link(
      (rect.left - pageRect.left) * scaleX,
      (rect.top - pageRect.top) * scaleY,
      rect.width * scaleX,
      rect.height * scaleY,
      { url }
    );
  });
}

function handleDownloadPreview() {
  if (!state.lastPdfBlob || !state.lastPdfName) {
    setStatus(els.status, "Primero genera una vista previa.", "error");
    return;
  }
  downloadBlob(state.lastPdfBlob, state.lastPdfName);
  setStatus(els.status, "PDF descargado.", "ok");
}

async function init() {
  await loadBrandLogo();
  populateClientes();
  els.fecha.value = todayISO();
  addSection("Control de pH");
  addSection("Observaciones");
  renderVideos();
  fillClienteData();
  updatePreviewCode();
  guardAccess();

  els.loginForm.addEventListener("submit", handleLogin);
  els.cliente.addEventListener("change", fillClienteData);
  els.addSection.addEventListener("click", () => addSection("Nueva seccion"));
  els.addVideo.addEventListener("click", addVideo);
  els.generatePrompt.addEventListener("click", generateAiPrompt);
  els.copyPrompt.addEventListener("click", copyPrompt);
  els.pasteSummary.addEventListener("click", pasteSummary);
  els.generateRecommendationsPrompt.addEventListener("click", generateRecommendationsPrompt);
  els.copyRecommendationsPrompt.addEventListener("click", copyRecommendationsPrompt);
  els.pasteRecommendations.addEventListener("click", pasteRecommendations);
  els.previewPdf.addEventListener("click", () => generateReport({ reserveCode: false, download: false }));
  els.downloadPreview.addEventListener("click", handleDownloadPreview);
  els.reportForm.addEventListener("submit", (event) => {
    event.preventDefault();
    generateReport({ reserveCode: true, download: true });
  });
}

init();
