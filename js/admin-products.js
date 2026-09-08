import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, getDoc, getDocs, onSnapshot, serverTimestamp, writeBatch } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-storage.js";
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

// The original Southern Batteries catalogue supplied with the project.
const starter = [
  ["Powerlast","035 Powerlast",6800,"powerlast","https://venjohmotorbatteries.com/wp-content/uploads/2024/09/IMG_6596-scaled.webp"],
  ["Powerlast","045 Powerlast",8000,"powerlast","https://static.wixstatic.com/media/4ee99f_e359ac7f0a6c445386bf424b50ee3fee~mv2.png/v1/fit/w_500%2Ch_500%2Cq_90/file.png"],
  ["Powerlast","NS 70 Powerlast",9500,"powerlast","https://static.wixstatic.com/media/687cd1_9447c949f87e467890efc5169baaccf4~mv2.png/v1/fit/w_912%2Ch_912%2Cq_90/687cd1_9447c949f87e467890efc5169baaccf4~mv2.png"],
  ["Powerlast","N70 Powerlast",12000,"powerlast","https://ke.jumia.is/unsafe/fit-in/700x700/filters:fill(white)/product/08/301796/1.jpg?6376="],
  ["Powerlast","N 90 Powerlast",15000,"powerlast","https://jemspark.co.ke/wp-content/uploads/2025/09/Chloride-Exide-N90-MF.png"],
  ["Sebang AGM","DIN 80 MF Sebang AGM",23000,"agm","https://acquybinhduong.com/uploads/images/6461d494d2e97821596bddd3/ac-quy-sebang-agm-80-l4-12v-80ah-2.png"],
  ["Sebang AGM","DIN 70 MF AGM",21000,"agm","https://acquybinhduong.com/uploads/images/6461d851d2e97821596bdde7/ac-quy-sebang-agm-70-l3-12v-70ah-2.png"],
  ["Sebang AGM","DIN 60 MF Sebang AGM",18500,"agm","https://amagspb.ru/files/products/00-02351825.1024x768.jpg"],
  ["Exide AGM","DIN 070 MF L Exide AGM",23500,"agm","https://static.wixstatic.com/media/687cd1_8bb91f2c7089478ea6e2634b6f2d937b~mv2.png/v1/fill/w_980%2Ch_980%2Cal_c%2Cq_90%2Cusm_0.66_1.00_0.01%2Cenc_avif%2Cquality_auto/687cd1_8bb91f2c7089478ea6e2634b6f2d937b~mv2.png"],
  ["Chloride Exide","NS70 SBL Chloride Exide",8000,"chloride","https://static.wixstatic.com/media/0283bf_c309f4586eb44a6a91fdd1403d85ae06~mv2.png/v1/fit/w_912%2Ch_912%2Cq_90/0283bf_c309f4586eb44a6a91fdd1403d85ae06~mv2.png"],
  ["Chloride Exide","NS 70 SBR Chloride Exide",8000,"chloride","https://static.wixstatic.com/media/0283bf_c309f4586eb44a6a91fdd1403d85ae06~mv2.png/v1/fit/w_912%2Ch_912%2Cq_90/0283bf_c309f4586eb44a6a91fdd1403d85ae06~mv2.png"],
  ["Solar Spark","050 Salar Spark",8000,"solar","https://static.wixstatic.com/media/0283bf_db07b9983a12471582689bf9745771eb~mv2.png/v1/fit/w_912%2Ch_912%2Cq_90/0283bf_db07b9983a12471582689bf9745771eb~mv2.png"],
  ["Solar Powerlast","050 MFL Solar Powerlast",8200,"solar","https://www.carbatt254.co.ke/wp-content/uploads/2024/07/PHOTO-2022-12-19-17-10-55.jpg"],
  ["Powerlast","DIN 55 MF Powerlast",11500,"powerlast","https://www.onestopautogarage.co.ke/wp-content/uploads/2025/05/CHLORIDE-EXIDE-POWERLAST-DIN55.jpg"],
  ["Powerlast","DIN 60 MF Powerlast",12500,"powerlast",""],
  ["Chloride Exide","N70 MFR Chloride Exide",12500,"chloride","https://macire.co.ke/wp-content/uploads/2022/07/Chloride-Exide-Powerlast-N70MFR-Maintenance-Free-Car-Battery-600x600.png"],
  ["Powerlast","DIN 80 Powerlast",15000,"powerlast","https://static.wixstatic.com/media/0283bf_23d88d85002c45859325e470d7513b24~mv2.png/v1/fit/w_912%2Ch_912%2Cq_90/0283bf_23d88d85002c45859325e470d7513b24~mv2.png"],
  ["Powerlast","DIN 88 MF Powerlast",16000,"powerlast","https://d8jbk05ikns31.cloudfront.net/chloride_bat-removebg-preview-1761889503788.png"],
  ["Powerlast","DIN 100 MF Powerlast",20000,"powerlast",""],
  ["Powerlast","100 MF Powerlast",14500,"powerlast",""],
  ["Powerlast","N 150 MFR Powerlast",25000,"powerlast","https://static.wixstatic.com/media/0283bf_031bd66deac141e4939e9c897a889900~mv2.png/v1/fit/w_912%2Ch_912%2Cq_90/0283bf_031bd66deac141e4939e9c897a889900~mv2.png"],
  ["Powerlast","N 220 MFL Powerlast",30000,"powerlast",""],
  ["Solar Spark","O26 Solar Spark",5200,"solar",""]
];

