/* =========================================================
   FARM AUTOMATION APP - CORE LOGIC
   Developer: CHRISOSTIVE JASON
   ========================================================= */

// APP STATE
let selectedFundType = "normal";
let pendingWDType = null;
let selectedRole = null;
let currentUser = null;
let usersTempUsername = "";

// USERS STORAGE INITIALIZATION
let users = JSON.parse(localStorage.getItem("users")) || [
  { username: "Jason", password: "14533", role: "admin", senior: true, protected: true }
];

// LOGIN RECORDS
let records = JSON.parse(localStorage.getItem("records")) || [];

// FARMS & DATA STRUCTURE
let farms = JSON.parse(localStorage.getItem("farms")) || ["Farm 1", "Farm 2"];
let farmData = JSON.parse(localStorage.getItem("farmData")) || {
  oneacre: {},
  normal: {}
};

// Ensure fund keys exist
if (!farmData.oneacre) farmData.oneacre = {};
if (!farmData.normal) farmData.normal = {};

function initFarmDataStructure(fundType, farmName) {
  if (!farmData[fundType]) farmData[fundType] = {};
  if (!farmData[fundType][farmName]) {
    farmData[fundType][farmName] = {
      planting: { seedBags: 0, dap: 0, noPeople: 0 },
      weeding: { noPeople: 0 },
      fertilizer: { can: 0, urea: 0, noPeople: 0 },
      harvesting: { noPeople: 0, output: 0 }
    };
  }
}

// Initialize all existing farms in both fund categories
farms.forEach(f => {
  initFarmDataStructure("oneacre", f);
  initFarmDataStructure("normal", f);
});
localStorage.setItem("farms", JSON.stringify(farms));
localStorage.setItem("farmData", JSON.stringify(farmData));

// PERSIST LOGOUT ON LEAVING PAGE
window.addEventListener("beforeunload", () => {
  if (currentUser) {
    const rec = records.find(r => r.username === currentUser.username && !r.logoutTime);
    if (rec) {
      rec.logoutTime = new Date().toLocaleString();
      localStorage.setItem("records", JSON.stringify(records));
    }
  }
});

// ROLE SELECTION
function selectRole(role) {
  selectedRole = role;
  const adminBtn = document.getElementById("adminBtn");
  const userBtn = document.getElementById("userBtn");
  if (role === "admin") {
    adminBtn.classList.remove("inactive");
    userBtn.classList.add("inactive");
  } else {
    userBtn.classList.remove("inactive");
    adminBtn.classList.add("inactive");
  }
}

// PASSWORD VISIBILITY TOGGLE
function togglePassword() {
  const p = document.getElementById("password");
  p.type = p.type === "password" ? "text" : "password";
}

// LOGIN ACTION
function login() {
  const uInput = document.getElementById("username");
  const pInput = document.getElementById("password");
  const feedback = document.getElementById("feedback");

  const u = uInput.value.trim();
  const p = pInput.value.trim();

  if (!selectedRole) {
    feedback.innerText = "PLEASE SELECT ADMIN OR USER";
    return;
  }

  const found = users.find(x => x.username.toLowerCase() === u.toLowerCase());
  if (!found) {
    feedback.innerText = "INVALID USERNAME";
    return;
  }
  if (found.password !== p) {
    feedback.innerText = "WRONG PASSWORD";
    return;
  }
  if (selectedRole === "user" && found.role === "admin" && !found.senior) {
    feedback.innerText = "KINDLY USE ADMIN BUTTON";
    return;
  }
  if (selectedRole === "admin" && found.role === "user") {
    feedback.innerText = "KINDLY USE USER BUTTON";
    return;
  }

  feedback.innerText = "WELCOME " + found.username.toUpperCase();
  currentUser = found;

  // Record login history
  records.push({
    username: found.username,
    role: found.role,
    senior: !!found.senior,
    loginTime: new Date().toLocaleString(),
    logoutTime: null
  });
  localStorage.setItem("records", JSON.stringify(records));

  showDashboard();
}

