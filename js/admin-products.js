import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-storage.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

const $ = id => document.getElementById(id);
const form = $("productForm");
const table = $("productsTable");
const login = $("loginPanel");
const admin = $("adminPanel");
const message = $("message");

let editingId = null;
let editingImageUrl = "";
let currentProducts = [];
let unsubscribeProducts = null;

const starter = [
  ["Powerlast","035 Powerlast",6800,"powerlast"],
  ["Powerlast","045 Powerlast",8000,"powerlast"],
  ["Powerlast","NS 70 Powerlast",9500,"powerlast"],
  ["Powerlast","N70 Powerlast",12000,"powerlast"],
  ["Powerlast","N 90 Powerlast",15000,"powerlast"],
  ["Sebang AGM","DIN 80 MF Sebang AGM",23000,"agm"],
  ["AGM","DIN 70 MF AGM",21000,"agm"],
  ["Sebang AGM","DIN 60 MF Sebang AGM",18500,"agm"],
  ["Exide AGM","DIN 070 MF L Exide AGM",23500,"agm"],
  ["Chloride Exide","NS70 SBL Chloride Exide",8000,"chloride"],
  ["Chloride Exide","NS 70 SBR Chloride Exide",8000,"chloride"],
  ["Solar Spark","050 Salar Spark",8000,"solar"],
  ["Solar Powerlast","050 MFL Solar Powerlast",8200,"solar"],
  ["Powerlast","DIN 55 MF Powerlast",11500,"powerlast"],
  ["Powerlast","DIN 60 MF Powerlast",12500,"powerlast"],
  ["Chloride Exide","N70 MFR Chloride Exide",12500,"chloride"],
  ["Powerlast","DIN 80 Powerlast",15000,"powerlast"],
  ["Powerlast","DIN 88 MF Powerlast",16000,"powerlast"],
  ["Powerlast","DIN 100 MF Powerlast",20000,"powerlast"],
  ["Powerlast","100 MF Powerlast",14500,"powerlast"],
  ["Powerlast","N 150 MFR Powerlast",25000,"powerlast"],
  ["Powerlast","N 220 MFL Powerlast",30000,"powerlast"],
  ["Solar Spark","O26 Solar Spark",5200,"solar"]
];

const esc = value => String(value ?? "").replace(/[&<>'"]/g, c => ({
  "&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"
}[c]));

function notify(text, bad = false) {
  message.textContent = text;
  message.className = bad ? "message bad" : "message";
  window.clearTimeout(notify.timer);
  notify.timer = window.setTimeout(() => {
    message.textContent = "";
    message.className = "message";
  }, 5000);
}

function reset() {
  form.reset();
  editingId = null;
  editingImageUrl = "";
  $("saveBtn").textContent = "Add product";
  $("cancelBtn").hidden = true;
  $("formTitle").textContent = "Add product";
  $("stock").checked = true;
  $("active").checked = true;
  $("sortOrder").value = 100;
}

