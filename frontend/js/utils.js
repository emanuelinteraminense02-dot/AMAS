/* =====================================================
  AMAS – THEME.JS + UTILS
===================================================== */

// ─── TEMA ─────────────────────────────────────────────
function initTheme() {
  const saved = localStorage.getItem("amas_theme") || "light";
  applyTheme(saved);
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("amas_theme", theme);
  const btn = document.getElementById("btnTheme");
  if (btn) btn.innerHTML = theme === "dark" ? '<i class="bi bi-sun"></i>' : '<i class="bi bi-moon-stars"></i>';
}

function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme") || "light";
  applyTheme(current === "dark" ? "light" : "dark");
}

// ─── TOAST ────────────────────────────────────────────
function showToast(msg, type = "info", duration = 3500) {
  let container = document.getElementById("toastContainer");
  if (!container) {
    container = document.createElement("div");
    container.id = "toastContainer";
    container.className = "toast-container";
    document.body.appendChild(container);
  }
  const icons = { success: "✅", error: "❌", info: "ℹ️" };
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${icons[type]||"ℹ️"}</span><span>${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => { toast.style.animation = "toastIn 0.35s ease reverse"; setTimeout(() => toast.remove(), 300); }, duration);
}

// ─── MÁSCARA CPF ──────────────────────────────────────
function maskCPF(input) {
  let v = input.value.replace(/\D/g, "").slice(0, 11);
  if (v.length > 9) v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, "$1.$2.$3-$4");
  else if (v.length > 6) v = v.replace(/(\d{3})(\d{3})(\d{0,3})/, "$1.$2.$3");
  else if (v.length > 3) v = v.replace(/(\d{3})(\d{0,3})/, "$1.$2");
  input.value = v;
}

function maskTel(input) {
  let v = input.value.replace(/\D/g, "").slice(0, 11);
  if (v.length > 10) v = v.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  else if (v.length > 6) v = v.replace(/(\d{2})(\d{4,5})(\d{0,4})/, "($1) $2-$3");
  else if (v.length > 2) v = v.replace(/(\d{2})(\d{0,5})/, "($1) $2");
  input.value = v;
}

// ─── VALIDAÇÃO CPF ────────────────────────────────────
function validarCPF(cpf) {
  const c = cpf.replace(/\D/g, "");
  if (c.length !== 11 || /^(\d)\1+$/.test(c)) return false;
  let s = 0;
  for (let i = 0; i < 9; i++) s += parseInt(c[i]) * (10 - i);
  let r = (s * 10) % 11;
  if (r === 10 || r === 11) r = 0;
  if (r !== parseInt(c[9])) return false;
  s = 0;
  for (let i = 0; i < 10; i++) s += parseInt(c[i]) * (11 - i);
  r = (s * 10) % 11;
  if (r === 10 || r === 11) r = 0;
  return r === parseInt(c[10]);
}

function validarCNPJ(cnpj) {
  const c = cnpj.replace(/\D/g, "");
  if (c.length !== 14 || /^(\d)\1+$/.test(c)) return false;

  const calc = (base, factors) => {
    let total = 0;
    for (let i = 0; i < factors.length; i++) total += parseInt(base[i], 10) * factors[i];
    const resto = total % 11;
    return resto < 2 ? 0 : 11 - resto;
  };

  const dig1 = calc(c, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const dig2 = calc(c, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return dig1 === parseInt(c[12], 10) && dig2 === parseInt(c[13], 10);
}

// ─── FORMATAÇÃO ───────────────────────────────────────
function formatMoney(v) {
  return parseFloat(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(iso) {
  if (!iso) return "-";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

// ─── NAVEGAÇÃO ATIVA ──────────────────────────────────
function setActiveNav() {
  const path = window.location.pathname.split("/").pop();
  document.querySelectorAll(".site-nav a").forEach(a => {
    a.classList.toggle("active", a.getAttribute("href") === path);
  });
}

// ─── INIT ─────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  setActiveNav();
  const btnTheme = document.getElementById("btnTheme");
  if (btnTheme) btnTheme.addEventListener("click", toggleTheme);
});

// ─── MÁSCARA CNPJ ──────────────────────────────────────
function maskCNPJ(input) {
  let v = input.value.replace(/\D/g,"").slice(0,14);
  if (v.length > 12) v = v.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/,"$1.$2.$3/$4-$5");
  else if (v.length > 8) v = v.replace(/(\d{2})(\d{3})(\d{3})(\d{0,4})/,"$1.$2.$3/$4");
  else if (v.length > 5) v = v.replace(/(\d{2})(\d{3})(\d{0,3})/,"$1.$2.$3");
  else if (v.length > 2) v = v.replace(/(\d{2})(\d{0,3})/,"$1.$2");
  input.value = v;
}

// ─── MÁSCARA MOEDA ─────────────────────────────────────
function maskMoeda(input) {
  let v = input.value.replace(/\D/g,"");
  if (!v) { input.value = ""; return; }
  v = (parseInt(v,10)/100).toFixed(2);
  input.value = "R$ " + v.replace(".",",").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// ─── TEMPO RELATIVO ────────────────────────────────────
function timeDiffShort(iso) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "agora";
  if (diff < 3600) return Math.floor(diff/60) + "min";
  if (diff < 86400) return Math.floor(diff/3600) + "h";
  return new Date(iso).toLocaleDateString("pt-BR");
}
