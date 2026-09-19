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
  setDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  writeBatch
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

import { firebaseConfig } from "./firebase-config.js";


// =============================================================
// INITIALIZE FIREBASE
// =============================================================

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);


// =============================================================
// CLOUDFLARE R2 WORKER
// Product images are stored in Cloudflare R2.
// =============================================================

const R2_WORKER_URL =
  "https://adminstorage.davidthuku574.workers.dev";


// =============================================================
// DOM
// =============================================================

const $ = id => document.getElementById(id);

const form = $("productForm");
const table = $("productsTable");
const login = $("loginPanel");
const admin = $("adminPanel");
const message = $("message");


// =============================================================
// STATE
// =============================================================

let editingId = null;
let editingImageUrl = "";
let currentProducts = [];
let productsUnsubscribe = null;


// =============================================================
// ORIGINAL 23 SOUTHERN BATTERIES PRODUCTS
// =============================================================

const starter = [
  ["Powerlast", "035 Powerlast", 6800, "powerlast"],
  ["Powerlast", "045 Powerlast", 8000, "powerlast"],
  ["Powerlast", "NS 70 Powerlast", 9500, "powerlast"],
  ["Powerlast", "N70 Powerlast", 12000, "powerlast"],
  ["Powerlast", "N 90 Powerlast", 15000, "powerlast"],

  ["Sebang AGM", "DIN 80 MF Sebang AGM", 23000, "agm"],
  ["AGM", "DIN 70 MF AGM", 21000, "agm"],
  ["Sebang AGM", "DIN 60 MF Sebang AGM", 18500, "agm"],
  ["Exide AGM", "DIN 070 MF L Exide AGM", 23500, "agm"],

  ["Chloride Exide", "NS70 SBL Chloride Exide", 8000, "chloride"],
  ["Chloride Exide", "NS 70 SBR Chloride Exide", 8000, "chloride"],

  ["Solar Spark", "050 Salar Spark", 8000, "solar"],
  ["Solar Powerlast", "050 MFL Solar Powerlast", 8200, "solar"],

  ["Powerlast", "DIN 55 MF Powerlast", 11500, "powerlast"],
  ["Powerlast", "DIN 60 MF Powerlast", 12500, "powerlast"],

  ["Chloride Exide", "N70 MFR Chloride Exide", 12500, "chloride"],

  ["Powerlast", "DIN 80 Powerlast", 15000, "powerlast"],
  ["Powerlast", "DIN 88 MF Powerlast", 16000, "powerlast"],
  ["Powerlast", "DIN 100 MF Powerlast", 20000, "powerlast"],
  ["Powerlast", "100 MF Powerlast", 14500, "powerlast"],
  ["Powerlast", "N 150 MFR Powerlast", 25000, "powerlast"],
  ["Powerlast", "N 220 MFL Powerlast", 30000, "powerlast"],

  ["Solar Spark", "O26 Solar Spark", 5200, "solar"]
];


// =============================================================
// VERIFIED ONLINE PRODUCT IMAGES
// =============================================================

