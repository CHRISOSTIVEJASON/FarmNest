let selectedFundType = null;
let pendingWDType = null;
let selectedRole = null;
let currentUser = null;
let usersTempUsername = "";

// Auto-logout when user leaves or refreshes
window.addEventListener("beforeunload", () => {
  if(currentUser){
    const rec = records.find(r => r.username === currentUser.username && !r.logoutTime);
    if(rec){
      rec.logoutTime = new Date().toLocaleString(); // record logout time
      localStorage.setItem("records", JSON.stringify(records));
    }
  }
}); // USERS
let users = JSON.parse(localStorage.getItem("users")) || [
  { username:"Jason", password:"14533", role:"admin", senior:true, protected:true }
];

// LOGIN RECORDS
let records = JSON.parse(localStorage.getItem("records")) || [];

// FARMS & DATA
let farms = JSON.parse(localStorage.getItem("farms")) || ["Farm 1","Farm 2"];
let farmData = JSON.parse(localStorage.getItem("farmData")) || {};
farms.forEach(f => {
  if(!farmData[f]) farmData[f]={planting:{seedBags:0,dap:0,noPeople:0},weeding:{noPeople:0},fertilizer:{can:0,urea:0,noPeople:0},harvesting:{noPeople:0,output:0}};
});
localStorage.setItem("farms",JSON.stringify(farms));
localStorage.setItem("farmData",JSON.stringify(farmData));

// ROLE SELECTION
function selectRole(role){
  selectedRole = role;
  const adminBtn = document.getElementById("adminBtn");
  const userBtn = document.getElementById("userBtn");
  if(role==="admin"){ adminBtn.classList.remove("inactive"); userBtn.classList.add("inactive"); }
  else{ userBtn.classList.remove("inactive"); adminBtn.classList.add("inactive"); }
}

// PASSWORD TOGGLE
function togglePassword(){
  const p=document.getElementById("password");
  p.type = p.type==="password" ? "text":"password";
}

// LOGIN
function login(){
  const u=document.getElementById("username").value.trim();
  const p=document.getElementById("password").value.trim();
  const feedback=document.getElementById("feedback");
  if(!selectedRole){ feedback.innerText="PLEASE SELECT ADMIN OR USER"; return; }

  const found=users.find(x=>x.username===u);
  if(!found){ feedback.innerText="INVALID USERNAME"; return; }
  if(found.password!==p){ feedback.innerText="WRONG PASSWORD"; return; }
  if(selectedRole==="user" && found.role==="admin"){ feedback.innerText="KINDLY USE ADMIN BUTTON"; return; }
  if(selectedRole==="admin" && found.role==="user"){ feedback.innerText="KINDLY USE USER BUTTON"; return; }

  feedback.innerText="WELCOME "+u.toUpperCase();
  currentUser=found;

  // RECORD LOGIN
  records.push({username:u, role:found.role, loginTime:new Date().toLocaleString(), logoutTime:null});
  localStorage.setItem("records", JSON.stringify(records));

  showDashboard();
}

// SHOW DASHBOARD
function showDashboard(){
  document.getElementById("loginPage").style.display = "none";
  const dash = document.getElementById("dashboardPage");
  dash.style.display = "flex";

  // Set role and welcome info
  let roleText = "";
  if(currentUser.senior) roleText = "SENIOR ADMINISTRATOR 👑🛡";
  else if(currentUser.role === "admin") roleText = "ADMINISTRATOR 🛡";
  else roleText = "USER 👤";

  document.getElementById("roleDisplay").innerText = roleText;
  document.getElementById("welcomeUser").innerText = "WELCOME " + currentUser.username.toUpperCase();
  document.getElementById("loginTime").innerText = "LOGIN TIME: " + new Date().toLocaleTimeString();

  updateNetworkDash();
  loadWallpaper();

  // --- Trigger animations sequentially ---
  setTimeout(() => dash.classList.add("active"), 50); // fade in dashboard
  setTimeout(() => document.querySelector(".sidebar").classList.add("active"), 400); // sidebar slide
  setTimeout(() => document.querySelector(".header-row").classList.add("active"), 700); // header slide
  setTimeout(() => document.querySelector(".wd-area").classList.add("active"), 1000); // WD area fade/slide
}

