// assets/js/main.js

document.addEventListener("DOMContentLoaded", () => {
  // Set current year in footer
  const yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear().toString();
  }

  // Mobile navigation toggle
  const navToggle = document.getElementById("navToggle");
  const navMobile = document.getElementById("navMobile");

  if (navToggle && navMobile) {
    navToggle.addEventListener("click", () => {
      const isOpen = navMobile.style.display === "flex";
      navMobile.style.display = isOpen ? "none" : "flex";
    });

    // Close mobile nav when clicking link
    navMobile.addEventListener("click", (e) => {
      if (e.target.tagName === "A") {
        navMobile.style.display = "none";
      }
    });
  }
});