const verifiedImages = {

  "075-solar-chloride-exide":
    "https://static.wixstatic.com/media/0283bf_78c2cf28702c410a81f3f65358607678~mv2.png/v1/fit/w_912%2Ch_912%2Cq_90/0283bf_78c2cf28702c410a81f3f65358607678~mv2.png",

  "100-solar-chloride-exide":
    "https://static.wixstatic.com/media/0283bf_78c2cf28702c410a81f3f65358607678~mv2.png/v1/fit/w_912%2Ch_912%2Cq_90/0283bf_78c2cf28702c410a81f3f65358607678~mv2.png",

  "100-mf-solar-spark":
    "https://static.wixstatic.com/media/0283bf_04e4df3633264f029206983e254ae872~mv2.png/v1/fit/w_912%2Ch_912%2Cq_90/0283bf_04e4df3633264f029206983e254ae872~mv2.png",

  "075-mf-solar-spark":
    "https://static.wixstatic.com/media/0283bf_db07b9983a12471582689bf9745771eb~mv2.png/v1/fit/w_912%2Ch_912%2Cq_90/0283bf_db07b9983a12471582689bf9745771eb~mv2.png",

  "050-mf-solar-spark":
    "https://static.wixstatic.com/media/0283bf_db07b9983a12471582689bf9745771eb~mv2.png/v1/fit/w_912%2Ch_912%2Cq_90/0283bf_db07b9983a12471582689bf9745771eb~mv2.png",

  "100-ah-12v-ritar-power":
    "https://www.tdk.co.ke/wp-content/uploads/2022/07/ritar-dc12-100c-12v-100ah-agm-vrla-battery_480x480-100x100.jpg",

  "solar-200ah-12v-eastman":
    "https://static.wixstatic.com/media/0283bf_9a54a41fcf5e45ad905f6a18807a1a4a~mv2.png/v1/fit/w_912%2Ch_912%2Cq_90/0283bf_9a54a41fcf5e45ad905f6a18807a1a4a~mv2.png",

  "100-watts-solar-panel-mono":
    "https://static.wixstatic.com/media/0283bf_069c063f36c34507aae0c462ae272bb0~mv2.jpg/v1/fit/w_912%2Ch_912%2Cq_90/0283bf_069c063f36c34507aae0c462ae272bb0~mv2.jpg",

  "200-watts-solar-panel-mono":
    "https://static.wixstatic.com/media/0283bf_069c063f36c34507aae0c462ae272bb0~mv2.jpg/v1/fit/w_912%2Ch_912%2Cq_90/0283bf_069c063f36c34507aae0c462ae272bb0~mv2.jpg",

  "300-watts-solar-panel-mono":
    "https://static.wixstatic.com/media/0283bf_069c063f36c34507aae0c462ae272bb0~mv2.jpg/v1/fit/w_912%2Ch_912%2Cq_90/0283bf_069c063f36c34507aae0c462ae272bb0~mv2.jpg",

  "620-watts-solar-panel-mono":
    "https://static.wixstatic.com/media/0283bf_069c063f36c34507aae0c462ae272bb0~mv2.jpg/v1/fit/w_912%2Ch_912%2Cq_90/0283bf_069c063f36c34507aae0c462ae272bb0~mv2.jpg",

  "n50-mfl-chloride-exide":
    "https://static.wixstatic.com/media/0283bf_e4e24ab7d747416f92db7a84dd21c307~mv2.png/v1/fit/w_912%2Ch_912%2Cq_90/0283bf_e4e24ab7d747416f92db7a84dd21c307~mv2.png",

  "n70-mfl-spark":
    "https://static.wixstatic.com/media/0283bf_04e4df3633264f029206983e254ae872~mv2.png/v1/fit/w_912%2Ch_912%2Cq_90/0283bf_04e4df3633264f029206983e254ae872~mv2.png",

  "ns70-mfl-spark":
    "https://static.wixstatic.com/media/0283bf_04e4df3633264f029206983e254ae872~mv2.png/v1/fit/w_912%2Ch_912%2Cq_90/0283bf_04e4df3633264f029206983e254ae872~mv2.png",

  "n70-mfl-supreme":
    "https://static.wixstatic.com/media/0283bf_0d052a1c75e3410e85e6ec333272750f~mv2.png/v1/fit/w_912%2Ch_912%2Cq_90/0283bf_0d052a1c75e3410e85e6ec333272750f~mv2.png",

  "045l-mf-exide-matrix":
    "https://static.wixstatic.com/media/0283bf_0d052a1c75e3410e85e6ec333272750f~mv2.png/v1/fit/w_912%2Ch_912%2Cq_90/0283bf_0d052a1c75e3410e85e6ec333272750f~mv2.png",

  "n70mfr-exide-matrix":
    "https://static.wixstatic.com/media/0283bf_0d052a1c75e3410e85e6ec333272750f~mv2.png/v1/fit/w_912%2Ch_912%2Cq_90/0283bf_0d052a1c75e3410e85e6ec333272750f~mv2.png",

  "045l-mf-voltron":
    "https://static.wixstatic.com/media/4ee99f_bfe22d15519e43cdb9a2fd605cc39601~mv2.png/v1/fill/w_980%2Ch_762%2Cal_c%2Cq_90%2Cusm_0.66_1.00_0.01%2Cenc_avif%2Cquality_auto/4ee99f_bfe22d15519e43cdb9a2fd605cc39601~mv2.png",

  "ns70l-voltron":
    "https://static.wixstatic.com/media/4ee99f_bfe22d15519e43cdb9a2fd605cc39601~mv2.png/v1/fill/w_980%2Ch_762%2Cal_c%2Cq_90%2Cusm_0.66_1.00_0.01%2Cenc_avif%2Cquality_auto/4ee99f_bfe22d15519e43cdb9a2fd605cc39601~mv2.png",

  "n70l-voltron":
    "https://static.wixstatic.com/media/4ee99f_bfe22d15519e43cdb9a2fd605cc39601~mv2.png/v1/fill/w_980%2Ch_762%2Cal_c%2Cq_90%2Cusm_0.66_1.00_0.01%2Cenc_avif%2Cquality_auto/4ee99f_bfe22d15519e43cdb9a2fd605cc39601~mv2.png"
};