// SHOW DASHBOARD VIEW
function showDashboard() {
  document.getElementById("loginPage").style.display = "none";
  const dash = document.getElementById("dashboardPage");
  dash.style.display = "flex";

  // Set role display
  let roleText = "USER 👤";
  if (currentUser.senior) roleText = "SENIOR ADMINISTRATOR 👑🛡";
  else if (currentUser.role === "admin") roleText = "ADMINISTRATOR 🛡";

  document.getElementById("roleDisplay").innerText = roleText;
  document.getElementById("welcomeUser").innerText = "WELCOME " + currentUser.username.toUpperCase();
  document.getElementById("loginTime").innerText = "LOGIN: " + new Date().toLocaleTimeString();

  updateNetworkDash();
  loadWallpaper();

  // Trigger sequential smooth entrance animations
  setTimeout(() => dash.classList.add("active"), 50);
  setTimeout(() => {
    const sb = document.querySelector(".sidebar");
    if (sb) sb.classList.add("active");
  }, 200);
  setTimeout(() => {
    const hr = document.querySelector(".header-row");
    if (hr) hr.classList.add("active");
  }, 350);
  setTimeout(() => {
    const wd = document.querySelector(".wd-area");
    if (wd) wd.classList.add("active");
  }, 500);
}

// LOGOUT ACTION
function logout() {
  if (currentUser) {
    const rec = records.find(r => r.username === currentUser.username && !r.logoutTime);
    if (rec) {
      rec.logoutTime = new Date().toLocaleString();
      localStorage.setItem("records", JSON.stringify(records));
    }
  }

  const dash = document.getElementById("dashboardPage");
  dash.classList.remove("active");
  dash.style.display = "none";

  const sb = document.querySelector(".sidebar");
  if (sb) sb.classList.remove("active");
  const hr = document.querySelector(".header-row");
  if (hr) hr.classList.remove("active");
  const wd = document.querySelector(".wd-area");
  if (wd) wd.classList.remove("active");

  document.getElementById("loginPage").style.display = "block";

  currentUser = null;
  selectedRole = null;
  document.getElementById("username").value = "";
  document.getElementById("password").value = "";
  document.getElementById("feedback").innerText = "";
  document.getElementById("adminBtn").classList.remove("inactive");
  document.getElementById("userBtn").classList.remove("inactive");

  // Close any open dialogues/modals
  closeMenu();
  closeWDDialogue();
  closeFundDialog();
  closeDialog();
}

// ---------------------------------------------------------
// WORKSPACE (WD) DIALOGUES & DATA TABLES
// ---------------------------------------------------------
function openWDDialogue(type) {
  pendingWDType = type;
  document.getElementById("fundDialog").style.display = "block";
}

function selectFund(fund) {
  selectedFundType = fund;
  document.getElementById("fundDialog").style.display = "none";
  loadWDTable(pendingWDType);
}

function closeFundDialog() {
  document.getElementById("fundDialog").style.display = "none";
  pendingWDType = null;
}

function closeWDDialogue() {
  document.getElementById("wdDialogue").style.display = "none";
}