function notify(text, bad = false) {
  message.textContent = text;
  message.className = bad ? "message bad" : "message";
  clearTimeout(notify.timer);
  notify.timer = setTimeout(() => { message.textContent = ""; }, 5000);
}

function slug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function reset() {
  form.reset();
  editingId = null;
  editingImageUrl = "";
  $("saveBtn").textContent = "Add product";
  $("cancelBtn").hidden = true;
  $("formTitle").textContent = "Add product";
  $("sortOrder").value = 100;
  $("stock").checked = true;
  $("active").checked = true;
}

function fill(p) {
  editingId = p.id;
  editingImageUrl = p.imageUrl || "";
  $("name").value = p.name || "";
  $("brand").value = p.brand || "";
  $("price").value = p.price ?? "";
  $("category").value = p.category || "other";
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

async function save(e) {
  e.preventDefault();
  const name = $("name").value.trim();
  const brand = $("brand").value.trim();
  const price = Number($("price").value);
  const file = $("image").files[0];

  if (!name || !brand || !Number.isFinite(price) || price < 0) {
    notify("Name, brand and a valid price are required.", true);
    return;
  }

  if (file && (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024)) {
    notify("Use an image file up to 5 MB.", true);
    return;
  }

  let imageUrl = editingImageUrl;
  try {
    if (file) {
      const id = editingId || crypto.randomUUID();
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const imageRef = ref(storage, `products/${id}/${safeName}`);
      await uploadBytes(imageRef, file, { contentType: file.type });
      imageUrl = await getDownloadURL(imageRef);
    }

    const data = {
      name,
      brand,
      price,
      category: $("category").value,
      description: $("description").value.trim() || "Contact us to confirm compatibility and availability.",
      sortOrder: Number($("sortOrder").value) || 100,
      stock: $("stock").checked,
      active: $("active").checked,
      imageUrl,
      updatedAt: serverTimestamp()
    };

    if (editingId) {
      await updateDoc(doc(db, "products", editingId), data);
      notify("Product updated successfully.");
    } else {
      await addDoc(collection(db, "products"), { ...data, createdAt: serverTimestamp() });
      notify("Product added successfully.");
    }
    reset();
  } catch (err) {
    console.error(err);
    notify(err.message || "Could not save product.", true);
  }
}

async function removeProduct(id) {
  if (!confirm("Delete this product from the catalogue?")) return;
  try {
    await deleteDoc(doc(db, "products", id));
    notify("Product deleted.");
  } catch (err) {
    console.error(err);
    notify(err.message || "Could not delete product.", true);
  }
}

async function toggle(id, value) {
  try {
    await updateDoc(doc(db, "products", id), { active: value, updatedAt: serverTimestamp() });
    notify(value ? "Product published." : "Product hidden.");
  } catch (err) {
    console.error(err);
    notify(err.message || "Could not update publication status.", true);
  }
}

async function seedOriginalCatalogue({force = false} = {}) {
  const existing = await getDocs(collection(db, "products"));
  if (!force && !existing.empty) return false;

  const batch = writeBatch(db);
  starter.forEach(([brand, name, price, category, imageUrl], i) => {
    const id = slug(name);
    batch.set(doc(db, "products", id), {
      brand,
      name,
      price,
      category,
      description: "Contact us to confirm compatibility and availability.",
      sortOrder: i + 1,
      stock: true,
      active: true,
      imageUrl: imageUrl || "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });
  });
  await batch.commit();
  return true;
}

async function importStarter() {
  if (!confirm("Restore the original 23 Southern Batteries catalogue products? Existing records with these exact product IDs will be updated.")) return;
  try {
    await seedOriginalCatalogue({ force: true });
    notify("The original 23-product catalogue is ready. You can now edit or add products.");
  } catch (err) {
    console.error(err);
    notify(err.message || "Could not restore catalogue.", true);
  }
}

function render() {
  const sorted = [...currentProducts].sort((a, b) => Number(a.sortOrder ?? 100) - Number(b.sortOrder ?? 100));
  table.innerHTML = sorted.map(p => `
    <tr>
      <td><strong>${escapeHtml(p.name)}</strong><small>${escapeHtml(p.brand)}</small></td>
      <td>KSh ${Number(p.price || 0).toLocaleString("en-KE")}</td>
      <td>${p.stock === false ? "Out" : "Available"}</td>
      <td>
        <button data-edit="${p.id}">Edit</button>
        <button data-toggle="${p.id}" data-value="${p.active !== false}">${p.active !== false ? "Hide" : "Publish"}</button>
        <button class="danger" data-delete="${p.id}">Delete</button>
      </td>
    </tr>`).join("") || '<tr><td colspan="4">No products yet.</td></tr>';

  table.querySelectorAll("[data-edit]").forEach(b => b.onclick = () => fill(currentProducts.find(p => p.id === b.dataset.edit)));
  table.querySelectorAll("[data-delete]").forEach(b => b.onclick = () => removeProduct(b.dataset.delete));
  table.querySelectorAll("[data-toggle]").forEach(b => b.onclick = () => toggle(b.dataset.toggle, b.dataset.value !== "true"));
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", "'":"&#39;", '"':"&quot;" }[c]));
}

async function startAdmin(user) {
  try {
    const adminDoc = await getDoc(doc(db, "admins", user.uid));
    if (!adminDoc.exists()) {
      await signOut(auth);
      login.hidden = false;
      admin.hidden = true;
      notify("This account is not authorized as a Southern Batteries admin.", true);
      return;
    }

    login.hidden = true;
    admin.hidden = false;

    // The original 23-product catalogue is created automatically only when the
    // products collection is empty. Existing edits are never overwritten on login.
    const seeded = await seedOriginalCatalogue();
    if (seeded) notify("Original 23-product catalogue loaded. You can now edit or add products.");

    onSnapshot(collection(db, "products"), snap => {
      currentProducts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      render();
    }, err => {
      console.error(err);
      notify(err.message || "Could not load catalogue.", true);
    });
  } catch (err) {
    console.error(err);
    await signOut(auth);
    login.hidden = false;
    admin.hidden = true;
    notify(err.message || "Could not verify administrator access.", true);
  }
}

onAuthStateChanged(auth, user => {
  if (user) startAdmin(user);
  else {
    login.hidden = false;
    admin.hidden = true;
  }
});

$("loginForm").onsubmit = async e => {
  e.preventDefault();
  try {
    await signInWithEmailAndPassword(auth, $("email").value.trim(), $("password").value);
  } catch (err) {
    console.error(err);
    const messages = {
      "auth/invalid-credential": "Incorrect email or password.",
      "auth/invalid-login-credentials": "Incorrect email or password.",
      "auth/user-not-found": "No Firebase Authentication account exists for this email.",
      "auth/wrong-password": "Incorrect password.",
      "auth/too-many-requests": "Too many attempts. Please wait and try again.",
      "auth/unauthorized-domain": "This website domain is not authorized in Firebase Authentication."
    };
    notify(messages[err.code] || `Login failed: ${err.code || err.message}`, true);
  }
};

$("logout").onclick = () => signOut(auth);
$("importStarter").onclick = importStarter;
form.onsubmit = save;
$("cancelBtn").onclick = reset;