function logout(){
  const rec = records.find(r => r.username === currentUser.username && !r.logoutTime);
  if(rec){ 
    rec.logoutTime = new Date().toLocaleString(); 
    localStorage.setItem("records", JSON.stringify(records)); 
  }

  // Hide dashboard and show login
  document.getElementById("dashboardPage").style.display = "none";
  document.getElementById("loginPage").style.display = "block";

  // Clear current user and inputs
  currentUser = null;
  document.getElementById("username").value = "";
  document.getElementById("password").value = "";
  selectedRole = null;
  document.getElementById("feedback").innerText = "";
  document.getElementById("adminBtn").classList.remove("inactive");
  document.getElementById("userBtn").classList.remove("inactive");

  // --- NEW FIX: Close any open modals/dialogues ---
  document.getElementById("menuBox").style.display = "none";
  document.getElementById("wdDialogue").style.display = "none";
  document.getElementById("fundDialog").style.display = "none";
  document.getElementById("dialog").style.display = "none";
}

function updateFarmData(farm,type,key,val){
  let num=parseInt(val); if(isNaN(num)) num=0;
  farmData[farm][type][key]=num;
  localStorage.setItem("farmData",JSON.stringify(farmData));
}
// WD DIALOGUES
function openWDDialogue(type){
  pendingWDType = type;
  document.getElementById("fundDialog").style.display="block";
}

function selectFund(fund){
  selectedFundType = fund;
  document.getElementById("fundDialog").style.display="none";
  loadWDTable(pendingWDType);
}

function loadWDTable(type){
  const dialogue = document.getElementById("wdDialogue");
  const container = document.getElementById("wdTableContainer");

  dialogue.style.display = "block";
  dialogue.style.background = selectedFundType === "oneacre" ? "#4caf50" : "#2196f3";

  if (!farmData[selectedFundType]) farmData[selectedFundType] = {};

  let html = "<table><tr>";
  html += `<tr><th colspan="10" style="text-decoration:underline; font-size:18px; text-align:center;">${type.toUpperCase()}</th></tr>`;

  switch(type){
    case "planting": html += "<tr><th>Farm</th><th>Seed Bags</th><th>DAP</th><th>No. People</th></tr>"; break;
    case "weeding": html += "<tr><th>Farm</th><th>No. People</th></tr>"; break;
    case "fertilizer": html += "<tr><th>Farm</th><th>CAN</th><th>UREA</th><th>No. People</th></tr>"; break;
    case "harvesting": html += "<tr><th>Farm</th><th>No. People</th><th>Output</th></tr>"; break;
  }

  farms.forEach(farm => {
    if (!farmData[selectedFundType][farm]) farmData[selectedFundType][farm] = {};
    html += `<tr><td>${farm}</td>`;
    Object.keys(farmData[farm][type]).forEach(key => {
      html += editableCellFund(farm, type, key);
    });
    html += "</tr>";
  });

  container.innerHTML = html;
  localStorage.setItem("farmData", JSON.stringify(farmData));
}

function editableCellFund(farm, type, key){
  if (!farmData[selectedFundType][farm][type])
    farmData[selectedFundType][farm][type] = {};

  const val = farmData[selectedFundType][farm][type][key] || 0;
  if (currentUser.senior)
    return `<td contenteditable onblur="farmData[selectedFundType]['${farm}']['${type}']['${key}']=parseInt(this.innerText)||0;localStorage.setItem('farmData',JSON.stringify(farmData))">${val}</td>`;
  return `<td>${val}</td>`;
}

// CLOSE WD DIALOGUE
function closeWDDialogue(){ document.getElementById("wdDialogue").style.display="none"; }

// ADD/REMOVE FARMS
function addFarm(){
  if(!currentUser || (currentUser.role!=="admin" && !currentUser.senior)){
    alert("Only Admin/Senior Admin can add farms"); 
    return; 
  }

  const content = document.getElementById("menuContent");
  const menuBox = document.getElementById("menuBox");

  // Step 1: Enter Farm Name
  content.innerHTML = `
    <div style="text-align:center; color:white;">
      <h3>Add New Farm 🌱</h3>
      <p>Enter Farm Name:</p>
      <input type="text" id="newFarmName" placeholder="Farm Name" style="padding:10px; border-radius:12px; border:none; width:80%; text-align:center;">
      <div style="margin-top:15px;">
        <button onclick="addFarmStep2()" style="padding:10px 20px; border-radius:12px; border:none; background:#2196f3; color:white; font-weight:bold; cursor:pointer;">Next</button>
      </div>
    </div>
  `;

  menuBox.style.display = "block";
  menuBox.style.background = "#1565c0"; // Blue background
}