function loadWDTable(type) {
  if (!type) return;
  const dialogue = document.getElementById("wdDialogue");
  const container = document.getElementById("wdTableContainer");

  dialogue.style.display = "block";
  dialogue.style.background = selectedFundType === "oneacre" ? "#1e3a24" : "#142850";

  if (!farmData[selectedFundType]) farmData[selectedFundType] = {};

  let fundTitle = selectedFundType === "oneacre" ? "ONE ACRE FUND" : "NORMAL FUND";
  let html = `
    <div style="text-align:center; margin-bottom:15px;">
      <h2 style="margin:0; color:#ffd700;">${type.toUpperCase()} RECORDS</h2>
      <span style="font-size:14px; color:#90caf9;">Category: ${fundTitle}</span>
    </div>
    <table>
      <thead>
        <tr>
  `;

  switch (type) {
    case "planting":
      html += `<th>Farm</th><th>Seed Bags</th><th>DAP (Bags)</th><th>No. People</th>`;
      break;
    case "weeding":
      html += `<th>Farm</th><th>No. People</th>`;
      break;
    case "fertilizer":
      html += `<th>Farm</th><th>CAN (Bags)</th><th>UREA (Bags)</th><th>No. People</th>`;
      break;
    case "harvesting":
      html += `<th>Farm</th><th>No. People</th><th>Output (Bags/Kg)</th>`;
      break;
  }

  html += `</tr></thead><tbody>`;

  farms.forEach(farm => {
    initFarmDataStructure(selectedFundType, farm);
    html += `<tr><td style="font-weight:bold; color:#ffd700;">${farm}</td>`;

    const metrics = farmData[selectedFundType][farm][type] || {};
    Object.keys(metrics).forEach(key => {
      html += editableCellFund(farm, type, key, metrics[key]);
    });
    html += `</tr>`;
  });

  html += `</tbody></table>`;
  container.innerHTML = html;
  localStorage.setItem("farmData", JSON.stringify(farmData));
}

function editableCellFund(farm, type, key, val) {
  const displayVal = (val !== undefined && val !== null) ? val : 0;
  const canEdit = currentUser && (currentUser.senior || currentUser.role === "admin");

  if (canEdit) {
    return `<td contenteditable="true" 
                title="Click to edit value"
                onblur="saveCellData('${farm}','${type}','${key}', this.innerText)">${displayVal}</td>`;
  }
  return `<td>${displayVal}</td>`;
}

function saveCellData(farm, type, key, textVal) {
  const parsed = parseFloat(textVal.trim());
  const num = isNaN(parsed) ? 0 : parsed;

  initFarmDataStructure(selectedFundType, farm);
  farmData[selectedFundType][farm][type][key] = num;
  localStorage.setItem("farmData", JSON.stringify(farmData));
}

// ---------------------------------------------------------
// ADD & REMOVE FARMS
// ---------------------------------------------------------
function addFarm() {
  if (!currentUser || (currentUser.role !== "admin" && !currentUser.senior)) {
    alert("Only Administrators can add new farms.");
    return;
  }

  const content = document.getElementById("menuContent");
  const menuBox = document.getElementById("menuBox");
  document.getElementById("menuTitle").innerText = "Add New Farm";

  content.innerHTML = `
    <div style="text-align:center;">
      <h3 style="color:#ffd700;">Add New Farm 🌱</h3>
      <p>Enter the name of the new farm:</p>
      <input type="text" id="newFarmName" placeholder="e.g. Farm 3" style="text-align:center;">
      <div>
        <button onclick="addFarmStep2()">Save Farm</button>
      </div>
    </div>
  `;

  menuBox.style.display = "block";
  document.getElementById("newFarmName").focus();
}

function addFarmStep2() {
  const input = document.getElementById("newFarmName");
  if (!input) return;
  const newFarm = input.value.trim();

  if (!newFarm) {
    alert("Please enter a farm name.");
    return;
  }
  if (farms.some(f => f.toLowerCase() === newFarm.toLowerCase())) {
    alert("A farm with this name already exists.");
    return;
  }

  farms.push(newFarm);
  initFarmDataStructure("oneacre", newFarm);
  initFarmDataStructure("normal", newFarm);

  localStorage.setItem("farms", JSON.stringify(farms));
  localStorage.setItem("farmData", JSON.stringify(farmData));

  const content = document.getElementById("menuContent");
  content.innerHTML = `
    <div style="text-align:center;">
      <h3 style="color:#4caf50;">✅ Farm Added Successfully!</h3>
      <p style="font-size:18px; font-weight:bold;">${newFarm}</p>
      <button onclick="closeMenu()">Done</button>
    </div>
  `;
}

