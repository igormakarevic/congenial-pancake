const STORAGE_KEYS = {
  products: "shop_custom_products_v1",
  cart: "shop_custom_cart_v1",
  users: "shop_custom_users_v1",
  session: "shop_custom_session_v1",
  adminPass: "shop_custom_admin_pass_v1"
};
function loadData(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveData(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

let products = loadData(STORAGE_KEYS.products, []);
let cart = loadData(STORAGE_KEYS.cart, []);
let users = loadData(STORAGE_KEYS.users, []);
let currentUser = loadData(STORAGE_KEYS.session, null);
let adminPassword = localStorage.getItem(STORAGE_KEYS.adminPass) || "admin123";
let adminUnlocked = false;

// Навігація між вкладками
const views = {
  catalog: document.getElementById("viewCatalog"),
  cart: document.getElementById("viewCart"),
  profile: document.getElementById("viewProfile"),
  admin: document.getElementById("viewAdmin")
};

const navButtons = {
  catalog: document.getElementById("btnCatalog"),
  cart: document.getElementById("btnCart"),
  profile: document.getElementById("btnProfile"),
  admin: document.getElementById("btnAdmin")
};

function switchView(name) {
  Object.keys(views).forEach((k) => {
    views[k].classList.toggle("active", k === name);
    navButtons[k].classList.toggle("active", k === name);
  });
  if (name === "catalog") renderCatalog();
  if (name === "cart") renderCart();
  if (name === "profile") renderProfile();
  if (name === "admin") renderAdmin();
}

navButtons.catalog.addEventListener("click", () => switchView("catalog"));
navButtons.cart.addEventListener("click", () => switchView("cart"));
navButtons.profile.addEventListener("click", () => switchView("profile"));
navButtons.admin.addEventListener("click", () => switchView("admin"));

// Каталог
const catalogList = document.getElementById("catalogList");
const emptyCatalogMsg = document.getElementById("emptyCatalogMsg");

function renderCatalog() {
  catalogList.innerHTML = "";
  emptyCatalogMsg.classList.toggle("hidden", products.length > 0);

  products.forEach((item) => {
    const card = document.createElement("div");
    card.className = "card";

    const titleEl = document.createElement("div");
    titleEl.className = "card-title";
    titleEl.textContent = item.name;

    const descEl = document.createElement("div");
    descEl.className = "card-desc";
    descEl.textContent = item.description;

    const priceEl = document.createElement("div");
    priceEl.className = "card-price";
    priceEl.textContent = item.price;

    const addBtn = document.createElement("button");
    addBtn.className = "btn";
    addBtn.textContent = "У кошик";
    addBtn.addEventListener("click", () => addToCart(item.id));

    card.append(titleEl, descEl, priceEl, addBtn);
    catalogList.appendChild(card);
  });
}

// Кошик
const cartCountEl = document.getElementById("cartCount");
const cartListEl = document.getElementById("cartList");
const cartTotalEl = document.getElementById("cartTotal");
const btnClearCart = document.getElementById("btnClearCart");

function parsePriceNumber(priceStr) {
  const num = parseFloat(String(priceStr).replace(",", ".").replace(/[^0-9.]/g, ""));
  return Number.isNaN(num) ? 0 : num;
}

function updateCartBadge() {
  const totalQty = cart.reduce((sum, entry) => sum + entry.qty, 0);
  cartCountEl.textContent = totalQty;
}

function addToCart(productId) {
  const prod = products.find((p) => p.id === productId);
  if (!prod) return;

  const existing = cart.find((c) => c.id === productId);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({
      id: prod.id,
      name: prod.name,
      price: prod.price,
      qty: 1
    });
  }
  saveData(STORAGE_KEYS.cart, cart);
  updateCartBadge();
}

function renderCart() {
  cartListEl.innerHTML = "";
  let total = 0;

  if (cart.length === 0) {
    cartListEl.innerHTML = '<p class="empty-msg">Кошик порожній.</p>';
    cartTotalEl.textContent = "0";
    return;
  }

  cart.forEach((entry, idx) => {
    total += parsePriceNumber(entry.price) * entry.qty;

    const row = document.createElement("div");
    row.className = "cart-item";

    const info = document.createElement("div");
    info.innerHTML = `<strong>${escapeHtml(entry.name)}</strong><div>${escapeHtml(entry.price)} × ${entry.qty}</div>`;

    const delBtn = document.createElement("button");
    delBtn.className = "btn secondary";
    delBtn.textContent = "Прибрати";
    delBtn.addEventListener("click", () => {
      cart.splice(idx, 1);
      saveData(STORAGE_KEYS.cart, cart);
      updateCartBadge();
      renderCart();
    });

    row.append(info, delBtn);
    cartListEl.appendChild(row);
  });

  cartTotalEl.textContent = total;
}

btnClearCart.addEventListener("click", () => {
  cart = [];
  saveData(STORAGE_KEYS.cart, cart);
  updateCartBadge();
  renderCart();
});

// Профіль (реєстрація та вхід за поштою і паролем)
const tabLogin = document.getElementById("tabLogin");
const tabRegister = document.getElementById("tabRegister");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const authMsg = document.getElementById("authMsg");
const authBox = document.getElementById("authBox");
const userBox = document.getElementById("userBox");
const userEmailDisplay = document.getElementById("userEmailDisplay");
const btnLogout = document.getElementById("btnLogout");

tabLogin.addEventListener("click", () => {
  tabLogin.classList.add("active");
  tabRegister.classList.remove("active");
  loginForm.classList.remove("hidden");
  registerForm.classList.add("hidden");
  authMsg.textContent = "";
});

tabRegister.addEventListener("click", () => {
  tabRegister.classList.add("active");
  tabLogin.classList.remove("active");
  registerForm.classList.remove("hidden");
  loginForm.classList.add("hidden");
  authMsg.textContent = "";
});

registerForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const email = document.getElementById("regEmail").value.trim().toLowerCase();
  const password = document.getElementById("regPassword").value;

  if (users.some((u) => u.email === email)) {
    authMsg.textContent = "Така пошта вже зареєстрована.";
    return;
  }

  const newUser = { email, password };
  users.push(newUser);
  saveData(STORAGE_KEYS.users, users);

  currentUser = { email };
  saveData(STORAGE_KEYS.session, currentUser);
  registerForm.reset();
  renderProfile();
});

loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value.trim().toLowerCase();
  const password = document.getElementById("loginPassword").value;

  const found = users.find((u) => u.email === email && u.password === password);
  if (!found) {
    authMsg.textContent = "Невірна пошта або пароль.";
    return;
  }

  currentUser = { email: found.email };
  saveData(STORAGE_KEYS.session, currentUser);
  loginForm.reset();
  renderProfile();
});

btnLogout.addEventListener("click", () => {
  currentUser = null;
  saveData(STORAGE_KEYS.session, null);
  renderProfile();
});

function renderProfile() {
  if (currentUser && currentUser.email) {
    authBox.classList.add("hidden");
    userBox.classList.remove("hidden");
    userEmailDisplay.textContent = currentUser.email;
  } else {
    userBox.classList.add("hidden");
    authBox.classList.remove("hidden");
  }
}

// Адмін-панель (додавання товарів)
const adminLock = document.getElementById("adminLock");
const adminPanel = document.getElementById("adminPanel");
const adminAuthForm = document.getElementById("adminAuthForm");
const adminPassInput = document.getElementById("adminPassInput");
const adminMsg = document.getElementById("adminMsg");
const addProductForm = document.getElementById("addProductForm");
const adminStatus = document.getElementById("adminStatus");

adminAuthForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (adminPassInput.value === adminPassword) {
    adminUnlocked = true;
    adminMsg.textContent = "";
    adminPassInput.value = "";
    renderAdmin();
  } else {
    adminMsg.textContent = "Невірний пароль адміністратора.";
  }
});

addProductForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = document.getElementById("prodName").value.trim();
  const price = document.getElementById("prodPrice").value.trim();
  const description = document.getElementById("prodDesc").value.trim();

  if (!name || !price) return;

  products.push({
    id: Date.now().toString(),
    name,
    price,
    description
  });
  saveData(STORAGE_KEYS.products, products);

  addProductForm.reset();
  adminStatus.textContent = "Товар додано в каталог.";
});

function renderAdmin() {
  if (adminUnlocked) {
    adminLock.classList.add("hidden");
    adminPanel.classList.remove("hidden");
  } else {
    adminPanel.classList.add("hidden");
    adminLock.classList.remove("hidden");
  }
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

// Старт
updateCartBadge();
renderCatalog();
renderProfile();
renderAdmin();
(function setupHiddenAdminAndPhoto() {
  const brandEl = document.getElementById("brandName");
  const adminBtnEl = document.getElementById("btnAdmin");
  const photoInputEl = document.getElementById("prodPhotoFile");
  const previewBoxEl = document.getElementById("photoPreviewBox");
  const previewImgEl = document.getElementById("photoPreviewImg");
  const removePhotoBtnEl = document.getElementById("btnRemovePhoto");

  let secretClicks = 0;
  let clickTimer = null;

  function revealAdminButton() {
    if (!adminBtnEl) return;
    adminBtnEl.classList.remove("secret-hidden");
    if (typeof switchView === "function") {
      switchView("admin");
    }
  }

  if (adminBtnEl) {
    adminBtnEl.classList.add("secret-hidden");
  }

  if (brandEl) {
    brandEl.style.cursor = "pointer";
    brandEl.addEventListener("click", () => {
      secretClicks += 1;
      clearTimeout(clickTimer);
      clickTimer = setTimeout(() => {
        secretClicks = 0;
      }, 1500);

      if (secretClicks >= 5) {
        secretClicks = 0;
        revealAdminButton();
      }
    });
  }

  if (window.location.hash === "#admin-secret") {
    revealAdminButton();
  }

  if (photoInputEl && previewImgEl && previewBoxEl) {
    photoInputEl.addEventListener("change", () => {
      const file = photoInputEl.files && photoInputEl.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        currentPhotoData = String(reader.result || "");
        previewImgEl.src = currentPhotoData;
        previewBoxEl.classList.remove("hidden");
      };
      reader.readAsDataURL(file);
    });
  }

  if (removePhotoBtnEl && photoInputEl && previewImgEl && previewBoxEl) {
    removePhotoBtnEl.addEventListener("click", () => {
      currentPhotoData = "";
      photoInputEl.value = "";
      previewImgEl.src = "";
      previewBoxEl.classList.add("hidden");
    });
  }
})();
(function safeStorageFallback() {
  const memoryStore = {};
  try {
    void window.localStorage;
  } catch {
    window.localStorage = {
      getItem: (k) => (k in memoryStore ? memoryStore[k] : null),
      setItem: (k, v) => {
        memoryStore[k] = String(v);
      },
      removeItem: (k) => {
        delete memoryStore[k];
      },
      clear: () => {
        Object.keys(memoryStore).forEach((k) => delete memoryStore[k]);
      }
    };
  }
})();
(function enablePhotoAndDescription() {
  const form = document.getElementById("addProductForm");
  if (!form) return;

  let uploadedPhoto = "";

  // 1. Якщо у формі ще немає поля для фото — додаємо його автоматично
  let fileInput = document.getElementById("prodPhotoFile");
  if (!fileInput) {
    const label = document.createElement("label");
    label.innerHTML = 'Фото товару з галереї:<input type="file" id="prodPhotoFile" accept="image/*">';
    form.insertBefore(label, form.querySelector("button[type='submit']"));
    fileInput = label.querySelector("input");
  }

  // 2. Якщо немає поля для опису — теж додаємо
  let descInput = document.getElementById("prodDesc");
  if (!descInput) {
    const label = document.createElement("label");
    label.innerHTML = 'Опис товару:<textarea id="prodDesc" rows="3"></textarea>';
    form.insertBefore(label, form.querySelector("button[type='submit']"));
    descInput = label.querySelector("textarea");
  }

  // 3. Читаємо вибране фото у формат тексту (Base64), щоб воно збереглося
  fileInput.addEventListener("change", () => {
    const file = fileInput.files && fileInput.files[0];
    if (!file) {
      uploadedPhoto = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      uploadedPhoto = String(reader.result || "");
    };
    reader.readAsDataURL(file);
  });

  // 4. При натисканні "Додати в каталог" прикріплюємо фото та опис до останнього товару
  form.addEventListener("submit", () => {
    setTimeout(() => {
      if (products.length > 0) {
        const lastProduct = products[products.length - 1];
        if (uploadedPhoto) {
          lastProduct.photo = uploadedPhoto;
        }
        if (descInput && descInput.value.trim()) {
          lastProduct.description = descInput.value.trim();
        }
        saveData(STORAGE_KEYS.products, products);
        uploadedPhoto = "";
        fileInput.value = "";
        if (typeof renderCatalog === "function") renderCatalog();
      }
    }, 50);
  });
})();
(function showProductPhotosInCatalog() {
  if (typeof renderCatalog !== "function") return;

  const originalRenderCatalog = renderCatalog;
  renderCatalog = function patchedRenderCatalog() {
    originalRenderCatalog();
    const cards = document.querySelectorAll("#catalogList .card");
    cards.forEach((card, idx) => {
      const item = products[idx];
      if (!item || !item.photo) return;
      if (card.querySelector("img")) return;

      const img = document.createElement("img");
      img.src = item.photo;
      img.alt = item.name || "Фото товару";
      img.style.width = "100%";
      img.style.height = "190px";
      img.style.objectFit = "cover";
      img.style.borderRadius = "8px";
      img.style.marginBottom = "12px";
      card.prepend(img);
    });
  };

  renderCatalog();
})();
(function setupCheckoutAndOrders() {
  const ORDERS_KEY = "shop_custom_orders_v1";
  const viewCart = document.getElementById("viewCart");
  const userBox = document.getElementById("userBox");
  const adminPanel = document.getElementById("adminPanel");

  if (!viewCart) return;

  function getOrders() {
    return loadData(ORDERS_KEY, []);
  }

  function saveOrders(list) {
    saveData(ORDERS_KEY, list);
  }

  function showToast(text) {
    const old = document.querySelector(".toast-banner");
    if (old) old.remove();
    const banner = document.createElement("div");
    banner.className = "toast-banner";
    banner.textContent = text;
    document.body.appendChild(banner);
    setTimeout(() => banner.remove(), 3000);
  }

  // 1. Блок оформлення покупки в кошику
  const checkoutBox = document.createElement("div");
  checkoutBox.className = "checkout-box";
  checkoutBox.innerHTML = `
    <h2>Оформлення замовлення</h2>
    <form id="checkoutForm" class="form">
      <label>
        Ваше ім'я
        <input type="text" id="orderCustomerName" required>
      </label>
      <label>
        Телефон або нік у Telegram
        <input type="text" id="orderContact" required>
      </label>
      <label>
        Адреса доставки (місто, відділення або вулиця)
        <textarea id="orderAddress" rows="2" required></textarea>
      </label>
      <button type="submit" class="btn">Купити та оформити замовлення</button>
    </form>
    <p id="checkoutMsg" class="msg"></p>
  `;
  viewCart.appendChild(checkoutBox);

  const checkoutForm = document.getElementById("checkoutForm");
  const checkoutMsg = document.getElementById("checkoutMsg");

  checkoutForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!cart || cart.length === 0) {
      checkoutMsg.textContent = "Спочатку додай хоча б один товар у кошик.";
      return;
    }

    const customerName = document.getElementById("orderCustomerName").value.trim();
    const contact = document.getElementById("orderContact").value.trim();
    const address = document.getElementById("orderAddress").value.trim();
    const totalSum = document.getElementById("cartTotal") ? document.getElementById("cartTotal").textContent : "0";

    const newOrder = {
      id: Date.now().toString(),
      date: new Date().toLocaleString("uk-UA"),
      userEmail: currentUser && currentUser.email ? currentUser.email : "Гість",
      customerName,
      contact,
      address,
      items: cart.map((item) => ({ ...item })),
      total: totalSum
    };

    const orders = getOrders();
    orders.unshift(newOrder);
    saveOrders(orders);

    cart = [];
    saveData(STORAGE_KEYS.cart, cart);
    updateCartBadge();
    renderCart();
    checkoutForm.reset();

    checkoutMsg.textContent = "Замовлення прийнято! Доставка за адресою: " + address;
    showToast("Покупку оформлено!");
    renderOrderLists();
  });

  // 2. Історія покупок у Профілі та всі замовлення в Адмін-панелі
  const profileOrdersWrap = document.createElement("div");
  profileOrdersWrap.style.marginTop = "16px";
  if (userBox) userBox.appendChild(profileOrdersWrap);

  const adminOrdersWrap = document.createElement("div");
  adminOrdersWrap.style.marginTop = "20px";
  if (adminPanel) adminPanel.appendChild(adminOrdersWrap);

  function formatItems(items) {
    return items.map((i) => escapeHtml(i.name) + " × " + i.qty).join(", ");
  }

  function renderOrderLists() {
    const orders = getOrders();

    if (userBox && currentUser && currentUser.email) {
      const myOrders = orders.filter((o) => o.userEmail === currentUser.email);
      profileOrdersWrap.innerHTML = "<h2>Мої покупки (" + myOrders.length + ")</h2>";
      if (myOrders.length === 0) {
        profileOrdersWrap.innerHTML += '<p class="empty-msg">У цього профілю ще немає покупок.</p>';
      } else {
        myOrders.forEach((o) => {
          const div = document.createElement("div");
          div.className = "order-card";
          div.innerHTML =
            "<strong>" + escapeHtml(o.date) + "</strong><br>" +
            "Товари: " + formatItems(o.items) + "<br>" +
            "Адреса: " + escapeHtml(o.address) + "<br>" +
            "Сума: <strong>" + escapeHtml(o.total) + "</strong>";
          profileOrdersWrap.appendChild(div);
        });
      }
    }

    if (adminPanel) {
      adminOrdersWrap.innerHTML = "<h2>Усі замовлення покупців (" + orders.length + ")</h2>";
      if (orders.length === 0) {
        adminOrdersWrap.innerHTML += '<p class="empty-msg">Замовлень поки немає.</p>';
      } else {
        orders.forEach((o) => {
          const div = document.createElement("div");
          div.className = "order-card";
          div.innerHTML =
            "<strong>" + escapeHtml(o.customerName) + "</strong> (" + escapeHtml(o.userEmail) + ") — " + escapeHtml(o.date) + "<br>" +
            "Контакт: " + escapeHtml(o.contact) + "<br>" +
            "Адреса: " + escapeHtml(o.address) + "<br>" +
            "Товари: " + formatItems(o.items) + "<br>" +
            "Сума: <strong>" + escapeHtml(o.total) + "</strong>";
          adminOrdersWrap.appendChild(div);
        });
      }
    }
  }

  // Підказка при додаванні товару в кошик
  if (typeof addToCart === "function") {
    const origAddToCart = addToCart;
    addToCart = function patchedAddToCart(productId) {
      origAddToCart(productId);
      showToast("Товар додано в кошик");
    };
  }

  document.getElementById("btnProfile")?.addEventListener("click", renderOrderLists);
  document.getElementById("btnAdmin")?.addEventListener("click", renderOrderLists);
  renderOrderLists();
})();
(function setupEmailOrderNotification() {
  const TARGET_EMAIL = "igormakarevich24@gmail.com";
  const checkoutForm = document.getElementById("checkoutForm");
  const checkoutMsg = document.getElementById("checkoutMsg");

  if (!checkoutForm) return;

  checkoutForm.addEventListener("submit", () => {
    setTimeout(() => {
      if (!TARGET_EMAIL || TARGET_EMAIL.includes("ТВОЯ_ПОШТА")) return;

      const nameVal = document.getElementById("orderCustomerName")?.value || "";
      const contactVal = document.getElementById("orderContact")?.value || "";
      const addressVal = document.getElementById("orderAddress")?.value || "";

      const payload = {
        _subject: "Нове замовлення з магазину",
        Імя_покупця: nameVal,
        Контакт: contactVal,
        Адреса_доставки: addressVal,
        Час: new Date().toLocaleString("uk-UA")
      };

      fetch("https://formsubmit.co/ajax/" + encodeURIComponent(TARGET_EMAIL), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify(payload)
      })
        .then((res) => res.json())
        .then(() => {
          if (checkoutMsg) {
            checkoutMsg.textContent += " (Дані відправлено на пошту)";
          }
        })
        .catch(() => {});
    }, 100);
  });
})();
(function ensureCustomerFieldsInOrdersAndEmail() {
  const form = document.getElementById("checkoutForm");
  if (!form) return;

  let lastCustomerData = { name: "", contact: "", address: "" };

  form.addEventListener("submit", () => {
    lastCustomerData = {
      name: (document.getElementById("orderCustomerName")?.value || "").trim(),
      contact: (document.getElementById("orderContact")?.value || "").trim(),
      address: (document.getElementById("orderAddress")?.value || "").trim()
    };

    setTimeout(() => {
      const cards = document.querySelectorAll(".order-card");
      cards.forEach((card) => {
        const text = card.textContent || "";
        if (!text.includes("Адреса:") && lastCustomerData.address) {
          const extra = document.createElement("div");
          extra.innerHTML =
            "Ім'я: <strong>" + escapeHtml(lastCustomerData.name || "—") + "</strong><br>" +
            "Контакт: <strong>" + escapeHtml(lastCustomerData.contact || "—") + "</strong><br>" +
            "Адреса: <strong>" + escapeHtml(lastCustomerData.address || "—") + "</strong>";
          card.appendChild(extra);
        }
      });
    }, 80);
  });

  const origFetch = window.fetch.bind(window);
  window.fetch = function patchedFetch(input, init) {
    try {
      if (typeof input === "string" && input.includes("formsubmit.co") && init && typeof init.body === "string") {
        const parsed = JSON.parse(init.body);
        if (lastCustomerData.name) parsed["Імя_покупця"] = lastCustomerData.name;
        if (lastCustomerData.contact) parsed["Контакт"] = lastCustomerData.contact;
        if (lastCustomerData.address) parsed["Адреса_доставки"] = lastCustomerData.address;
        init = { ...init, body: JSON.stringify(parsed) };
      }
    } catch {}
    return origFetch(input, init);
  };
})();
(function directOrderEmailSender() {
  const FALLBACK_EMAIL = "igormakarevich24@gmail.com";
  const form = document.getElementById("checkoutForm");
  const msgEl = document.getElementById("checkoutMsg");

  if (!form) return;

  form.addEventListener("submit", () => {
    const customerName = (document.getElementById("orderCustomerName")?.value || "").trim();
    const contact = (document.getElementById("orderContact")?.value || "").trim();
    const address = (document.getElementById("orderAddress")?.value || "").trim();

    const emailToUse =
      typeof TARGET_EMAIL === "string" && TARGET_EMAIL.includes("@") && !TARGET_EMAIL.includes("ТВОЯ_ПОШТА")
        ? TARGET_EMAIL.trim()
        : FALLBACK_EMAIL;

    const formData = new FormData();
    formData.append("_subject", "Нове замовлення з магазину");
    formData.append("_captcha", "false");
    formData.append("Імя покупця", customerName || "Не вказано");
    formData.append("Контакт", contact || "Не вказано");
    formData.append("Адреса доставки", address || "Не вказано");
    formData.append("Час", new Date().toLocaleString("uk-UA"));

    fetch("https://formsubmit.co/" + encodeURIComponent(emailToUse), {
      method: "POST",
      body: formData
    })
      .then((res) => {
        if (!msgEl) return;
        if (res.ok) {
          msgEl.textContent =
            "Замовлення оформлено й відправлено на пошту (" + emailToUse + "). Якщо це перший раз — підтвердь лист на пошті.";
        } else {
          msgEl.textContent =
            "Замовлення збережено на сайті, але поштовий сервіс відповів кодом " + res.status + ".";
        }
      })
      .catch(() => {
        if (msgEl) {
          msgEl.textContent =
            "Замовлення збережено на сайті, але не вдалося з'єднатися з сервісом пошти (перевір інтернет або відкрий через сервер/посилання).";
        }
      });
  });
})();
(function orderEmailWithItemsAndDetails() {
  const TARGET_EMAIL = "igormakarevich24@gmail.com";
  const form = document.getElementById("checkoutForm");
  const msgEl = document.getElementById("checkoutMsg");

  if (!form) return;

  function collectCartSnapshot() {
    if (Array.isArray(window.cart) && window.cart.length > 0) {
      return window.cart
        .map((item) => {
          const name = item.name || item.title || "Товар";
          const qty = item.qty || item.count || 1;
          const price = item.price !== undefined ? ` (${item.price})` : "";
          return `${name} × ${qty}${price}`;
        })
        .join(", ");
    }

    const domItems = Array.from(document.querySelectorAll("#cartList .cart-item, #cartList .card, #cartList li"));
    if (domItems.length > 0) {
      return domItems
        .map((el) => el.textContent.replace(/\s+/g, " ").trim())
        .filter(Boolean)
        .join(" | ");
    }

    return "Кошик порожній або дані вже очищено";
  }

  function collectTotalSnapshot() {
    const totalEl = document.getElementById("cartTotal");
    if (totalEl && totalEl.textContent.trim()) {
      return totalEl.textContent.trim();
    }
    if (Array.isArray(window.cart) && window.cart.length > 0) {
      const sum = window.cart.reduce(
        (acc, item) => acc + (Number(item.price) || 0) * (Number(item.qty) || Number(item.count) || 1),
        0
      );
      return sum > 0 ? String(sum) : "Не вказано";
    }
    return "Не вказано";
  }

  form.addEventListener("submit", () => {
    const customerName = (document.getElementById("orderCustomerName")?.value || "").trim();
    const contact = (document.getElementById("orderContact")?.value || "").trim();
    const address = (document.getElementById("orderAddress")?.value || "").trim();
    const orderedItems = collectCartSnapshot();
    const totalSum = collectTotalSnapshot();

    const formData = new FormData();
    formData.append("_subject", "Нове замовлення з магазину");
    formData.append("_captcha", "false");
    formData.append("Імя покупця", customerName || "Не вказано");
    formData.append("Контакт", contact || "Не вказано");
    formData.append("Адреса доставки", address || "Не вказано");
    formData.append("Замовлені товари", orderedItems);
    formData.append("Сума", totalSum);
    formData.append("Час", new Date().toLocaleString("uk-UA"));

    fetch("https://formsubmit.co/" + encodeURIComponent(TARGET_EMAIL), {
      method: "POST",
      body: formData
    })
      .then((res) => {
        if (!msgEl) return;
        if (res.ok) {
          msgEl.textContent = "Замовлення оформлено! Деталі й товари відправлено на пошту.";
        } else {
          msgEl.textContent = "Замовлення збережено, але сервіс пошти повернув статус " + res.status + ".";
        }
      })
      .catch(() => {
        if (msgEl) {
          msgEl.textContent = "Замовлення збережено, але сталася помилка при відправці на пошту.";
        }
      });
  });
})();
(function reliableOrderEmailSender() {
  const TARGET_EMAIL = "igormakarevich24@gmail.com";
  const form = document.getElementById("checkoutForm");
  const msgEl = document.getElementById("checkoutMsg");

  if (!form) return;

  let cachedCustomer = { name: "", contact: "", address: "" };
  let cachedItemsText = "";
  let cachedTotalText = "";

  function readFieldsNow() {
    const nameEl =
      document.getElementById("orderCustomerName") ||
      form.querySelector('input[type="text"]');
    const contactEl =
      document.getElementById("orderContact") ||
      form.querySelectorAll('input[type="text"]')[1];
    const addressEl =
      document.getElementById("orderAddress") ||
      form.querySelector("textarea, input:last-of-type");

    const n = nameEl ? String(nameEl.value || "").trim() : "";
    const c = contactEl ? String(contactEl.value || "").trim() : "";
    const a = addressEl ? String(addressEl.value || "").trim() : "";

    if (n) cachedCustomer.name = n;
    if (c) cachedCustomer.contact = c;
    if (a) cachedCustomer.address = a;

    return {
      name: n || cachedCustomer.name || "Не вказано",
      contact: c || cachedCustomer.contact || "Не вказано",
      address: a || cachedCustomer.address || "Не вказано"
    };
  }

  function readCartNow() {
    let list = [];
    if (Array.isArray(window.cart) && window.cart.length > 0) {
      list = window.cart;
    } else {
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i) || "";
          if (k.toLowerCase().includes("cart")) {
            const parsed = JSON.parse(localStorage.getItem(k) || "[]");
            if (Array.isArray(parsed) && parsed.length > 0) {
              list = parsed;
              break;
            }
          }
        }
      } catch (_) {}
    }

    if (list.length > 0) {
      const formatted = list
        .map((item) => {
          const title = item.name || item.title || "Товар";
          const qty = item.qty || item.count || 1;
          const price = item.price !== undefined ? ` — ${item.price}` : "";
          return `${title} × ${qty}${price}`;
        })
        .join(", ");
      cachedItemsText = formatted;
      return formatted;
    }

    const domNodes = Array.from(
      document.querySelectorAll("#cartList .cart-item, #cartList .card, #cartList > div, #cartList > li")
    );
    if (domNodes.length > 0) {
      const domText = domNodes
        .map((el) => el.textContent.replace(/\s+/g, " ").trim())
        .filter(Boolean)
        .join(" | ");
      if (domText) {
        cachedItemsText = domText;
        return domText;
      }
    }

    return cachedItemsText || "Не вдалося визначити список товарів";
  }

  function readTotalNow() {
    const totalEl = document.getElementById("cartTotal");
    const txt = totalEl ? totalEl.textContent.trim() : "";
    if (txt && txt !== "0") {
      cachedTotalText = txt;
      return txt;
    }
    return cachedTotalText || "Не вказано";
  }

  // Запоминаем данные и товары пока пользователь печатает / добавляет в корзину
  form.addEventListener("input", readFieldsNow, true);
  form.addEventListener("change", readFieldsNow, true);
  document.addEventListener("click", () => {
    setTimeout(() => {
      readCartNow();
      readTotalNow();
    }, 30);
  }, true);

  function sendOrderEmail() {
    const customer = readFieldsNow();
    const items = readCartNow();
    const total = readTotalNow();

    const formData = new FormData();
    formData.append("_subject", "Нове замовлення з магазину");
    formData.append("_captcha", "false");
    formData.append("Імя покупця", customer.name);
    formData.append("Контакт", customer.contact);
    formData.append("Адреса доставки", customer.address);
    formData.append("Замовлені товари", items);
    formData.append("Сума", total);
    formData.append("Час", new Date().toLocaleString("uk-UA"));

    fetch("https://formsubmit.co/" + encodeURIComponent(TARGET_EMAIL), {
      method: "POST",
      body: formData
    })
      .then((res) => {
        if (!msgEl) return;
        msgEl.textContent = res.ok
          ? "Замовлення оформлено та надіслано на пошту!"
          : "Замовлення збережено, але поштовий сервіс повернув помилку " + res.status + ".";
      })
      .catch(() => {
        if (msgEl) {
          msgEl.textContent = "Замовлення збережено, але не вдалося відправити лист (перевір мережу).";
        }
      });
  }

  // Срабатывает первым на фазе capture до сброса формы
  form.addEventListener("submit", sendOrderEmail, { capture: true });
  const submitBtn = form.querySelector('button[type="submit"], button');
  if (submitBtn) {
    submitBtn.addEventListener("pointerdown", () => {
      readFieldsNow();
      readCartNow();
      readTotalNow();
    }, { capture: true });
  }
})();
