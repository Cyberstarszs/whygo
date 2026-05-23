// assets/js/editor.js

document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("twibbonCanvas");
  const ctx = canvas.getContext("2d");

  const photoInput = document.getElementById("photoInput");
  const templateInput = document.getElementById("templateInput");
  const photoInfo = document.getElementById("photoInfo");
  const templateInfo = document.getElementById("templateInfo");

  const zoomSlider = document.getElementById("zoomSlider");
  const rotateSlider = document.getElementById("rotateSlider");
  const zoomValue = document.getElementById("zoomValue");
  const rotateValue = document.getElementById("rotateValue");

  const resetBtn = document.getElementById("resetTransform");
  const fitBtn = document.getElementById("fitToFrame");
  const centerBtn = document.getElementById("centerPhoto");
  const flipBtn = document.getElementById("flipHorizontal");

  const downloadBtn = document.getElementById("downloadBtn");
  const downloadFormat = document.getElementById("downloadFormat");

  const templateThumbs = document.querySelectorAll(".template-thumb");

  // Filter controls
  const brightnessSlider = document.getElementById("brightnessSlider");
  const contrastSlider = document.getElementById("contrastSlider");
  const saturateSlider = document.getElementById("saturateSlider");
  const grayscaleSlider = document.getElementById("grayscaleSlider");

  const brightnessValue = document.getElementById("brightnessValue");
  const contrastValue = document.getElementById("contrastValue");
  const saturateValue = document.getElementById("saturateValue");
  const grayscaleValue = document.getElementById("grayscaleValue");

  const presetButtons = document.querySelectorAll(".filter-preset");

  // State utama
  const state = {
    photoImage: null,
    templateImage: null,
    photoScale: 1,
    photoRotation: 0, // degrees
    offsetX: 0,
    offsetY: 0,
    flipX: 1,
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0,
    initialOffsetX: 0,
    initialOffsetY: 0,
    filters: {
      brightness: 1,
      contrast: 1,
      saturation: 1,
      grayscale: 0,
    },
    activePreset: "original",
  };

  // Map template default
  const templateMap = {
    1: "assets/img/twibbon-1.png",
    2: "assets/img/twibbon-2.png",
    3: "assets/img/twibbon-3.png",
  };

  // Helper load image
  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = (err) => reject(err);
      img.src = src;
    });
  }

  // Template dari URL
  async function initTemplateFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const templateId = params.get("template");
    const chosenId = templateId && templateMap[templateId] ? templateId : "1";

    try {
      const img = await loadImage(templateMap[chosenId]);
      state.templateImage = img;
      updateTemplateInfo(`Menggunakan template default #${chosenId}.`);
      markActiveTemplateThumb(chosenId);
      redraw();
    } catch (err) {
      console.warn("Gagal memuat template default:", err);
      updateTemplateInfo("Gagal memuat template default. Coba upload template sendiri.");
    }
  }

  function updateTemplateInfo(text) {
    if (templateInfo) templateInfo.textContent = text;
  }

  function updatePhotoInfo(text) {
    if (photoInfo) photoInfo.textContent = text;
  }

  function markActiveTemplateThumb(id) {
    templateThumbs.forEach((btn) => {
      if (id && btn.dataset.template === String(id)) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });
  }

  // Gabung filter jadi string CSS filter
  function buildFilterString() {
    const f = state.filters;
    return [
      `brightness(${f.brightness})`,
      `contrast(${f.contrast})`,
      `saturate(${f.saturation})`,
      `grayscale(${f.grayscale})`,
    ].join(" ");
  }

  function updateFilterLabelsFromState() {
    if (brightnessSlider && brightnessValue) {
      brightnessSlider.value = String(state.filters.brightness);
      brightnessValue.textContent = Math.round(state.filters.brightness * 100) + "%";
    }
    if (contrastSlider && contrastValue) {
      contrastSlider.value = String(state.filters.contrast);
      contrastValue.textContent = Math.round(state.filters.contrast * 100) + "%";
    }
    if (saturateSlider && saturateValue) {
      saturateSlider.value = String(state.filters.saturation);
      saturateValue.textContent = Math.round(state.filters.saturation * 100) + "%";
    }
    if (grayscaleSlider && grayscaleValue) {
      grayscaleSlider.value = String(state.filters.grayscale);
      grayscaleValue.textContent = Math.round(state.filters.grayscale * 100) + "%";
    }
  }

  function setActivePresetButton(name) {
    presetButtons.forEach((btn) => {
      if (btn.dataset.preset === name) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });
  }

  function applyPreset(name) {
    switch (name) {
      case "soft":
        state.filters.brightness = 1.05;
        state.filters.contrast = 0.95;
        state.filters.saturation = 1.15;
        state.filters.grayscale = 0.1;
        break;
      case "vibrant":
        state.filters.brightness = 1.05;
        state.filters.contrast = 1.2;
        state.filters.saturation = 1.4;
        state.filters.grayscale = 0;
        break;
      case "mono":
        state.filters.brightness = 1.0;
        state.filters.contrast = 1.05;
        state.filters.saturation = 0;
        state.filters.grayscale = 1;
        break;
      default:
        // original
        state.filters.brightness = 1;
        state.filters.contrast = 1;
        state.filters.saturation = 1;
        state.filters.grayscale = 0;
        break;
    }
    state.activePreset = name;
    updateFilterLabelsFromState();
    setActivePresetButton(name);
    redraw();
  }

  // Gambar ulang canvas
  function redraw() {
    if (!ctx || !canvas) return;
    const { width, height } = canvas;

    ctx.clearRect(0, 0, width, height);

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#050509");
    gradient.addColorStop(1, "#151522");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Foto (dengan filter)
    if (state.photoImage) {
      const img = state.photoImage;
      const centerX = width / 2 + state.offsetX;
      const centerY = height / 2 + state.offsetY;

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate((state.photoRotation * Math.PI) / 180);
      ctx.scale(state.flipX, 1);

      const scaledW = img.width * state.photoScale;
      const scaledH = img.height * state.photoScale;

      ctx.filter = buildFilterString();
      ctx.drawImage(img, -scaledW / 2, -scaledH / 2, scaledW, scaledH);
      ctx.restore();
      ctx.filter = "none";
    }

    // Template overlay di atas foto (tanpa filter)
    if (state.templateImage) {
      const tImg = state.templateImage;
      const scale = Math.max(
        canvas.width / tImg.width,
        canvas.height / tImg.height
      );
      const tplWidth = tImg.width * scale;
      const tplHeight = tImg.height * scale;
      const tplX = (canvas.width - tplWidth) / 2;
      const tplY = (canvas.height - tplHeight) / 2;

      ctx.drawImage(tImg, tplX, tplY, tplWidth, tplHeight);
    }
  }

  // Reset transform
  function resetTransform() {
    state.photoScale = 1;
    state.photoRotation = 0;
    state.offsetX = 0;
    state.offsetY = 0;
    state.flipX = 1;

    if (zoomSlider) zoomSlider.value = "1";
    if (rotateSlider) rotateSlider.value = "0";
    if (zoomValue) zoomValue.textContent = "100%";
    if (rotateValue) rotateValue.textContent = "0°";

    redraw();
  }

  // Fit foto ke frame
  function fitPhotoToFrame() {
    if (!state.photoImage || !canvas) return;
    const img = state.photoImage;

    const scale = Math.max(
      canvas.width / img.width,
      canvas.height / img.height
    );

    state.photoScale = scale;
    state.offsetX = 0;
    state.offsetY = 0;

    if (zoomSlider) {
      zoomSlider.value = String(scale);
      zoomValue.textContent = Math.round(scale * 100) + "%";
    }

    redraw();
  }

  // Pusatkan foto
  function centerPhoto() {
    state.offsetX = 0;
    state.offsetY = 0;
    redraw();
  }

  // Flip horizontal
  function flipHorizontal() {
    state.flipX *= -1;
    redraw();
  }

  // Upload foto
  if (photoInput) {
    photoInput.addEventListener("change", (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (ev) => {
        try {
          const img = await loadImage(ev.target.result);
          state.photoImage = img;
          resetTransform();
          // Auto fit sedikit lebih nyaman untuk resolusi tinggi
          fitPhotoToFrame();
          updatePhotoInfo(`Foto terpasang: ${file.name}`);
        } catch (err) {
          console.error("Gagal memuat foto:", err);
          updatePhotoInfo("Gagal memuat foto. Coba file lain.");
        }
        redraw();
      };
      reader.readAsDataURL(file);
    });
  }

  // Upload template custom
  if (templateInput) {
    templateInput.addEventListener("change", (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (ev) => {
        try {
          const img = await loadImage(ev.target.result);
          state.templateImage = img;
          updateTemplateInfo(`Template kustom terpasang: ${file.name}`);
          markActiveTemplateThumb(null);
          redraw();
        } catch (err) {
          console.error("Gagal memuat template:", err);
          updateTemplateInfo("Gagal memuat template. Coba file lain.");
        }
      };
      reader.readAsDataURL(file);
    });
  }

  // Template default
  if (templateThumbs.length > 0) {
    templateThumbs.forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.template;
        if (!id || !templateMap[id]) return;

        try {
          const img = await loadImage(templateMap[id]);
          state.templateImage = img;
          updateTemplateInfo(`Menggunakan template default #${id}.`);
          markActiveTemplateThumb(id);
          redraw();
        } catch (err) {
          console.error("Gagal memuat template default:", err);
          updateTemplateInfo("Gagal memuat template default.");
        }
      });
    });
  }

  // Zoom slider
  if (zoomSlider && zoomValue) {
    zoomSlider.addEventListener("input", () => {
      const value = parseFloat(zoomSlider.value);
      state.photoScale = value;
      zoomValue.textContent = Math.round(value * 100) + "%";
      redraw();
    });
  }

  // Rotate slider
  if (rotateSlider && rotateValue) {
    rotateSlider.addEventListener("input", () => {
      const deg = parseFloat(rotateSlider.value);
      state.photoRotation = deg;
      rotateValue.textContent = deg + "°";
      redraw();
    });
  }

  // Reset, fit, center, flip buttons
  if (resetBtn) {
    resetBtn.addEventListener("click", resetTransform);
  }
  if (fitBtn) {
    fitBtn.addEventListener("click", fitPhotoToFrame);
  }
  if (centerBtn) {
    centerBtn.addEventListener("click", centerPhoto);
  }
  if (flipBtn) {
    flipBtn.addEventListener("click", flipHorizontal);
  }

  // Filter sliders
  if (brightnessSlider && brightnessValue) {
    brightnessSlider.addEventListener("input", () => {
      state.filters.brightness = parseFloat(brightnessSlider.value);
      brightnessValue.textContent =
        Math.round(state.filters.brightness * 100) + "%";
      state.activePreset = "custom";
      setActivePresetButton(null);
      redraw();
    });
  }

  if (contrastSlider && contrastValue) {
    contrastSlider.addEventListener("input", () => {
      state.filters.contrast = parseFloat(contrastSlider.value);
      contrastValue.textContent =
        Math.round(state.filters.contrast * 100) + "%";
      state.activePreset = "custom";
      setActivePresetButton(null);
      redraw();
    });
  }

  if (saturateSlider && saturateValue) {
    saturateSlider.addEventListener("input", () => {
      state.filters.saturation = parseFloat(saturateSlider.value);
      saturateValue.textContent =
        Math.round(state.filters.saturation * 100) + "%";
      state.activePreset = "custom";
      setActivePresetButton(null);
      redraw();
    });
  }

  if (grayscaleSlider && grayscaleValue) {
    grayscaleSlider.addEventListener("input", () => {
      state.filters.grayscale = parseFloat(grayscaleSlider.value);
      grayscaleValue.textContent =
        Math.round(state.filters.grayscale * 100) + "%";
      state.activePreset = "custom";
      setActivePresetButton(null);
      redraw();
    });
  }

  // Preset buttons
  if (presetButtons.length > 0) {
    presetButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const name = btn.dataset.preset || "original";
        applyPreset(name);
      });
    });
  }

  // Drag mouse
  if (canvas) {
    canvas.addEventListener("mousedown", (e) => {
      if (!state.photoImage) return;
      state.isDragging = true;
      state.dragStartX = e.clientX;
      state.dragStartY = e.clientY;
      state.initialOffsetX = state.offsetX;
      state.initialOffsetY = state.offsetY;
    });

    window.addEventListener("mousemove", (e) => {
      if (!state.isDragging) return;
      const deltaX = e.clientX - state.dragStartX;
      const deltaY = e.clientY - state.dragStartY;
      state.offsetX = state.initialOffsetX + deltaX;
      state.offsetY = state.initialOffsetY + deltaY;
      redraw();
    });

    window.addEventListener("mouseup", () => {
      state.isDragging = false;
    });

    // Drag touch
    canvas.addEventListener(
      "touchstart",
      (e) => {
        if (!state.photoImage) return;
        const touch = e.touches[0];
        if (!touch) return;
        state.isDragging = true;
        state.dragStartX = touch.clientX;
        state.dragStartY = touch.clientY;
        state.initialOffsetX = state.offsetX;
        state.initialOffsetY = state.offsetY;
      },
      { passive: true }
    );

    window.addEventListener(
      "touchmove",
      (e) => {
        if (!state.isDragging) return;
        const touch = e.touches[0];
        if (!touch) return;
        const deltaX = touch.clientX - state.dragStartX;
        const deltaY = touch.clientY - state.dragStartY;
        state.offsetX = state.initialOffsetX + deltaX;
        state.offsetY = state.initialOffsetY + deltaY;
        redraw();
      },
      { passive: true }
    );

    window.addEventListener("touchend", () => {
      state.isDragging = false;
    });
  }

  // Download HD
  if (downloadBtn && downloadFormat) {
    downloadBtn.addEventListener("click", () => {
      if (!state.photoImage || !state.templateImage) {
        alert("Pastikan foto dan template sudah terpasang sebelum download.");
        return;
      }

      const format = downloadFormat.value === "jpeg" ? "jpeg" : "png";
      let dataUrl;

      if (format === "png") {
        dataUrl = canvas.toDataURL("image/png"); // lossless
      } else {
        dataUrl = canvas.toDataURL("image/jpeg", 0.95);
      }

      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `twibbon-hd-${Date.now()}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  }

  // Init
  updateFilterLabelsFromState();
  initTemplateFromUrl().finally(() => {
    redraw();
  });
});