function removeFarm() {
  if (!currentUser || (currentUser.role !== "admin" && !currentUser.senior)) {
    alert("Only Administrators can remove farms.");
    return;
  }

  const content = document.getElementById("menuContent");
  const menuBox = document.getElementById("menuBox");
  document.getElementById("menuTitle").innerText = "Remove Farm";

  let farmOptions = farms.map(f => `<option value="${f}">${f}</option>`).join("");
  content.innerHTML = `
    <div style="text-align:center;">
      <h3 style="color:#ff5252;">Remove Farm ❌</h3>
      <p>Select farm to remove permanently:</p>
      <select id="farmToRemove">
        <option value="" disabled selected>-- Select Farm --</option>
        ${farmOptions}
      </select>
      <div>
        <button onclick="removeFarmStep2()" style="background:#d32f2f; color:white;">Remove</button>
      </div>
    </div>
  `;

  menuBox.style.display = "block";
}

function removeFarmStep2() {
  const select = document.getElementById("farmToRemove");
  if (!select) return;
  const farmName = select.value;

  if (!farmName) {
    alert("Please select a farm to remove.");
    return;
  }

  if (!confirm(`Are you sure you want to remove "${farmName}"? This will delete its records.`)) {
    return;
  }

  farms = farms.filter(f => f !== farmName);
  if (farmData.oneacre) delete farmData.oneacre[farmName];
  if (farmData.normal) delete farmData.normal[farmName];

  localStorage.setItem("farms", JSON.stringify(farms));
  localStorage.setItem("farmData", JSON.stringify(farmData));

  const content = document.getElementById("menuContent");
  content.innerHTML = `
    <div style="text-align:center;">
      <h3 style="color:#4caf50;">✅ Farm Removed!</h3>
      <p>${farmName}</p>
      <button onclick="closeMenu()">Done</button>
    </div>
  `;
}