// Step 2: Confirm and add farm
function addFarmStep2(){
  const newFarm = document.getElementById("newFarmName").value.trim();
  if(!newFarm){ alert("Enter farm name"); return; }
  if(farms.includes(newFarm)){ alert("Farm already exists"); return; }

  // Add farm to data
  farms.push(newFarm);
  farmData[newFarm] = {
    planting:{seedBags:0,dap:0,noPeople:0},
    weeding:{noPeople:0},
    fertilizer:{can:0,urea:0,noPeople:0},
    harvesting:{noPeople:0,output:0}
  };
  localStorage.setItem("farms", JSON.stringify(farms));
  localStorage.setItem("farmData", JSON.stringify(farmData));

  // Step 3: Show success message
  const content = document.getElementById("menuContent");
  content.innerHTML = `
    <div style="text-align:center; color:white;">
      <h3>✅ Farm Added Successfully!</h3>
      <p>${newFarm}</p>
      <button onclick="closeMenu()" style="padding:10px 20px; border-radius:12px; border:none; background:#2196f3; color:white; font-weight:bold; cursor:pointer;">Done</button>
    </div>
  `;
}

function removeFarm(){
  if(!currentUser || (currentUser.role!=="admin" && !currentUser.senior)){
    alert("Only Admin/Senior Admin can remove farms"); 
    return; 
  }

  const content = document.getElementById("menuContent");
  const menuBox = document.getElementById("menuBox");

  // Step 1: Select farm to remove
  let farmOptions = farms.map(f => `<option value="${f}">${f}</option>`).join("");
  content.innerHTML = `
    <div style="text-align:center; color:white;">
      <h3>Remove Farm ❌</h3>
      <p>Select Farm to Remove:</p>
      <select id="farmToRemove" style="padding:10px; border-radius:12px; border:none; width:80%; text-align:center;">
        <option value="" disabled selected>Select Farm</option>
        ${farmOptions}
      </select>
      <div style="margin-top:15px;">
        <button onclick="removeFarmStep2()" style="padding:10px 20px; border-radius:12px; border:none; background:#2196f3; color:white; font-weight:bold; cursor:pointer;">Next</button>
      </div>
    </div>
  `;

  menuBox.style.display = "block";
  menuBox.style.background = "#1565c0"; // Blue background
}

// Step 2: Confirm removal
function removeFarmStep2(){
  const farmName = document.getElementById("farmToRemove").value;
  if(!farmName){ alert("Select a farm"); return; }

  // Remove farm from arrays
  farms = farms.filter(f => f !== farmName);
  delete farmData[farmName];
  localStorage.setItem("farms", JSON.stringify(farms));
  localStorage.setItem("farmData", JSON.stringify(farmData));

  // Step 3: Show success message
  const content = document.getElementById("menuContent");
  content.innerHTML = `
    <div style="text-align:center; color:white;">
      <h3>✅ Farm Removed Successfully!</h3>
      <p>${farmName}</p>
      <button onclick="closeMenu()" style="padding:10px 20px; border-radius:12px; border:none; background:#2196f3; color:white; font-weight:bold; cursor:pointer;">Done</button>
    </div>
  `;
}