// =============================================================
// ADDITIONAL PRODUCTS
// =============================================================

const additions = [

  ["Chloride Exide", "075 Solar Chloride Exide", 10000, "solar", "075-solar-chloride-exide"],

  ["Chloride Exide", "100 Solar Chloride Exide", 14000, "solar", "100-solar-chloride-exide"],

  ["Solar Spark", "100 MF Solar Spark", 12000, "solar", "100-mf-solar-spark"],

  ["Solar Spark", "075 MF Solar Spark", 10000, "solar", "075-mf-solar-spark"],

  ["Solar Spark", "050 MF Solar Spark", 8000, "solar", "050-mf-solar-spark"],

  ["Ritar Power", "Ritar Power 100Ah 12V", 21400, "solar", "100-ah-12v-ritar-power"],

  ["Eastman", "Solar 200Ah 12V Eastman", 34000, "solar", "solar-200ah-12v-eastman"],

  ["Solar Panel", "Solar 100 Watts (Mono)", 400, "solar", "100-watts-solar-panel-mono"],

  ["Solar Panel", "Solar 200 Watts (Mono)", 7000, "solar", "200-watts-solar-panel-mono"],

  ["Solar Panel", "Solar 300 Watts (Mono)", 10000, "solar", "300-watts-solar-panel-mono"],

  ["Jinko", "Solar 620 Watts (Mono)", 12500, "solar", "620-watts-solar-panel-mono"],

  ["Chloride Exide", "N50 MFL Chloride Exide", 9500, "chloride", "n50-mfl-chloride-exide"],

  ["Solar Spark", "N70 MFL Spark", 10000, "powerlast", "n70-mfl-spark"],

  ["Solar Spark", "NS70 MFL Spark", 8000, "powerlast", "ns70-mfl-spark"],

  ["Supreme", "N70 MFL Supreme", 12000, "powerlast", "n70-mfl-supreme"],

  ["Exide Matrix", "045 L MF Exide Matrix", 12000, "powerlast", "045l-mf-exide-matrix"],

  ["Exide Matrix", "N70 MFR Exide Matrix", 15000, "powerlast", "n70mfr-exide-matrix"],

  ["Voltron", "045 L MF Voltron", 7000, "powerlast", "045l-mf-voltron"],

  ["Voltron", "NS70 L Voltron", 9000, "powerlast", "ns70l-voltron"],

  ["Voltron", "N70 L Voltron", 10000, "powerlast", "n70l-voltron"]
];


// =============================================================
// NOTIFICATION
// =============================================================

function notify(text, bad = false) {

  message.textContent = text;

  message.className =
    bad ? "message bad" : "message";

  clearTimeout(notify.timer);

  notify.timer = setTimeout(() => {
    message.textContent = "";
  }, 5000);
}


// =============================================================
// SLUG
// =============================================================

function slug(name) {

  return String(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}


// =============================================================
// HTML ESCAPE
// =============================================================

function escapeHtml(value) {

  return String(value ?? "")
    .replace(
      /[&<>'"]/g,
      c => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        '"': "&quot;"
      }[c])
    );
}


// =============================================================
// STARTER PRODUCTS WITH IMAGES
// =============================================================

const starterWithImages =
  starter.map(
    ([brand, name, price, category]) => {

      const key = slug(name);

      return [
        brand,
        name,
        price,
        category,
        verifiedImages[key] || ""
      ];
    }
  );


// =============================================================
// RESET
// =============================================================

function reset() {

  form.reset();

  editingId = null;

  editingImageUrl = "";

  $("saveBtn").textContent =
    "Add product";

  $("cancelBtn").hidden =
    true;

  $("formTitle").textContent =
    "Add product";

  $("sortOrder").value =
    100;

  $("stock").checked =
    true;

  $("active").checked =
    true;
}


// =============================================================
// EDIT FORM
// =============================================================