// ---------------------------------------------------------
// SIDEBAR MENUS
// ---------------------------------------------------------
function openMenu(menu) {
  const menuBox = document.getElementById("menuBox");
  const menuTitle = document.getElementById("menuTitle");
  const content = document.getElementById("menuContent");

  menuBox.style.display = "block";
  menuTitle.innerText = menu.replace(/([A-Z])/g, ' $1').trim();
  content.innerHTML = "";

  switch (menu) {
    case "userManagement": {
      if (currentUser.role === "user" && !currentUser.senior) {
        content.innerHTML = "<p style='color:#ff5252;'>ACCESS DENIED 🚫 (Admins Only)</p>";
        break;
      }

      let um = `<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <h3 style="margin:0;">User Management 👥</h3>
      </div>`;

      um += `<div style="margin-bottom:14px; display:flex; gap:8px;">`;
      if (currentUser.role === "admin" || currentUser.senior) {
        um += `<button class="menu-action-btn" type="button" onclick="startAddUser()">➕ Add User</button>`;
      }
      if (currentUser.senior) {
        um += `<button class="menu-action-btn" type="button" style="background:#388e3c !important;" onclick="openProtectDialog()">🔒 Protection</button>`;
      }
      um += `</div>`;

      um += `<div id="userList"></div>`;
      content.innerHTML = um;
      renderUserList();
      break;
    }

    case "statistics": {
      if (!currentUser.senior && currentUser.role !== "admin") {
        content.innerHTML = "<p style='color:#ff5252;'>ACCESS DENIED 🚫</p>";
        break;
      }

      let stats = `<h3>Login & Activity Records 📊</h3>`;
      if (records.length === 0) {
        stats += `<p style="color:#90caf9;">No login records recorded yet.</p>`;
      } else {
        stats += `<div style="max-height:260px; overflow-y:auto; font-size:13px; line-height:1.6;">`;
        records.slice().reverse().forEach(r => {
          let status = r.logoutTime ? `<span style="color:#90caf9;">Out: ${r.logoutTime}</span>` : `<span style="color:#4caf50; font-weight:bold;">ACTIVE</span>`;
          stats += `<div style="padding:6px; border-bottom:1px solid #263238;">
            <b>${r.username}</b> (${r.role})<br>
            In: ${r.loginTime} | ${status}
          </div>`;
        });
        stats += `</div>`;
      }

      if (currentUser.senior) {
        stats += `<div style="margin-top:15px; text-align:center;">
          <button onclick="clearRecords()" style="background:#d32f2f; color:white;">Clear All Records</button>
        </div>`;
      }
      content.innerHTML = stats;
      break;
    }

    case "settings": {
      const isNotif = localStorage.getItem("notificationsEnabled") === "true";
      content.innerHTML = `
        <h3>Application Settings ⚙️</h3>
        <div style="margin-top:15px; display:flex; align-items:center; gap:10px;">
          <input type="checkbox" id="notifyToggle" style="width:auto; cursor:pointer;" 
                 ${isNotif ? "checked" : ""} 
                 onchange="toggleNotifications(this.checked)">
          <label for="notifyToggle" style="cursor:pointer;">Enable System Notifications</label>
        </div>
        <p style="font-size:12px; color:#90caf9; margin-top:8px;">
          Preference is saved automatically to your device.
        </p>
      `;
      break;
    }

    case "passwordPolicies": {
      content.innerHTML = `
        <h3>Security & Password Policies 🔑</h3>
        <div style="font-size:14px; line-height:1.6; color:#e0e6ed;">
          <p>✔ <b>Minimum Length:</b> Passwords must be at least 4 characters long.</p>
          <p>✔ <b>Protection:</b> Protected accounts cannot be removed by standard administrators.</p>
          <p>✔ <b>Role Access:</b> Only Senior Administrators can promote/demote or clear historical logs.</p>
          <p>✔ <b>Credential Privacy:</b> Cleartext passwords are kept strictly confidential.</p>
        </div>
        <p style="margin-top:15px; text-align:center; color:#ffd700; font-size:13px;">
          To change your own password, use the <b>Change Password</b> option.
        </p>
      `;
      break;
    }

    case "wallpapers": {
      const wallpaperOptions = [
        "https://images.pexels.com/photos/459225/pexels-photo-459225.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        "https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        "https://images.pexels.com/photos/163038/farm-tractor-harvest-field-163038.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        "https://images.pexels.com/photos/158607/cow-cattle-farm-barn-158607.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        "https://images.pexels.com/photos/414171/pexels-photo-414171.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        "https://images.pexels.com/photos/247932/pexels-photo-247932.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        "https://images.pexels.com/photos/34950/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        "https://images.pexels.com/photos/66507/pexels-photo-66507.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        "https://images.pexels.com/photos/675951/pexels-photo-675951.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        "https://images.pexels.com/photos/459218/pexels-photo-459218.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        "https://images.pexels.com/photos/132014/pexels-photo-132014.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        "https://images.pexels.com/photos/442184/pexels-photo-442184.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        "https://images.pexels.com/photos/372882/pexels-photo-372882.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        "https://images.pexels.com/photos/167154/farm-fields-wheat-harvest.jpg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        "https://images.pexels.com/photos/326055/pexels-photo-326055.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        "https://images.pexels.com/photos/2441066/pexels-photo-2441066.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        "https://images.pexels.com/photos/4488166/pexels-photo-4488166.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        "https://images.pexels.com/photos/197450/pexels-photo-197450.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        "https://images.pexels.com/photos/7752018/pexels-photo-7752018.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        "https://images.pexels.com/photos/2132180/pexels-photo-2132180.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
      ];

      let wallHTML = `
        <h3 style="text-align:center;">Choose Wallpaper 🖼</h3>
        <p style="text-align:center; font-size:12px; color:#90caf9;">Click an image to set your workspace background</p>
        <div class="wallpaper-gallery">
      `;
      wallpaperOptions.forEach((url, idx) => {
        wallHTML += `
          <img src="${url}" 
               loading="lazy"
               onclick="setWallpaper('${url}')" 
               title="Wallpaper ${idx + 1}" 
               class="wallpaper-thumb" 
               alt="Wallpaper ${idx + 1}">
        `;
      });
      wallHTML += `</div>`;
      content.innerHTML = wallHTML;
      break;
    }

    case "changePassword": {
      content.innerHTML = `
        <h3>Change Password ✏️</h3>
        <p>Enter Current Password:</p>
        <input type="password" id="currentPwd" placeholder="Current Password">
        <button type="button" onclick="verifyCurrentPassword()">Next</button>
      `;
      setTimeout(() => {
        const cp = document.getElementById("currentPwd");
        if (cp) cp.focus();
      }, 50);
      break;
    }

    default:
      content.innerHTML = "<p>Menu not found</p>";
  }
}