function fill(p) {
  editingId = p.id;
  editingImageUrl = p.imageUrl || "";
  $("name").value = p.name || "";
  $("brand").value = p.brand || "";
  $("price").value = p.price ?? "";
  $("category").value = p.category || "powerlast";
  $("description").value = p.description || "";
  $("sortOrder").value = p.sortOrder ?? 100;
  $("stock").checked = p.stock !== false;
  $("active").checked = p.active !== false;
  $("image").value = "";
  $("saveBtn").textContent = "Save changes";
  $("cancelBtn").hidden = false;
  $("formTitle").textContent = "Edit product";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function validImage(file) {
  return file && /^(image\/jpeg|image\/png|image\/webp)$/.test(file.type);
}

async function save(e) {
  e.preventDefault();

  const name = $("name").value.trim();
  const brand = $("brand").value.trim();
  const price = Number($("price").value);
  const file = $("image").files[0];

  if (!name || !brand || !Number.isFinite(price) || price < 0) {
    return notify("Enter a valid name, brand and price.", true);
  }

  if (file && (!validImage(file) || file.size > 5 * 1024 * 1024)) {
    return notify("Photo must be JPG, PNG or WebP and under 5 MB.", true);
  }

  try {
    let imageUrl = editingImageUrl;
    const productId = editingId || crypto.randomUUID();

    if (file) {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const imageRef = ref(storage, `products/${productId}/${safeName}`);
      await uploadBytes(imageRef, file, { contentType: file.type });
      imageUrl = await getDownloadURL(imageRef);
    }

    const data = {
      name,
      brand,
      price,
      category: $("category").value,
      description: $("description").value.trim(),
      sortOrder: Number($("sortOrder").value) || 100,
      stock: $("stock").checked,
      active: $("active").checked,
      imageUrl,
      updatedAt: serverTimestamp()
    };

    if (editingId) {
      await updateDoc(doc(db, "products", editingId), data);
      notify("Product updated.");
    } else {
      await addDoc(collection(db, "products"), {
        ...data,
        createdAt: serverTimestamp()
      });
      notify("Product added.");
    }

    reset();
  } catch (err) {
    console.error("Save product failed:", err);
    notify(err?.message || "Could not save product.", true);
  }
}

async function removeProduct(id) {
  if (!confirm("Delete this product from the catalogue?")) return;
  try {
    await deleteDoc(doc(db, "products", id));
    notify("Product deleted.");
  } catch (e) {
    console.error(e);
    notify(e?.message || "Could not delete product.", true);
  }
}

async function toggle(id, value) {
  try {
    await updateDoc(doc(db, "products", id), {
      active: value,
      updatedAt: serverTimestamp()
    });
    notify(value ? "Product published." : "Product hidden.");
  } catch (e) {
    console.error(e);
    notify(e?.message || "Could not update publication status.", true);
  }
}

async function importStarter() {
  if (!confirm("Create/update the 23 Southern Batteries starter products?")) return;

  try {
    const batch = writeBatch(db);

    starter.forEach(([brand, name, price, category], i) => {
      const id = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      batch.set(
        doc(db, "products", id),
        {
          brand,
          name,
          price,
          category,
          description: "Contact us to confirm compatibility and availability.",
          sortOrder: i + 1,
          stock: true,
          active: true,
          imageUrl: "",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        },
        { merge: true }
      );
    });

    await batch.commit();
    notify("23 catalogue products are ready in Firebase.");
  } catch (e) {
    console.error("Starter import failed:", e);
    notify(e?.message || "Could not import starter products.", true);
  }
}

function render() {
  const sorted = [...currentProducts].sort(
    (a, b) => Number(a.sortOrder ?? 100) - Number(b.sortOrder ?? 100)
  );

  table.innerHTML = sorted.length
    ? sorted.map(p => `
      <tr>
        <td><strong>${esc(p.name)}</strong><small>${esc(p.brand)}</small></td>
        <td>KSh ${Number(p.price || 0).toLocaleString("en-KE")}</td>
        <td>${p.stock === false ? "Out" : "Available"}</td>
        <td>
          <button data-edit="${esc(p.id)}">Edit</button>
          <button data-toggle="${esc(p.id)}" data-value="${p.active !== false}">
            ${p.active !== false ? "Hide" : "Publish"}
          </button>
          <button class="danger" data-delete="${esc(p.id)}">Delete</button>
        </td>
      </tr>
    `).join("")
    : '<tr><td colspan="4">No products yet.</td></tr>';

  table.querySelectorAll("[data-edit]").forEach(button => {
    button.onclick = () => {
      const product = currentProducts.find(p => p.id === button.dataset.edit);
      if (product) fill(product);
    };
  });

  table.querySelectorAll("[data-delete]").forEach(button => {
    button.onclick = () => removeProduct(button.dataset.delete);
  });

  table.querySelectorAll("[data-toggle]").forEach(button => {
    button.onclick = () =>
      toggle(button.dataset.toggle, button.dataset.value !== "true");
  });
}

async function startAdminSession(user) {
  try {
    const adminDoc = await getDoc(doc(db, "admins", user.uid));

    if (!adminDoc.exists()) {
      await signOut(auth);
      login.hidden = false;
      admin.hidden = true;
      notify("This account is not authorized as an administrator.", true);
      return;
    }

    login.hidden = true;
    admin.hidden = false;

    if (unsubscribeProducts) unsubscribeProducts();

    const q = query(collection(db, "products"));
    unsubscribeProducts = onSnapshot(
      q,
      snap => {
        currentProducts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        render();
      },
      e => {
        console.error("Admin products listener failed:", e);
        notify(e?.message || "Could not load products.", true);
      }
    );
  } catch (e) {
    console.error("Admin verification failed:", e);
    await signOut(auth);
    notify("Could not verify administrator access.", true);
  }
}

onAuthStateChanged(auth, user => {
  if (user) {
    startAdminSession(user);
  } else {
    if (unsubscribeProducts) {
      unsubscribeProducts();
      unsubscribeProducts = null;
    }
    login.hidden = false;
    admin.hidden = true;
  }
});

$("loginForm").onsubmit = async e => {
  e.preventDefault();
  try {
    await signInWithEmailAndPassword(
      auth,
      $("email").value.trim(),
      $("password").value
    );
  } catch (err) {
    console.error("Login failed:", err);
    notify("Login failed. Check your admin email and password.", true);
  }
};

$("logout").onclick = () => signOut(auth);
$("importStarter").onclick = importStarter;
form.onsubmit = save;
$("cancelBtn").onclick = reset;