function fill(p) {

  editingId = p.id;

  editingImageUrl =
    p.imageUrl || "";

  $("name").value =
    p.name || "";

  $("brand").value =
    p.brand || "";

  $("price").value =
    p.price ?? "";

  $("category").value =
    p.category || "other";

  $("description").value =
    p.description || "";

  $("sortOrder").value =
    p.sortOrder ?? 100;

  $("stock").checked =
    p.stock !== false;

  $("active").checked =
    p.active !== false;

  $("image").value =
    "";

  $("saveBtn").textContent =
    "Save changes";

  $("cancelBtn").hidden =
    false;

  $("formTitle").textContent =
    "Edit product";

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}


// =============================================================
// R2 IMAGE UPLOAD
// =============================================================

async function uploadImage(file, productId) {

  const formData =
    new FormData();

  formData.append(
    "file",
    file
  );

  formData.append(
    "folder",
    "products"
  );

  formData.append(
    "fileName",
    `${productId}-${file.name}`
  );

  const response =
    await fetch(
      `${R2_WORKER_URL}/upload`,
      {
        method: "POST",
        body: formData
      }
    );

  let result;

  try {

    result =
      await response.json();

  } catch {

    throw new Error(
      "Cloudflare image storage returned an invalid response."
    );
  }

  if (
    !response.ok ||
    !result.success
  ) {

    throw new Error(
      result.error ||
      "Product image upload failed."
    );
  }

  if (!result.url) {

    throw new Error(
      "Cloudflare uploaded the image but did not return an image URL."
    );
  }

  return result;
}


// =============================================================
// GET R2 KEY
// =============================================================

function getR2KeyFromUrl(imageUrl) {

  if (!imageUrl) {
    return "";
  }

  try {

    const url =
      new URL(imageUrl);

    if (
      url.origin !==
      R2_WORKER_URL
    ) {
      return "";
    }

    if (
      !url.pathname.startsWith("/file/")
    ) {
      return "";
    }

    return decodeURIComponent(
      url.pathname.substring(
        "/file/".length
      )
    );

  } catch {

    return "";
  }
}


// =============================================================
// DELETE R2 IMAGE
// =============================================================

async function deleteImageFromR2(imageUrl) {

  const key =
    getR2KeyFromUrl(imageUrl);

  if (!key) {
    return;
  }

  const response =
    await fetch(
      `${R2_WORKER_URL}/delete?key=${encodeURIComponent(key)}`,
      {
        method: "DELETE"
      }
    );

  let result = null;

  try {
    result =
      await response.json();
  } catch {
    // Ignore invalid delete response.
  }

  if (
    !response.ok ||
    (result && result.success === false)
  ) {

    throw new Error(
      result?.error ||
      "Could not delete the old image."
    );
  }
}


// =============================================================
// SAVE PRODUCT
// =============================================================