function closeMenu() {
  document.getElementById("menuBox").style.display = "none";
}

// ---------------------------------------------------------
// USER MANAGEMENT & PROTECTION
// ---------------------------------------------------------
function renderUserList() {
  const listDiv = document.getElementById("userList");
  if (!listDiv) return;
  listDiv.innerHTML = "";

  users.forEach((u, i) => {
    let badge = u.senior ? " 👑 (Senior)" : (u.protected ? " 🔒 (Protected)" : "");

    const userRow = document.createElement("div");
    userRow.style.display = "flex";
    userRow.style.justifyContent = "space-between";
    userRow.style.alignItems = "center";
    userRow.style.padding = "8px 12px";
    userRow.style.marginBottom = "6px";
    userRow.style.borderRadius = "10px";
    userRow.style.background = "#0d1b2a";
    userRow.style.color = "white";

    const userInfo = document.createElement("span");
    userInfo.innerText = `${u.username} (${u.role.toUpperCase()})${badge}`;

    const btnContainer = document.createElement("div");
    btnContainer.style.display = "flex";
    btnContainer.style.gap = "6px";

    // Remove button
    if ((currentUser.senior || currentUser.role === "admin") && !u.senior) {
      const removeBtn = document.createElement("button");
      removeBtn.innerHTML = "🗑 Remove";
      removeBtn.style.background = "#d32f2f";
      removeBtn.style.color = "white";
      removeBtn.style.padding = "4px 8px";
      removeBtn.style.fontSize = "12px";
      removeBtn.onclick = () => {
        if (u.protected && !currentUser.senior) {
          alert("Cannot remove protected user. Restricted by Senior Admin.");
          return;
        }
        if (confirm(`Remove user "${u.username}"?`)) {
          users.splice(i, 1);
          localStorage.setItem("users", JSON.stringify(users));
          renderUserList();
        }
      };
      btnContainer.appendChild(removeBtn);
    }

    // Promote / Demote button
    if (currentUser.senior && !u.senior) {
      const promoBtn = document.createElement("button");
      promoBtn.innerHTML = u.role === "user" ? "⭐ Promote" : "⬇ Demote";
      promoBtn.style.background = "#1976d2";
      promoBtn.style.color = "white";
      promoBtn.style.padding = "4px 8px";
      promoBtn.style.fontSize = "12px";
      promoBtn.onclick = () => {
        u.role = (u.role === "user") ? "admin" : "user";
        localStorage.setItem("users", JSON.stringify(users));
        renderUserList();
      };
      btnContainer.appendChild(promoBtn);
    }

    userRow.appendChild(userInfo);
    userRow.appendChild(btnContainer);
    listDiv.appendChild(userRow);
  });
}

function startAddUser() {
  const content = document.getElementById("menuContent");
  content.innerHTML = `
    <h3>Add New User 👤</h3>
    <div class="step-box">
      <label>Enter Username:</label>
      <input id="newUserStep" placeholder="Username" autocomplete="off">
      <button type="button" onclick="addUserStep2()">Next ➡</button>
    </div>
  `;
  setTimeout(() => {
    const el = document.getElementById("newUserStep");
    if (el) el.focus();
  }, 50);
}

function addUserStep2() {
  const uInput = document.getElementById("newUserStep");
  if (!uInput) return;
  const username = uInput.value.trim();

  if (!username) {
    alert("Username is required.");
    return;
  }
  if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
    alert("User already exists.");
    return;
  }

  usersTempUsername = username;
  const content = document.getElementById("menuContent");

  content.innerHTML = `
    <h3>Add New User 👤</h3>
    <div class="step-box">
      <label>Set Password for <b>${username}</b>:</label>
      <input id="newPassStep" type="password" placeholder="Password">
      <button type="button" onclick="finalizeAddUser()">✅ Create User</button>
    </div>
  `;
  setTimeout(() => {
    const el = document.getElementById("newPassStep");
    if (el) el.focus();
  }, 50);
}