// MENU FUNCTIONALITY (NEW)
function openMenu(menu) {
  const menuBox = document.getElementById("menuBox");
  const menuTitle = document.getElementById("menuTitle");
  const content = document.getElementById("menuContent");

  menuBox.style.display = "block"; // show modal
  menuTitle.innerText = menu.replace(/([A-Z])/g, ' $1').trim(); // human-friendly title
  content.innerHTML = ""; // clear previous content

  switch(menu){
  
case "userManagement":
    if(currentUser.role==="user"){
        content.innerHTML = "<p>ACCESS DENIED 🚫</p>";
        break;
    }

    // User Management Header
    let um = `<h3>User Management 👥</h3>`;

    // Add User button (triggers successive step flow)
    if(currentUser.role==="admin" || currentUser.senior){
        um += `<button class="menu-action-btn" onclick="startAddUser()">➕ Add User</button>`;
    }

    // Protect / Unprotect button (opens focused dialogue)
    if(currentUser.senior){
        um += ` <button class="menu-action-btn" onclick="openProtectDialog()">🔒 Protect / Unprotect</button>`;
    }

    // User list container
    um += `<div id="userList" style="margin-top:15px;"></div>`;

    content.innerHTML = um;

    // Render user list with Remove / Promote buttons
    renderUserList();
    break;

    case "statistics":
      if(!currentUser.senior && currentUser.role!=="admin"){ content.innerHTML="<p>ACCESS DENIED 🚫</p>"; break;}
      let stats="<h3>Login/Logout Records 📊</h3>";
      records.forEach(r=>{
        let status = r.logoutTime ? r.logoutTime : "ACTIVE";
        stats+=`<p>${r.username} (${r.role}) - Login: ${r.loginTime} Logout: ${status}</p>`;
      });
      if(currentUser.senior) stats+="<button onclick='clearRecords()'>Clear All Records</button>";
      content.innerHTML=stats; 
      break;
case "settings":
  content.innerHTML = `
    <h3>Settings ⚙️</h3>
    <p>Notifications: 
      <input type="checkbox" id="notifyToggle" onchange="toggleNotifications(this.checked)">
    </p>
  `;
  break;
   
case "passwordPolicies":
  if(currentUser.role === "user"){
    content.innerHTML = "<p>ACCESS DENIED 🚫</p>";
    break;
  }
  
  let pwd = "<h3>Password Policies 🔑</h3>";
  users.forEach(u => { pwd += `<p>${u.username}: ${u.password}</p>` });
  content.innerHTML = pwd;
  break;
    
case "wallpapers":
  const wallpaperOptions = [
    // ↓ Add about 20 working wallpaper URLs
    "https://images.pexels.com/photos/459225/pexels-photo-459225.jpeg",
    "https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg",
    "https://images.pexels.com/photos/163038/farm-tractor-harvest-field-163038.jpeg",
    "https://images.pexels.com/photos/158607/cow-cattle-farm-barn-158607.jpeg",
    "https://images.pexels.com/photos/414171/pexels-photo-414171.jpeg",
    "https://images.pexels.com/photos/247932/pexels-photo-247932.jpeg",
    "https://unsplash.com/photos/high-angle-photography-of-seawaves-U1XzLHd4VvI",
    "https://images.pexels.com/photos/34950/pexels-photo.jpg",
    "https://unsplash.com/photos/river-stream-between-rocks-during-daytime-9LwCEYH1oW4",
    "https://images.pexels.com/photos/459225/field-wheat-sunset-farm-459225.jpeg",
    "https://images.pexels.com/photos/66507/pexels-photo-66507.jpeg",
    "https://unsplash.com/photos/landscape-photography-of-green-and-brown-mountain-7N998BynnFw",
    "https://images.pexels.com/photos/675951/pexels-photo-675951.jpeg",
    "https://images.pexels.com/photos/459218/pexels-photo-459218.jpeg",
    "https://images.pexels.com/photos/132014/pexels-photo-132014.jpeg",
    "https://images.pexels.com/photos/442184/pexels-photo-442184.jpeg",
    "https://images.pexels.com/photos/372882/pexels-photo-372882.jpeg",
    "https://images.pexels.com/photos/167154/farm-fields-wheat-harvest.jpg",
    "https://images.pexels.com/photos/326055/pexels-photo-326055.jpeg",
    "https://images.pexels.com/photos/2441066/pexels-photo-2441066.jpeg",
    "https://images.pexels.com/photos/4488166/pexels-photo-4488166.jpeg",
    "https://images.pexels.com/photos/197450/pexels-photo-197450.jpeg",
    "https://images.pexels.com/photos/7752018/pexels-photo-7752018.jpeg"
  ];

  let wallHTML = `
    <h3 style="text-align:center; color:white;">Choose Wallpaper 🖼</h3>
    <div class="wallpaper-gallery">
  `;

  wallpaperOptions.forEach((url, idx) => {
    wallHTML += `
      <img src="${url}" 
           onclick='setWallpaper("${url}")' 
           title="Wallpaper ${idx+1}" 
           class="wallpaper-thumb" />
    `;
  });

  wallHTML += `</div>`;
  content.innerHTML = wallHTML;
  break;

  case "changePassword":
  // Step 1: ask for current password
  content.innerHTML = `
    <h3>Change Password ✏️</h3>
    <p>Enter Current Password:</p>
    <input type="password" id="currentPwd" placeholder="Current Password">
    <button onclick="verifyCurrentPassword()">Next</button>
  `;
  break;  

    default: 
      content.innerHTML="<p>Menu not found</p>";
  }
}

function closeMenu() {
  const menuBox = document.getElementById("menuBox");
  menuBox.style.display = "none";
}