async function save(e) {

  e.preventDefault();

  const name =
    $("name").value.trim();

  const brand =
    $("brand").value.trim();

  const price =
    Number($("price").value);

  const file =
    $("image").files[0];


  // -----------------------------------------------------------
  // VALIDATE PRODUCT
  // -----------------------------------------------------------

  if (
    !name ||
    !brand ||
    !Number.isFinite(price) ||
    price < 0
  ) {

    notify(
      "Name, brand and a valid price are required.",
      true
    );

    return;
  }


  // -----------------------------------------------------------
  // VALIDATE IMAGE
  // -----------------------------------------------------------

  if (
    file &&
    (
      !file.type.startsWith("image/") ||
      file.size > 5 * 1024 * 1024
    )
  ) {

    notify(
      "Use an image file up to 5 MB.",
      true
    );

    return;
  }


  const oldImageUrl =
    editingImageUrl;

  let imageUrl =
    editingImageUrl;

  let uploadedImageUrl =
    "";


  try {

    $("saveBtn").disabled =
      true;

    $("saveBtn").textContent =
      file
        ? "Uploading image..."
        : (
          editingId
            ? "Saving..."
            : "Adding..."
        );


    // =========================================================
    // EDIT EXISTING PRODUCT
    // =========================================================

    if (editingId) {

      if (file) {

        const uploaded =
          await uploadImage(
            file,
            editingId
          );

        imageUrl =
          uploaded.url;

        uploadedImageUrl =
          uploaded.url;
      }


      const data = {

        name,

        brand,

        price,

        category:
          $("category").value,

        description:
          $("description").value.trim() ||
          "Contact us to confirm compatibility and availability.",

        sortOrder:
          Number(
            $("sortOrder").value
          ) || 100,

        stock:
          $("stock").checked,

        active:
          $("active").checked,

        imageUrl,

        updatedAt:
          serverTimestamp()
      };


      await updateDoc(
        doc(
          db,
          "products",
          editingId
        ),
        data
      );


      // Delete old R2 image only after Firestore update succeeds.

      if (
        file &&
        oldImageUrl &&
        oldImageUrl !== imageUrl
      ) {

        try {

          await deleteImageFromR2(
            oldImageUrl
          );

        } catch (deleteError) {

          console.warn(
            "Old image cleanup failed:",
            deleteError
          );
        }
      }


      notify(
        "Product updated successfully."
      );

    }


    // =========================================================
    // ADD NEW PRODUCT
    // =========================================================

    else {

      // Create Firestore ID first.

      const productRef =
        doc(
          collection(
            db,
            "products"
          )
        );


      // Upload image using the new product ID.

      if (file) {

        const uploaded =
          await uploadImage(
            file,
            productRef.id
          );

        imageUrl =
          uploaded.url;

        uploadedImageUrl =
          uploaded.url;
      }


      const data = {

        name,

        brand,

        price,

        category:
          $("category").value,

        description:
          $("description").value.trim() ||
          "Contact us to confirm compatibility and availability.",

        sortOrder:
          Number(
            $("sortOrder").value
          ) || 100,

        stock:
          $("stock").checked,

        active:
          $("active").checked,

        imageUrl,

        createdAt:
          serverTimestamp(),

        updatedAt:
          serverTimestamp()
      };


      await setDoc(
        productRef,
        data
      );


      notify(
        "Product added successfully."
      );
    }


    reset();

  } catch (err) {

    console.error(
      "Product save error:",
      err
    );


    // If image was uploaded but product saving failed,
    // clean up the R2 image.

    if (uploadedImageUrl) {

      try {

        await deleteImageFromR2(
          uploadedImageUrl
        );

      } catch (cleanupError) {

        console.warn(
          "Uploaded image cleanup failed:",
          cleanupError
        );
      }
    }


    notify(
      err.message ||
      "Could not save product.",
      true
    );

  } finally {

    $("saveBtn").disabled =
      false;

    $("saveBtn").textContent =
      editingId
        ? "Save changes"
        : "Add product";
  }
}


// =============================================================
// DELETE PRODUCT
// =============================================================

async function removeProduct(id) {

  if (
    !confirm(
      "Delete this product from the catalogue?"
    )
  ) {
    return;
  }


  const product =
    currentProducts.find(
      p => p.id === id
    );


  try {

    // Delete image from R2 if it belongs to this Worker.

    if (
      product &&
      product.imageUrl
    ) {

      try {

        await deleteImageFromR2(
          product.imageUrl
        );

      } catch (imageError) {

        console.warn(
          "Could not delete product image:",
          imageError
        );
      }
    }


    await deleteDoc(
      doc(
        db,
        "products",
        id
      )
    );


    notify(
      "Product deleted."
    );

  } catch (err) {

    console.error(err);

    notify(
      err.message ||
      "Could not delete product.",
      true
    );
  }
}


// =============================================================
// PUBLISH / HIDE
// =============================================================

async function toggle(id, value) {

  try {

    await updateDoc(
      doc(
        db,
        "products",
        id
      ),
      {
        active: value,
        updatedAt:
          serverTimestamp()
      }
    );


    notify(
      value
        ? "Product published."
        : "Product hidden."
    );

  } catch (err) {

    console.error(err);

    notify(
      err.message ||
      "Could not update publication status.",
      true
    );
  }
}


// =============================================================
// SEED ORIGINAL CATALOGUE
// =============================================================

async function seedOriginalCatalogue({
  force = false
} = {}) {

  const existing =
    await getDocs(
      collection(
        db,
        "products"
      )
    );


  if (
    !force &&
    !existing.empty
  ) {

    return false;
  }


  const batch =
    writeBatch(db);


  starterWithImages.forEach(
    (
      [
        brand,
        name,
        price,
        category,
        imageUrl
      ],
      i
    ) => {

      const id =
        slug(name);


      batch.set(
        doc(
          db,
          "products",
          id
        ),
        {

          brand,

          name,

          price,

          category,

          description:
            "Contact us to confirm compatibility and availability.",

          sortOrder:
            i + 1,

          stock:
            true,

          active:
            true,

          imageUrl:
            imageUrl || "",

          createdAt:
            serverTimestamp(),

          updatedAt:
            serverTimestamp()

        },
        {
          merge: true
        }
      );
    }
  );


  await batch.commit();

  return true;
}