function finalizeAddUser() {
  const pInput = document.getElementById("newPassStep");
  if (!pInput) return;
  const password = pInput.value.trim();

  if (!password) {
    alert("Password is required.");
    return;
  }

  users.push({
    username: usersTempUsername,
    password: password,
    role: "user",
    senior: false,
    protected: false
  });

  localStorage.setItem("users", JSON.stringify(users));
  alert(`User "${usersTempUsername}" added successfully ✅`);
  openMenu("userManagement");
}

function openProtectDialog() {
  const content = document.getElementById("menuContent");
  content.innerHTML = `
    <h3>Protect / Unprotect Users 🔒</h3>
    <p style="font-size:13px; color:#90caf9;">Click a user to toggle protection status.</p>
    <div id="protectDialog" class="protect-dialog"></div>
    <div style="margin-top:15px; text-align:center;">
      <button onclick="openMenu('userManagement')">Done</button>
    </div>
  `;

  const protectDialog = document.getElementById("protectDialog");
  users.forEach(u => {
    const p = document.createElement("p");
    p.className = u.protected ? "protected" : "";
    p.innerText = `${u.username} (${u.role.toUpperCase()}) ${u.senior ? "👑" : ""} ${u.protected ? "🔒" : "🔓"}`;
    p.onclick = () => {
      if (u.senior) {
        alert("Senior Admin cannot be modified.");
        return;
      }
      u.protected = !u.protected;
      localStorage.setItem("users", JSON.stringify(users));
      openProtectDialog();
    };
    protectDialog.appendChild(p);
  });
}

// ---------------------------------------------------------
// PASSWORD CHANGE FLOW
// ---------------------------------------------------------
function verifyCurrentPassword() {
  const currentPwdInput = document.getElementById("currentPwd");
  if (!currentPwdInput) return;
  const currentPwd = currentPwdInput.value.trim();

  if (!currentPwd) {
    alert("Please enter current password.");
    return;
  }
  if (currentPwd !== currentUser.password) {
    alert("Incorrect current password.");
    return;
  }

  const content = document.getElementById("menuContent");
  content.innerHTML = `
    <h3>Change Password ✏️</h3>
    <p>Enter New Password:</p>
    <input type="password" id="newPwdStep" placeholder="New Password">
    <p>Confirm New Password:</p>
    <input type="password" id="confirmPwdStep" placeholder="Confirm Password">
    <button id="changePwdBtn" type="button" onclick="finalizePasswordChange()">Change Password</button>
    <div id="changePwdFeedback" style="color:lime; text-align:center; margin-top:10px;"></div>
  `;

  setTimeout(() => {
    const el = document.getElementById("newPwdStep");
    if (el) el.focus();
  }, 50);
}

function finalizePasswordChange() {
  const newPwdEl = document.getElementById("newPwdStep");
  const confirmPwdEl = document.getElementById("confirmPwdStep");
  const feedback = document.getElementById("changePwdFeedback");

  if (!newPwdEl || !confirmPwdEl) return;

  const newPwd = newPwdEl.value.trim();
  const confirmPwd = confirmPwdEl.value.trim();

  if (!newPwd || !confirmPwd) {
    feedback.innerText = "Please fill in both fields.";
    feedback.style.color = "#ff5252";
    return;
  }
  if (newPwd !== confirmPwd) {
    feedback.innerText = "Passwords do not match.";
    feedback.style.color = "#ff5252";
    return;
  }

  currentUser.password = newPwd;
  // Update in user list as well
  const uObj = users.find(x => x.username === currentUser.username);
  if (uObj) uObj.password = newPwd;

  localStorage.setItem("users", JSON.stringify(users));

  feedback.innerText = "PASSWORD CHANGED SUCCESSFULLY ✅";
  feedback.style.color = "#4caf50";

  setTimeout(() => {
    closeMenu();
  }, 1200);
}