// USER MANAGEMENT FUNCTIONS
function renderUserList(){
  const listDiv = document.getElementById("userList");
  listDiv.innerHTML = "";

  users.forEach((u, i) => {
    let badge = u.senior ? " 👑" : (u.protected ? " 🔒" : "");
    
    // User row container
    const userRow = document.createElement("div");
    userRow.style.display = "flex";
    userRow.style.justifyContent = "space-between";
    userRow.style.alignItems = "center";
    userRow.style.padding = "6px 10px";
    userRow.style.marginBottom = "4px";
    userRow.style.borderRadius = "10px";
    userRow.style.background = "#1b2a4e"; // menu box color
    userRow.style.color = "white";

    // User info
    const userInfo = document.createElement("span");
    userInfo.innerText = `${u.username} (${u.role})${badge}`;

    // Buttons container
    const btnContainer = document.createElement("span");

    // Remove button (distinct red)
    if((currentUser.senior || currentUser.role === "admin") && !u.senior){
      const removeBtn = document.createElement("button");
      removeBtn.innerHTML = "🗑 Remove";
      removeBtn.style.background = "#d32f2f";
      removeBtn.style.color = "white";
      removeBtn.style.border = "none";
      removeBtn.style.borderRadius = "8px";
      removeBtn.style.padding = "4px 8px";
      removeBtn.style.cursor = "pointer";
      removeBtn.style.marginRight = "6px";
      removeBtn.onclick = () => {
        if(u.protected && !currentUser.senior){
          alert("Cannot remove protected user");
          return;
        }
        users.splice(i, 1);
        localStorage.setItem("users", JSON.stringify(users));
        renderUserList(); // refresh list immediately
      };
      btnContainer.appendChild(removeBtn);
    }

    // Promote / Demote button
    if(currentUser.senior && !u.senior){
      const promoBtn = document.createElement("button");
      promoBtn.innerHTML = "⭐ Promote/Demote";
      promoBtn.style.background = "#1976d2";
      promoBtn.style.color = "white";
      promoBtn.style.border = "none";
      promoBtn.style.borderRadius = "8px";
      promoBtn.style.padding = "4px 8px";
      promoBtn.style.cursor = "pointer";
      promoBtn.onclick = () => {
        u.role = (u.role === "user") ? "admin" : "user";
        localStorage.setItem("users", JSON.stringify(users));
        renderUserList();
      };
      btnContainer.appendChild(promoBtn);
    }

    // Append to row
    userRow.appendChild(userInfo);
    userRow.appendChild(btnContainer);
    listDiv.appendChild(userRow);
  });
}
function addUser(){
  if(currentUser.role==="user"){ alert("Access denied"); return; }

  const username=document.getElementById("newUser").value.trim();
  const password=document.getElementById("newPass").value.trim();
  if(!username || !password){ alert("Fill both fields"); return; }
  if(users.find(u=>u.username===username)){ alert("User exists"); return; }

  users.push({username,password,role:"user",senior:false,protected:false});
  localStorage.setItem("users",JSON.stringify(users));
  renderUserList();
}
function promoteDemote(idx){
  if(!currentUser.senior){ alert("Only Senior Admin allowed"); return; }

  const u=users[idx];
  if(u.senior) return;

  u.role = (u.role==="user") ? "admin" : "user";
  localStorage.setItem("users",JSON.stringify(users));
  renderUserList();
}
function removeUser(idx){
  const u=users[idx];

  if(u.protected && !currentUser.senior){
    alert("USER REMOVAL ACTION RESTRICTED BY SNR ADMIN");
    return;
  }

  users.splice(idx,1);
  localStorage.setItem("users",JSON.stringify(users));
  renderUserList();
}
// Show green user selection box
function showProtectDialog(){
  const dialog = document.getElementById("protectDialog");
  dialog.innerHTML = ""; // clear previous

  users.forEach((u, idx) => {
    const userRow = document.createElement("p");
    userRow.innerText = u.username + (u.protected ? " 🔒" : "");
    userRow.onclick = () => {
      u.protected = !u.protected;
      localStorage.setItem("users", JSON.stringify(users));
      renderUserList();
      showProtectDialog(); // refresh dialog after toggle
    };
    dialog.appendChild(userRow);
  });

  dialog.style.display = "flex"; // show the green dialogue
}

// CHANGE PASSWORD
function changePassword(){ const newPwd=document.getElementById("newPwd").value.trim(); if(!newPwd){ alert("Enter new password"); return;} currentUser.password=newPwd; localStorage.setItem("users",JSON.stringify(users)); alert("Password changed ✅"); }

// CLEAR RECORDS
function clearRecords(){ if(confirm("Are you sure to delete all records?")){ records=[]; localStorage.setItem("records",JSON.stringify(records)); }}

// WALLPAPER
function setWallpaper(url){ const wd=document.getElementById("wdArea"); wd.style.backgroundImage=`url(${url})`; localStorage.setItem("selectedWallpaper",url);}
function loadWallpaper(){ const url=localStorage.getItem("selectedWallpaper"); if(url){ document.getElementById("wdArea").style.backgroundImage=`url(${url})`; }}

// DASHBOARD TIME & NOTIFICATIONS
function setDashboardTime(val){ console.log("Time set:",val);}
function toggleNotifications(val){ console.log("Notifications:",val);}

// CLOCK & NETWORK
function updateClock(){ document.getElementById("clock").innerText=new Date().toLocaleTimeString()+" EAT"; }
setInterval(updateClock,1000); updateClock();
function updateNetwork(){ document.getElementById("networkStatus").innerText = navigator.onLine?"🟢 ONLINE":"🔴 OFFLINE";}
function updateNetworkDash(){ document.getElementById("networkStatusDash").innerText = navigator.onLine?"🟢 ONLINE":"🔴 OFFLINE";}
window.addEventListener("online", updateNetwork); window.addEventListener("offline", updateNetwork);
window.addEventListener("online", updateNetworkDash); window.addEventListener("offline", updateNetworkDash);
updateNetwork(); updateNetworkDash();