// =============================================================
// SEED NEW SUPPLIER PRODUCTS
// =============================================================

async function seedAdditions() {

  const existing =
    await getDocs(
      collection(
        db,
        "products"
      )
    );


  const existingMap =
    new Map(
      existing.docs.map(
        d => [
          d.id,
          {
            id: d.id,
            ...d.data()
          }
        ]
      )
    );


  const batch =
    writeBatch(db);

  let changed =
    0;


  additions.forEach(
    (
      [
        brand,
        name,
        price,
        category,
        key
      ],
      i
    ) => {

      const id =
        slug(name);

      const imageUrl =
        verifiedImages[key] || "";

      const current =
        existingMap.get(id);


      if (current) {

        // Never overwrite existing product information.

        // Only repair missing images.

        if (
          !current.imageUrl &&
          imageUrl
        ) {

          batch.update(
            doc(
              db,
              "products",
              id
            ),
            {
              imageUrl,
              updatedAt:
                serverTimestamp()
            }
          );

          changed++;
        }

        return;
      }


      batch.set(
        doc(
          db,
          "products",
          id
        ),
        {

          brand,

          name,

          price,

          category,

          description:
            "Contact us to confirm compatibility and availability.",

          sortOrder:
            30 + i,

          stock:
            true,

          active:
            true,

          imageUrl,

          createdAt:
            serverTimestamp(),

          updatedAt:
            serverTimestamp()

        }
      );


      changed++;
    }
  );


  if (changed) {

    await batch.commit();
  }


  return changed;
}


// =============================================================
// IMPORT / RESTORE CATALOGUE
// =============================================================

async function importStarter() {

  const confirmed =
    confirm(
      "Restore the original 23 Southern Batteries catalogue products and add the new supplier list? Existing original records will be updated; existing supplier products keep their current details and only missing images are repaired."
    );


  if (!confirmed) {
    return;
  }


  try {

    await seedOriginalCatalogue({
      force: true
    });


    const added =
      await seedAdditions();


    if (added) {

      notify(
        `The catalogue has been restored and ${added} supplier products were added/repaired.`
      );

    } else {

      notify(
        "The catalogue has been restored."
      );
    }

  } catch (err) {

    console.error(err);

    notify(
      err.message ||
      "Could not restore catalogue.",
      true
    );
  }
}


// =============================================================
// RENDER CATALOGUE TABLE
// =============================================================

function render() {

  const sorted =
    [...currentProducts].sort(
      (a, b) =>
        Number(
          a.sortOrder ?? 100
        ) -
        Number(
          b.sortOrder ?? 100
        )
    );


  table.innerHTML =
    sorted
      .map(
        p => `

        <tr>

          <td>

            <strong>
              ${escapeHtml(p.name)}
            </strong>

            <small>
              ${escapeHtml(p.brand)}
            </small>

          </td>

          <td>
            KSh ${Number(
              p.price || 0
            ).toLocaleString("en-KE")}
          </td>

          <td>
            ${
              p.stock === false
                ? "Out"
                : "Available"
            }
          </td>

          <td>

            <button
              data-edit="${p.id}">
              Edit
            </button>

            <button
              data-toggle="${p.id}"
              data-value="${p.active !== false}">
              ${
                p.active !== false
                  ? "Hide"
                  : "Publish"
              }
            </button>

            <button
              class="danger"
              data-delete="${p.id}">
              Delete
            </button>

          </td>

        </tr>

      `
      )
      .join("")
      ||
      `
        <tr>
          <td colspan="4">
            No products yet.
          </td>
        </tr>
      `;


  // -----------------------------------------------------------
  // EDIT BUTTONS
  // -----------------------------------------------------------

  table
    .querySelectorAll("[data-edit]")
    .forEach(button => {

      button.onclick =
        () => {

          const product =
            currentProducts.find(
              p =>
                p.id ===
                button.dataset.edit
            );


          if (product) {
            fill(product);
          }
        };
    });


  // -----------------------------------------------------------
  // DELETE BUTTONS
  // -----------------------------------------------------------

  table
    .querySelectorAll("[data-delete]")
    .forEach(button => {

      button.onclick =
        () =>
          removeProduct(
            button.dataset.delete
          );
    });


  // -----------------------------------------------------------
  // PUBLISH / HIDE BUTTONS
  // -----------------------------------------------------------

  table
    .querySelectorAll("[data-toggle]")
    .forEach(button => {

      button.onclick =
        () =>
          toggle(
            button.dataset.toggle,
            button.dataset.value !== "true"
          );
    });
}


