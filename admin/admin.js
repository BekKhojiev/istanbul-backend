let API_BASE = "";
let API_KEY = "";
let menuData = { categories: {}, items: [] };

document.addEventListener("DOMContentLoaded", () => {
    // Check if running in Android WebView
    if (window.AndroidAdmin) {
        API_BASE = window.AndroidAdmin.getApiBaseUrl();
        API_KEY = window.AndroidAdmin.getApiKey();
    } else {
        // Fallback for browser testing
        API_BASE = "https://istanbul-backend-production.up.railway.app/api";
        API_KEY = "Istanbul2026";
    }

    // Auth
    const pinInput = document.getElementById("pin-input");
    document.getElementById("pin-submit").addEventListener("click", () => {
        const pin = pinInput.value;
        let valid = false;
        if (window.AndroidAdmin) {
            valid = window.AndroidAdmin.verifyPin(pin);
        } else {
            valid = (pin === "1024");
        }
        
        if (valid) {
            document.getElementById("pin-screen").classList.remove("active");
            document.getElementById("dashboard-screen").classList.add("active");
            loadData();
        } else {
            document.getElementById("pin-error").innerText = "Invalid PIN";
        }
    });

    document.getElementById("logout-btn").addEventListener("click", () => {
        document.getElementById("dashboard-screen").classList.remove("active");
        document.getElementById("pin-screen").classList.add("active");
        pinInput.value = "";
    });

    // Tabs
    const tabBtns = document.querySelectorAll(".tab-btn");
    tabBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            tabBtns.forEach(b => b.classList.remove("active"));
            document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
            
            btn.classList.add("active");
            document.getElementById("tab-" + btn.dataset.tab).classList.add("active");
        });
    });

    // Add buttons
    document.getElementById("add-category-btn").addEventListener("click", () => openCategoryModal());
    document.getElementById("add-item-btn").addEventListener("click", () => openItemModal());

    // Forms
    document.getElementById("item-form").addEventListener("submit", saveItem);
    document.getElementById("category-form").addEventListener("submit", saveCategory);

    // Image Upload trigger
    document.getElementById("upload-image-btn").addEventListener("click", () => {
        const itemId = document.getElementById("item-id-input").value || "temp_" + Date.now();
        document.getElementById("item-id-input").value = itemId; // ensure it has an ID
        if (window.AndroidAdmin) {
            window.AndroidAdmin.pickAndUploadImage(itemId);
        } else {
            alert("Image upload only works in the Android App.");
        }
    });
});

// Callbacks from Android Kotlin
window.onImageUploaded = function(itemId, url) {
    if (document.getElementById("item-id-input").value === itemId) {
        document.getElementById("item-image").value = url;
        alert("Image uploaded successfully!");
    }
};

window.onImageUploadFailed = function(itemId) {
    alert("Image upload failed.");
};

// API Calls
async function fetchApi(endpoint, method = "GET", body = null) {
    const options = {
        method,
        headers: {
            "Content-Type": "application/json",
            "x-admin-api-key": API_KEY
        }
    };
    if (body) options.body = JSON.stringify(body);

    try {
        const response = await fetch(API_BASE + endpoint, options);
        if (!response.ok) throw new Error("API Request Failed");
        return await response.json();
    } catch (err) {
        console.error(err);
        alert("Network error: " + err.message);
        return null;
    }
}

async function loadData() {
    const data = await fetchApi("/menu");
    if (data) {
        menuData = data;
        renderCategories();
        renderItems();
        populateCategoryDropdowns();
    }
}

// Render UI
function renderCategories() {
    const list = document.getElementById("categories-list");
    list.innerHTML = "";
    Object.values(menuData.categories).forEach(cat => {
        const div = document.createElement("div");
        div.className = "list-item";
        div.innerHTML = `
            <div class="list-item-info">
                <strong>${cat.title.EN || cat.id}</strong>
                <small>ID: ${cat.id}</small>
            </div>
            <div class="list-item-actions">
                <button class="edit-btn" onclick='openCategoryModal(${JSON.stringify(cat).replace(/'/g, "&#39;")})'>Edit</button>
                <button class="delete-btn" onclick="deleteCategory('${cat.id}')">Delete</button>
            </div>
        `;
        list.appendChild(div);
    });
}

function renderItems() {
    const list = document.getElementById("items-list");
    list.innerHTML = "";
    const filter = document.getElementById("item-category-filter").value;

    const items = filter ? menuData.items.filter(i => i.categoryId === filter) : menuData.items;

    items.forEach(item => {
        const div = document.createElement("div");
        div.className = "list-item";
        div.innerHTML = `
            <div class="list-item-info">
                <strong>${item.title.EN || item.id} <span style="color:${item.available ? 'green':'red'}">(${item.available ? 'ON':'OFF'})</span></strong>
                <small>${item.categoryId} - $${item.price}</small>
            </div>
            <div class="list-item-actions">
                <button class="toggle-btn" onclick="toggleItem('${item.id}', ${!item.available})">${item.available ? 'Disable' : 'Enable'}</button>
                <button class="edit-btn" onclick='openItemModal(${JSON.stringify(item).replace(/'/g, "&#39;")})'>Edit</button>
                <button class="delete-btn" onclick="deleteItem('${item.id}')">Delete</button>
            </div>
        `;
        list.appendChild(div);
    });
}