// ---------------------------------------------------------
// SETTINGS & MISC HELPERS
// ---------------------------------------------------------
function toggleNotifications(val) {
  localStorage.setItem("notificationsEnabled", val ? "true" : "false");
}

function clearRecords() {
  if (confirm("Are you sure you want to permanently delete all login/logout records?")) {
    records = [];
    localStorage.setItem("records", JSON.stringify(records));
    openMenu("statistics");
  }
}

function setWallpaper(url) {
  const wd = document.getElementById("wdArea");
  if (wd) wd.style.backgroundImage = `url("${url}")`;
  localStorage.setItem("selectedWallpaper", url);
}

function loadWallpaper() {
  const url = localStorage.getItem("selectedWallpaper");
  const wd = document.getElementById("wdArea");
  if (url && wd) {
    wd.style.backgroundImage = `url("${url}")`;
  }
}

// ---------------------------------------------------------
// LIVE CLOCKS & NETWORK MONITORS
// ---------------------------------------------------------
function updateClock() {
  const c = document.getElementById("clock");
  if (c) c.innerText = new Date().toLocaleTimeString();
}
setInterval(updateClock, 1000);
updateClock();

function updateDashboardClock() {
  const clock = document.getElementById("dashboardClock");
  if (clock) {
    clock.innerText = new Date().toLocaleTimeString();
  }
}
setInterval(updateDashboardClock, 1000);
updateDashboardClock();

function updateNetwork() {
  const el = document.getElementById("networkStatus");
  if (el) {
    el.innerText = navigator.onLine ? "🟢 ONLINE" : "🔴 OFFLINE";
  }
}

function updateNetworkDash() {
  const el = document.getElementById("networkStatusDash");
  if (el) {
    const isOnline = navigator.onLine;
    el.innerText = isOnline ? "🟢 ONLINE" : "🔴 OFFLINE";
    el.classList.toggle("online", isOnline);
    el.classList.toggle("offline", !isOnline);
  }
}

window.addEventListener("online", () => { updateNetwork(); updateNetworkDash(); });
window.addEventListener("offline", () => { updateNetwork(); updateNetworkDash(); });
updateNetwork();
updateNetworkDash();

// FORGOT PASSWORD DIALOG
function forgotPassword() {
  document.getElementById("dialog").style.display = "block";
}
function closeDialog() {
  document.getElementById("dialog").style.display = "none";
}

// ---------------------------------------------------------
// GLOBAL ENTER KEY HANDLING
// ---------------------------------------------------------
document.addEventListener("keydown", function(e) {
  if (e.key !== "Enter") return;

  // Login inputs
  if (document.activeElement.id === "username" || document.activeElement.id === "password") {
    login();
    return;
  }

  // Add User Step 1
  if (document.activeElement.id === "newUserStep") {
    addUserStep2();
    return;
  }

  // Add User Step 2
  if (document.activeElement.id === "newPassStep") {
    finalizeAddUser();
    return;
  }

  // Change Password Step 1
  if (document.activeElement.id === "currentPwd") {
    verifyCurrentPassword();
    return;
  }

  // Change Password Step 2 (focus confirm)
  if (document.activeElement.id === "newPwdStep") {
    const confirmInput = document.getElementById("confirmPwdStep");
    if (confirmInput) confirmInput.focus();
    return;
  }

  // Change Password Step 3 (submit)
  if (document.activeElement.id === "confirmPwdStep") {
    finalizePasswordChange();
    return;
  }

  // Add Farm Step 1
  if (document.activeElement.id === "newFarmName") {
    addFarmStep2();
    return;
  }

  // Close simple dialogs on enter if active
  const dialog = document.getElementById("dialog");
  if (dialog && dialog.style.display === "block") {
    closeDialog();
  }
});

// Auto-focus username on initial load
window.addEventListener("DOMContentLoaded", () => {
  const u = document.getElementById("username");
  if (u) u.focus();
});