// DIALOG
function forgotPassword(){ document.getElementById("dialog").style.display="block"; }
function closeDialog(){ document.getElementById("dialog").style.display="none"; }
window.addEventListener("beforeunload", () => {
  if(currentUser){
    const rec = records.find(r => r.username === currentUser.username && !r.logoutTime);
    if(rec) rec.logoutTime = new Date().toLocaleString();
    localStorage.setItem("records", JSON.stringify(records));
  }
});

// Step 1: Verify current password
function verifyCurrentPassword() {
    const currentPwd = document.getElementById("currentPwd").value.trim();
    if (!currentPwd) {
        alert("Enter current password");
        return;
    }
    if (currentPwd !== currentUser.password) {
        alert("Incorrect password");
        return;
    }

    // Step 2: Enter new password
    const content = document.getElementById("menuContent");
    content.innerHTML = `
        <h3>Change Password ✏️</h3>
        <p>Enter New Password:</p>
        <input type="password" id="newPwdStep" placeholder="New Password">
        <p>Confirm New Password:</p>
        <input type="password" id="confirmPwdStep" placeholder="Confirm Password">
        <button id="changePwdBtn">Change</button>
        <div id="changePwdFeedback" style="color:lime; text-align:center; margin-top:10px;"></div>
    `;

    // Attach event listener to the new Change button
    document.getElementById("changePwdBtn").addEventListener("click", finalizePasswordChange);
}

// Step 3: Finalize password change
function finalizePasswordChange() {
    const newPwd = document.getElementById("newPwdStep").value.trim();
    const confirmPwd = document.getElementById("confirmPwdStep").value.trim();
    const feedback = document.getElementById("changePwdFeedback");

    if (!newPwd || !confirmPwd) {
        feedback.innerText = "Enter password in both fields!";
        return;
    }

    if (newPwd !== confirmPwd) {
        feedback.innerText = "Passwords do not match!";
        return;
    }

    // Update password and persist
    currentUser.password = newPwd;
    localStorage.setItem("users", JSON.stringify(users));

    // Show success feedback
    feedback.innerText = "PASSWORD CHANGED ✅";

    // Auto-close menu after 1.5s
    setTimeout(() => {
        closeMenu();
    }, 1500);
}
// Utility function to show steps with animation
function showStep(htmlContent){
  const content = document.getElementById("menuContent");

  // Remove previous step
  content.innerHTML = "";

  // Create new step container
  const stepDiv = document.createElement("div");
  stepDiv.classList.add("step-content");
  stepDiv.innerHTML = htmlContent;
  content.appendChild(stepDiv);

  // Trigger animation
  setTimeout(()=> stepDiv.classList.add("active"), 50);
}// Start Add User process (step 1)
function startAddUser(){
  showStep(`
    <p>Enter New Username:</p>
    <input type="text" id="newUserStep" placeholder="Username">
    <button onclick="addUserStep2()">Next</button>
  `);
}

// Step 2: Enter password
function addUserStep2(){
  const username = document.getElementById("newUserStep").value.trim();
  if(!username){ alert("Enter username"); return; }

  showStep(`
    <p>Enter Password for ${username}:</p>
    <input type="password" id="newPassStep" placeholder="Password">
    <button onclick="finalizeAddUser()">Add User</button>
  `);
}

// Step 3: Finalize user addition
function finalizeAddUser(){
  const username = document.getElementById("newUserStep").value.trim();
  const password = document.getElementById("newPassStep").value.trim();

  if(!username || !password){ alert("Fill both fields"); return; }
  if(users.find(u=>u.username===username)){ alert("User exists"); return; }

  users.push({username, password, role:"user", senior:false, protected:false});
  localStorage.setItem("users", JSON.stringify(users));
  alert("User added ✅");
  renderUserList();
  closeMenu();
}
function closeFundDialog(){
  document.getElementById("fundDialog").style.display = "none";
  pendingWDType = null;
}
function updateDashboardClock() {
  const clock = document.getElementById("dashboardClock");
  if(clock){
    const now = new Date();
    const h = String(now.getHours()).padStart(2,'0');
    const m = String(now.getMinutes()).padStart(2,'0');
    const s = String(now.getSeconds()).padStart(2,'0');
    clock.innerText = `${h}:${m}:${s} EAT`;
  }
}
setInterval(updateDashboardClock, 1000);
updateDashboardClock();
function showProtectDialog(){
  var dialog = document.getElementById("protectDialog");
  dialog.innerHTML = ""; // clear previous

  users.forEach(function(u, idx){
    var userRow = document.createElement("p");
    userRow.innerText = u.username + (u.protected ? " 🔒" : "");
    userRow.style.cursor = "pointer";
    userRow.style.margin = "4px 0";
    userRow.style.padding = "6px 10px";
    userRow.style.borderRadius = "12px";
    userRow.style.backgroundColor = "#2e7d32"; // green box
    userRow.style.color = "white";

    userRow.onclick = function(){
      u.protected = !u.protected;
      localStorage.setItem("users", JSON.stringify(users));
      renderUserList();
      showProtectDialog(); // refresh after toggle
    };

    dialog.appendChild(userRow);
  });

  dialog.style.display = "flex";
  dialog.style.flexDirection = "column";
  dialog.style.gap = "6px";
  dialog.style.marginTop = "8px";
}
// ----------------------------
// ENABLE ENTER KEY ACTIONS
// ----------------------------