function populateCategoryDropdowns() {
    const filterSelect = document.getElementById("item-category-filter");
    const formSelect = document.getElementById("item-category");
    
    let html = "";
    Object.values(menuData.categories).forEach(c => {
        html += `<option value="${c.id}">${c.title.EN || c.id}</option>`;
    });

    filterSelect.innerHTML = `<option value="">All Categories</option>` + html;
    formSelect.innerHTML = html;
    
    filterSelect.onchange = renderItems;
}

// Modals
function openItemModal(item = null) {
    const modal = document.getElementById("item-modal");
    document.getElementById("item-form").reset();
    document.getElementById("item-id").value = "";

    if (item) {
        document.getElementById("modal-title").innerText = "Edit Item";
        document.getElementById("item-id").value = item.id;
        document.getElementById("item-id-input").value = item.id;
        document.getElementById("item-id-input").disabled = true;
        document.getElementById("item-category").value = item.categoryId;
        document.getElementById("item-title").value = JSON.stringify(item.title, null, 2);
        document.getElementById("item-desc").value = JSON.stringify(item.description, null, 2);
        document.getElementById("item-price").value = item.price;
        document.getElementById("item-image").value = item.image;
        document.getElementById("item-available").checked = item.available;
    } else {
        document.getElementById("modal-title").innerText = "Add Item";
        document.getElementById("item-id-input").disabled = false;
        document.getElementById("item-title").value = '{\n  "EN": "",\n  "RU": "",\n  "TR": "",\n  "UZ": ""\n}';
        document.getElementById("item-desc").value = '{\n  "EN": "",\n  "RU": "",\n  "TR": "",\n  "UZ": ""\n}';
        document.getElementById("item-available").checked = true;
    }

    modal.classList.add("open");
}

function closeModal() {
    document.getElementById("item-modal").classList.remove("open");
}

function openCategoryModal(cat = null) {
    const modal = document.getElementById("category-modal");
    document.getElementById("category-form").reset();
    document.getElementById("cat-original-id").value = "";

    if (cat) {
        document.getElementById("cat-modal-title").innerText = "Edit Category";
        document.getElementById("cat-original-id").value = cat.id;
        document.getElementById("cat-id").value = cat.id;
        document.getElementById("cat-id").disabled = true;
        document.getElementById("cat-title").value = JSON.stringify(cat.title, null, 2);
    } else {
        document.getElementById("cat-modal-title").innerText = "Add Category";
        document.getElementById("cat-id").disabled = false;
        document.getElementById("cat-title").value = '{\n  "EN": "",\n  "RU": "",\n  "TR": "",\n  "UZ": ""\n}';
    }

    modal.classList.add("open");
}

function closeCategoryModal() {
    document.getElementById("category-modal").classList.remove("open");
}

// CRUD Operations
async function saveItem(e) {
    e.preventDefault();
    const isEdit = document.getElementById("item-id").value !== "";
    const id = document.getElementById("item-id-input").value;
    
    let titleJson, descJson;
    try {
        titleJson = JSON.parse(document.getElementById("item-title").value);
        descJson = JSON.parse(document.getElementById("item-desc").value);
    } catch (e) {
        alert("Invalid JSON format in Title or Description");
        return;
    }

    const payload = {
        id,
        categoryId: document.getElementById("item-category").value,
        title: titleJson,
        description: descJson,
        price: parseFloat(document.getElementById("item-price").value),
        image: document.getElementById("item-image").value,
        available: document.getElementById("item-available").checked
    };

    const res = await fetchApi(isEdit ? `/items/${id}` : "/items", isEdit ? "PUT" : "POST", payload);
    if (res) {
        closeModal();
        loadData();
    }
}

async function deleteItem(id) {
    if (confirm("Are you sure you want to delete this item?")) {
        await fetchApi(`/items/${id}`, "DELETE");
        loadData();
    }
}

async function toggleItem(id, status) {
    await fetchApi(`/items/${id}/availability`, "PUT", { available: status });
    loadData();
}

async function saveCategory(e) {
    e.preventDefault();
    const isEdit = document.getElementById("cat-original-id").value !== "";
    const id = document.getElementById("cat-id").value;
    
    let titleJson;
    try {
        titleJson = JSON.parse(document.getElementById("cat-title").value);
    } catch (e) {
        alert("Invalid JSON format in Title");
        return;
    }

    const payload = { id, title: titleJson, subtitle: {}, description: {} };

    const res = await fetchApi(isEdit ? `/categories/${id}` : "/categories", isEdit ? "PUT" : "POST", payload);
    if (res) {
        closeCategoryModal();
        loadData();
    }
}

async function deleteCategory(id) {
    if (confirm("WARNING: Deleting a category deletes all its items. Proceed?")) {
        await fetchApi(`/categories/${id}`, "DELETE");
        loadData();
    }
}
