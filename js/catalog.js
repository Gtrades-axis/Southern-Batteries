import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getFirestore, collection, query, where, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const catalog = document.getElementById("catalog");
const status = document.getElementById("catalogStatus");
let products = [];
let activeFilter = "all";

const money = value => `KSh ${Number(value || 0).toLocaleString("en-KE")}`;
const wa = name => `https://wa.me/254112323825?text=${encodeURIComponent(`Hello Southern Batteries, I am interested in ${name}. Please confirm availability and delivery.`)}`;
const escapeHtml = value => String(value ?? "").replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));

function productCard(p) {
  const name = escapeHtml(p.name);
  const brand = escapeHtml(p.brand || "Southern Batteries");
  const desc = escapeHtml(p.description || "Contact us to confirm compatibility and availability.");
  const cat = escapeHtml(p.category || "other");
  const image = p.imageUrl
    ? `<img src="${escapeHtml(p.imageUrl)}" alt="${name}" loading="lazy" onerror="this.closest('.photo').classList.add('no-image');this.remove();">`
    : `<div class="model-art"><strong>${name}</strong><small>Product photo coming soon</small></div>`;
  const stock = p.stock === false ? `<span class="stock out">Out of stock</span>` : `<span class="stock">Available</span>`;
  return `<article class="card" data-category="${cat}">
    <div class="photo">${image}${stock}</div>
    <div class="body"><div class="brand">${brand}</div><h3>${name}</h3><p class="desc">${desc}</p><div class="price">${money(p.price)}</div><a class="order" target="_blank" rel="noopener" href="${wa(p.name)}">Order / Enquire</a></div>
  </article>`;
}

function render() {
  const filtered = products.filter(p => activeFilter === "all" || p.category === activeFilter);
  catalog.innerHTML = filtered.length ? filtered.map(productCard).join("") : `<div class="empty">No batteries are listed in this category yet.</div>`;
  status.textContent = `${filtered.length} product${filtered.length === 1 ? "" : "s"}`;
}

document.querySelectorAll(".filter").forEach(btn => btn.addEventListener("click", () => {
  document.querySelectorAll(".filter").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  activeFilter = btn.dataset.filter;
  render();
}));

const q = query(collection(db, "products"), where("active", "==", true), orderBy("sortOrder", "asc"));
onSnapshot(q, snap => {
  products = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  render();
}, err => {
  console.error(err);
  status.textContent = "Catalogue temporarily unavailable";
  catalog.innerHTML = `<div class="empty error">We are updating the catalogue. Please contact Southern Batteries on WhatsApp or phone.</div>`;
});