// Trigger login on Enter key in username or password fields
document.getElementById("username").addEventListener("keypress", function(e){
  if(e.key === "Enter") login();
});
document.getElementById("password").addEventListener("keypress", function(e){
  if(e.key === "Enter") login();
});

// Allow Enter key to close dialogs
document.addEventListener("keydown", function(e){
  // Forgot Password dialog
  const dialog = document.getElementById("dialog");
  if(dialog.style.display === "block" && e.key === "Enter"){
    closeDialog();
  }

  // Fund selection dialog
  const fundDialog = document.getElementById("fundDialog");
  if(fundDialog.style.display === "block" && e.key === "Enter"){
    // Optional: default to "Normal" plan
    selectFund("normal");
  }

  // You can add other dialog Enter triggers here if needed
});

// Autofocus first input on login page for faster UX
document.getElementById("username").focus();
// ----------------------------
// ENTER KEY SUPPORT FOR MENU BOXES
// ----------------------------

// Add User Step 1: Username
document.addEventListener("keydown", function(e){
  const newUserStep = document.getElementById("newUserStep");
  if(newUserStep && e.key === "Enter"){
    addUserStep2();
  }
});

// Add User Step 2: Password
document.addEventListener("keydown", function(e){
  const newPassStep = document.getElementById("newPassStep");
  if(newPassStep && e.key === "Enter"){
    finalizeAddUser();
  }
});

// Change Password Step 1: Current Password
document.addEventListener("keydown", function(e){
  const currentPwd = document.getElementById("currentPwd");
  if(currentPwd && e.key === "Enter"){
    verifyCurrentPassword();
  }
});

// Change Password Step 2: New Password
document.addEventListener("keydown", function(e){
  const newPwdStep = document.getElementById("newPwdStep");
  if(newPwdStep && e.key === "Enter"){
    confirmNewPassword();
  }
});

// Change Password Step 3: Confirm Password
document.addEventListener("keydown", function(e){
  const confirmPwdStep = document.getElementById("confirmPwdStep");
  if(confirmPwdStep && e.key === "Enter"){
    finalizePasswordChange();
  }
});

// Protect / Unprotect: select user from dialogue
document.addEventListener("keydown", function(e){
  const protectDialog = document.getElementById("protectDialog");
  if(protectDialog && protectDialog.style.display === "block" && e.key === "Enter"){
    // If a user row is focused, trigger click
    const focusedRow = document.activeElement;
    if(focusedRow && focusedRow.tagName === "P"){
      focusedRow.click();
    }
  }
});
// ----------------------------
// ENTER KEY SUPPORT FOR MENU BOXES
// ----------------------------

// Add User Step 1: Username
document.addEventListener("keydown", function(e){
  const newUserStep = document.getElementById("newUserStep");
  if(newUserStep && e.key === "Enter"){
    addUserStep2();
  }
});

// Add User Step 2: Password
document.addEventListener("keydown", function(e){
  const newPassStep = document.getElementById("newPassStep");
  if(newPassStep && e.key === "Enter"){
    finalizeAddUser();
  }
});

// Change Password Step 1: Current Password
document.addEventListener("keydown", function(e){
  const currentPwd = document.getElementById("currentPwd");
  if(currentPwd && e.key === "Enter"){
    verifyCurrentPassword();
  }
});

// Change Password Step 2: New Password
document.addEventListener("keydown", function(e){
  const newPwdStep = document.getElementById("newPwdStep");
  if(newPwdStep && e.key === "Enter"){
    confirmNewPassword();
  }
});

// Change Password Step 3: Confirm Password
document.addEventListener("keydown", function(e){
  const confirmPwdStep = document.getElementById("confirmPwdStep");
  if(confirmPwdStep && e.key === "Enter"){
    finalizePasswordChange();
  }
});