// =============================================================
// START ADMIN
// =============================================================

async function startAdmin(user) {

  try {

    // ---------------------------------------------------------
    // Verify admin record
    // ---------------------------------------------------------

    const adminDoc =
      await getDoc(
        doc(
          db,
          "admins",
          user.uid
        )
      );


    if (
      !adminDoc.exists()
    ) {

      await signOut(auth);

      login.hidden =
        false;

      admin.hidden =
        true;

      notify(
        "This account is not authorized as a Southern Batteries admin.",
        true
      );

      return;
    }


    // ---------------------------------------------------------
    // Show admin interface
    // ---------------------------------------------------------

    login.hidden =
      true;

    admin.hidden =
      false;


    // ---------------------------------------------------------
    // Seed original catalogue
    // ---------------------------------------------------------

    const seeded =
      await seedOriginalCatalogue();


    // ---------------------------------------------------------
    // Add supplier products
    // ---------------------------------------------------------

    const added =
      await seedAdditions();


    if (seeded) {

      notify(
        "Original 23-product catalogue loaded. You can now edit or add products."
      );

    } else if (added) {

      notify(
        `${added} new catalogue products added.`
      );
    }


    // ---------------------------------------------------------
    // Stop previous listener if necessary
    // ---------------------------------------------------------

    if (productsUnsubscribe) {

      productsUnsubscribe();

      productsUnsubscribe =
        null;
    }


    // ---------------------------------------------------------
    // Listen to Firestore products
    // ---------------------------------------------------------

    productsUnsubscribe =
      onSnapshot(
        collection(
          db,
          "products"
        ),

        snap => {

          currentProducts =
            snap.docs.map(
              d => ({
                id: d.id,
                ...d.data()
              })
            );

          render();
        },

        err => {

          console.error(err);

          notify(
            err.message ||
            "Could not load catalogue.",
            true
          );
        }
      );

  } catch (err) {

    console.error(err);

    await signOut(auth);

    login.hidden =
      false;

    admin.hidden =
      true;

    notify(
      err.message ||
      "Could not verify administrator access.",
      true
    );
  }
}


// =============================================================
// AUTH STATE
// =============================================================

onAuthStateChanged(
  auth,
  user => {

    if (user) {

      startAdmin(user);

    } else {

      login.hidden =
        false;

      admin.hidden =
        true;

      if (productsUnsubscribe) {

        productsUnsubscribe();

        productsUnsubscribe =
          null;
      }
    }
  }
);


// =============================================================
// LOGIN FORM
// =============================================================

$("loginForm").onsubmit =
  async e => {

    e.preventDefault();


    try {

      await signInWithEmailAndPassword(
        auth,
        $("email").value.trim(),
        $("password").value
      );

    } catch (err) {

      console.error(err);


      const messages = {

        "auth/invalid-credential":
          "Incorrect email or password.",

        "auth/invalid-login-credentials":
          "Incorrect email or password.",

        "auth/user-not-found":
          "No Firebase Authentication account exists for this email.",

        "auth/wrong-password":
          "Incorrect password.",

        "auth/too-many-requests":
          "Too many attempts. Please wait and try again.",

        "auth/unauthorized-domain":
          "This website domain is not authorized in Firebase Authentication."
      };


      notify(
        messages[err.code] ||
        `Login failed: ${
          err.code ||
          err.message
        }`,
        true
      );
    }
  };


// =============================================================
// LOGOUT
// =============================================================

$("logout").onclick =
  () => signOut(auth);


// =============================================================
// RESTORE CATALOGUE
// =============================================================

$("importStarter").onclick =
  importStarter;


// =============================================================
// PRODUCT FORM
// =============================================================

form.onsubmit =
  save;


// =============================================================
// CANCEL EDIT
// =============================================================

$("cancelBtn").onclick =
  reset;
