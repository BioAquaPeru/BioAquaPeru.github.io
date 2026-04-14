const navToggle = document.getElementById("navToggle");
const mainNav = document.getElementById("mainNav");

if (navToggle && mainNav) {
  navToggle.addEventListener("click", () => {
    const isOpen = mainNav.classList.toggle("is-open");
    navToggle.classList.toggle("is-open", isOpen);
    navToggle.setAttribute("aria-expanded", String(isOpen));
    navToggle.setAttribute("aria-label", isOpen ? "Cerrar menu" : "Abrir menu");
  });

  mainNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      if (window.innerWidth < 860) {
        mainNav.classList.remove("is-open");
        navToggle.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
        navToggle.setAttribute("aria-label", "Abrir menu");
      }
    });
  });
}

if (window.AOS) {
  AOS.init({
    once: true,
    duration: 700,
    easing: "ease-out-cubic"
  });
}

if (window.particlesJS) {
  particlesJS("particles-js", {
    particles: {
      number: { value: 58, density: { enable: true, value_area: 860 } },
      color: { value: ["#16f2ff", "#1e7bff", "#7de2ff"] },
      shape: { type: "circle" },
      opacity: { value: 0.28, random: true },
      size: { value: 2.6, random: true },
      line_linked: { enable: true, distance: 120, color: "#1e7bff", opacity: 0.2, width: 1 },
      move: { enable: true, speed: 1.6, direction: "none", out_mode: "out" }
    },
    interactivity: {
      detect_on: "canvas",
      events: {
        onhover: { enable: true, mode: "grab" },
        onclick: { enable: true, mode: "push" },
        resize: true
      },
      modes: {
        grab: { distance: 120, line_linked: { opacity: 0.35 } },
        push: { particles_nb: 3 }
      }
    },
    retina_detect: true
  });
}

const form = document.getElementById("contactForm");
const statusEl = document.getElementById("formStatus");

const FORMSPREE_ENDPOINT = "https://formspree.io/f/xkoknlgw";

function setStatus(message, type = "") {
  if (!statusEl) return;
  statusEl.textContent = message;
  statusEl.classList.remove("ok", "error");
  if (type) {
    statusEl.classList.add(type);
  }
}

if (form) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      setStatus("Completa los campos obligatorios.", "error");
      return;
    }

    const formData = new FormData(form);

    try {
      setStatus("Enviando...");

      const response = await fetch(FORMSPREE_ENDPOINT, {
        method: "POST",
        headers: {
          Accept: "application/json"
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error("No se pudo enviar el formulario");
      }

      setStatus("Mensaje enviado correctamente.", "ok");
      form.reset();
    } catch (error) {
      setStatus("Error al enviar.", "error");
    }
  });
}