// Protect / Unprotect: select user from dialogue
document.addEventListener("keydown", function(e){
  const protectDialog = document.getElementById("protectDialog");
  if(protectDialog && protectDialog.style.display === "block" && e.key === "Enter"){
    // If a user row is focused, trigger click
    const focusedRow = document.activeElement;
    if(focusedRow && focusedRow.tagName === "P"){
      focusedRow.click();
    }
  }
});
// ----------------------------
// AUTO-FOCUS INPUTS IN MENU BOX
// ----------------------------

function autoFocusStep() {
  // Add User Step 1: Username
  const newUserStep = document.getElementById("newUserStep");
  if(newUserStep) { newUserStep.focus(); return; }

  // Add User Step 2: Password
  const newPassStep = document.getElementById("newPassStep");
  if(newPassStep) { newPassStep.focus(); return; }

  // Change Password Step 1: Current Password
  const currentPwd = document.getElementById("currentPwd");
  if(currentPwd) { currentPwd.focus(); return; }

  // Change Password Step 2: New Password
  const newPwdStep = document.getElementById("newPwdStep");
  if(newPwdStep) { newPwdStep.focus(); return; }

  // Change Password Step 3: Confirm Password
  const confirmPwdStep = document.getElementById("confirmPwdStep");
  if(confirmPwdStep) { confirmPwdStep.focus(); return; }
}

// Call autoFocusStep whenever menu content changes
const menuContentObserver = new MutationObserver(autoFocusStep);
const menuContent = document.getElementById("menuContent");
menuContentObserver.observe(menuContent, { childList: true, subtree: true });

// Initial call in case content is already loaded
autoFocusStep();
// ----------------------------
// PROTECT / UNPROTECT DIALOGUE
// ----------------------------

// Function to open Protect/Unprotect user dialogue
function openProtectDialog() {
  const content = document.getElementById("menuContent");
  content.innerHTML = `<h3>Protect / Unprotect Users</h3>
    <div id="protectDialog" style="max-height:300px; overflow-y:auto; padding:10px;"></div>`;

  const protectDialog = document.getElementById("protectDialog");

  // Populate users
  users.forEach((u, idx) => {
    const p = document.createElement("p");
    p.tabIndex = 0; // make focusable
    p.style.cursor = "pointer";
    p.style.padding = "6px 10px";
    p.style.borderRadius = "10px";
    p.style.margin = "4px 0";
    p.style.background = u.protected ? "#388e3c" : "#4caf50";
    p.style.color = "white";
    p.innerText = `${u.username} (${u.role}) ${u.senior ? "👑" : ""} ${u.protected ? "🔒" : ""}`;
    p.addEventListener("click", () => {
      u.protected = !u.protected;
      localStorage.setItem("users", JSON.stringify(users));
      renderUserList();
      openProtectDialog(); // refresh list
    });
    protectDialog.appendChild(p);
  });

  // Auto-focus the first user
  if(protectDialog.firstChild) protectDialog.firstChild.focus();
}

// ENTER key support for protect/unprotect
document.addEventListener("keydown", function(e){
  const protectDialog = document.getElementById("protectDialog");
  if(protectDialog && protectDialog.style.display !== "none" && e.key === "Enter"){
    const focusedRow = document.activeElement;
    if(focusedRow && focusedRow.tagName === "P"){
      focusedRow.click(); // toggle protection
    }
  }
});
function startAddUser(){
  const content = document.getElementById("menuContent");

  content.innerHTML = `
    <h3>Add New User 👤</h3>

    <div class="step-box">
      <input id="newUserStep" placeholder="Enter username">
      <button onclick="addUserStep2()">Next ➡</button>
    </div>
  `;

  document.getElementById("newUserStep").focus();
}
function addUserStep2(){
  const username = document.getElementById("newUserStep").value.trim();
  if(!username) return alert("Username required");

  if(users.find(u => u.username === username)){
    alert("User already exists");
    return;
  }

  usersTempUsername = username;

  const content = document.getElementById("menuContent");

  content.innerHTML = `
    <h3>Add New User 👤</h3>

    <div class="step-box">
      <input id="newPassStep" type="password" placeholder="Enter password">
      <button onclick="finalizeAddUser()">✅ Create User</button>
    </div>
  `;

  document.getElementById("newPassStep").focus();
}
function finalizeAddUser(){
  const password = document.getElementById("newPassStep").value.trim();
  if(!password) return alert("Password required");

  users.push({
    username: usersTempUsername,
    password: password,
    role: "user",
    senior: false,
    protected: false
  });

  localStorage.setItem("users", JSON.stringify(users));

  alert("User added successfully ✅");
  showMenu("userManagement");
}

