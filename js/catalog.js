import { app } from "./firebase-config.js";
import { getFirestore, collection, query, where, orderBy, onSnapshot }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const db = getFirestore(app);
const grid = document.getElementById("productGrid");
const status = document.getElementById("catalogStatus");
const search = document.getElementById("search");
const category = document.getElementById("category");

let products = [];

const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({
  "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
}[c]));

function whatsapp(product) {
  const text = `Hello Southern Batteries, I am interested in ${product.name}.`;
  return `https://wa.me/254112323825?text=${encodeURIComponent(text)}`;
}

function render() {
  const term = search.value.trim().toLowerCase();
  const cat = category.value;

  const list = products.filter(p => {
    const matchesCat = cat === "all" || p.category === cat;
    const matchesSearch = !term ||
      `${p.name} ${p.brand || ""} ${p.description || ""}`.toLowerCase().includes(term);
    return matchesCat && matchesSearch;
  });

  status.textContent = list.length
    ? `${list.length} battery${list.length === 1 ? "" : "ies"} available`
    : "No batteries match your search.";

  grid.innerHTML = list.map(p => {
    const photo = p.imageUrl
      ? `<div class="product-photo"><img src="${esc(p.imageUrl)}" alt="${esc(p.name)}" loading="lazy"></div>`
      : `<div class="product-photo"><div class="product-placeholder">Product photo coming soon</div></div>`;

    return `<div class="card">
      ${photo}
      <div class="brand">${esc(p.brand || "Southern Batteries")}</div>
      <h3>${esc(p.name)}</h3>
      <div class="price">KSh ${Number(p.price || 0).toLocaleString("en-KE")}</div>
      <div style="font-size:13px;color:#6b7280">${p.inStock ? "In stock" : "Check availability"}</div>
      <a href="${whatsapp(p)}" target="_blank" rel="noopener">Order / Enquire</a>
    </div>`;
  }).join("");
}

search.addEventListener("input", render);
category.addEventListener("change", render);

const productsQuery = query(
  collection(db, "products"),
  where("active", "==", true),
  orderBy("sortOrder", "asc")
);

onSnapshot(productsQuery, snapshot => {
  products = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  render();
}, error => {
  console.error("Catalogue failed:", error);
  status.textContent = "Catalogue is temporarily unavailable. Please contact us by phone or WhatsApp.";
});
