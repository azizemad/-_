const firebaseConfig = {
  apiKey: "AIzaSyA7S0DeNhibbkcq8XXw3fTS_88hDPrfhxw",
  authDomain: "aziz-891ae.firebaseapp.com",
  databaseURL: "https://aziz-891ae-default-rtdb.firebaseio.com",
  projectId: "aziz-891ae",
  storageBucket: "aziz-891ae.appspot.com",
  messagingSenderId: "399625100592",
  appId: "1:399625100592:web:cb27b69a941e88b341bcf5",
  measurementId: "G-JSD432PEB7"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const employeeNameInput = document.getElementById("employeeName");
const employeePhoneInput = document.getElementById("employeePhone");
const dailyAmountInput = document.getElementById("dailyAmount");
const searchNameInput = document.getElementById("searchName");
const employeeTable = document.getElementById("employeeTable");
const employeeTableBody = document.getElementById("employeeTableBody");
const selectedEmployeeInfo = document.getElementById("selectedEmployeeInfo");
const selectedEmployeeName = document.getElementById("selectedEmployeeName");
const selectedEmployeeBalance = document.getElementById("selectedEmployeeBalance");
const balanceChangeInput = document.getElementById("balanceChange");
const activityLogTableBody = document.getElementById("activityLogTableBody");
const companyRevenueDisplay = document.getElementById("companyRevenueDisplay");
const companyRevenueAmount = document.getElementById("companyRevenueAmount");

let selectedEmployeeId = null;

function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("open");
}

function hideAllSections() {
  document.getElementById("addEmployeeSection").classList.add("hidden");
  document.getElementById("searchEmployeeSection").classList.add("hidden");
  document.getElementById("balanceManagementSection").classList.add("hidden");
  document.getElementById("activityLogSection").classList.add("hidden");
  document.getElementById("companyRevenuesSection").classList.add("hidden");
  employeeTable.classList.add("hidden");
}

function showAddEmployee() {
  hideAllSections();
  document.getElementById("addEmployeeSection").classList.remove("hidden");
}

function showSearchEmployee() {
  hideAllSections();
  document.getElementById("searchEmployeeSection").classList.remove("hidden");
  employeeTable.classList.remove("hidden");
}

function showEmployeeList() {
  hideAllSections();
  employeeTable.classList.remove("hidden");
  displayEmployeeList();
}

function showBalanceManagement() {
  hideAllSections();
  document.getElementById("balanceManagementSection").classList.remove("hidden");
}

function showActivityLog() {
  hideAllSections();
  document.getElementById("activityLogSection").classList.remove("hidden");
  displayActivityLog();
}

function showCompanyRevenues() {
  hideAllSections();
  document.getElementById("companyRevenuesSection").classList.remove("hidden");
  displayCompanyRevenue();
}

function addEmployee() {
  const name = employeeNameInput.value.trim();
  const phone = employeePhoneInput.value.trim();
  const dailyAmount = parseFloat(dailyAmountInput.value);

  if (name && phone && !isNaN(dailyAmount)) {
    const newEmployeeRef = db.ref("employees").push();
    const id = newEmployeeRef.key;

    newEmployeeRef.set({
      id: id,
      name: name,
      phone: phone,
      type: "عادي",  // النوع الافتراضي
      balance: 0,
      dailyAmount: dailyAmount
    }).then(() => {
      alert("تمت الإضافة!");
      employeeNameInput.value = "";
      employeePhoneInput.value = "";
      dailyAmountInput.value = "";
      logActivity(`تمت إضافة الموظف: ${name}`);
    });
  } else {
    alert("يرجى إدخال الاسم ورقم الهاتف والمبلغ اليومي.");
  }
}

function displayEmployeeList() {
  employeeTableBody.innerHTML = "";
  db.ref("employees").once("value", snapshot => {
    snapshot.forEach(child => {
      const emp = child.val();
      const row = document.createElement("tr");

      // إضافة زر للتفاعل مع "type"
      const typeButton = document.createElement("button");
      typeButton.textContent = emp.type;
      typeButton.style.backgroundColor = emp.type === "مميز" ? "red" : ""; // تلوين الزر إذا كان النوع مميزاً
      typeButton.onclick = function() {
        const newType = emp.type === "مميز" ? "عادي" : "مميز"; // التبديل بين مميز وعادي
        const nameCell = row.cells[0];
        
        // تلوين الاسم باللون الأحمر أو إرجاعه للونه الأصلي
        nameCell.style.color = newType === "مميز" ? "red" : ""; 

        // تحديث النوع في Firebase
        db.ref("employees/" + child.key).update({
          type: newType
        }).then(() => {
          console.log("تم تحديث نوع الموظف");
          typeButton.textContent = newType; // تغيير النص في الزر
          typeButton.style.backgroundColor = newType === "مميز" ? "red" : ""; // تلوين الزر إذا كان مميز
        });
      };

      row.innerHTML = `
        <td>${emp.name}</td>
        <td>${emp.balance}</td>
        <td>${emp.id}</td>
        <td>${emp.phone}</td>
        <td></td> <!-- هنا سيتم إضافة الزر -->
        <td><button onclick="openBalanceManagement('${child.key}')">إدارة الرصيد</button></td>
      `;
      
      // إضافة الزر داخل الخلية المناسبة
      row.cells[4].appendChild(typeButton);
      employeeTableBody.appendChild(row);
    });
  });
}

function openBalanceManagement(employeeId) {
  selectedEmployeeId = employeeId;
  hideAllSections();
  document.getElementById("balanceManagementSection").classList.remove("hidden");

  db.ref("employees/" + selectedEmployeeId).once("value", snapshot => {
    const emp = snapshot.val();
    selectedEmployeeName.textContent = `اسم الموظف: ${emp.name}`;
    selectedEmployeeBalance.textContent = `الرصيد الحالي: ${emp.balance}`;
  });
  selectedEmployeeInfo.classList.remove("hidden");
}

function updateBalance(action) {
  const amount = parseFloat(balanceChangeInput.value);
  if (isNaN(amount) || amount <= 0) {
    alert("يرجى إدخال قيمة صحيحة.");
    return;
  }

  const employeeRef = db.ref("employees/" + selectedEmployeeId);
  const companyRevenueRef = db.ref("companyRevenue");

  employeeRef.once("value", snapshot => {
    const emp = snapshot.val();
    let newBalance = emp.balance;

    if (action === "increase") {
      newBalance += amount;
      logActivity(`تمت زيادة الرصيد للموظف ${emp.name} بمقدار ${amount}`);
    } else if (action === "decrease") {
      if (newBalance >= amount) {
        newBalance -= amount;
        logActivity(`تم خصم مبلغ ${amount} من رصيد الموظف ${emp.name}`);
        
        // خصم المبلغ من إيرادات الشركة أيضًا
        companyRevenueRef.once("value", snapshot => {
          const currentRevenue = snapshot.val() || 0;
          const newRevenue = currentRevenue - amount;

          if (newRevenue < 0) {
            alert("إيرادات الشركة غير كافية.");
            return;
          }

          companyRevenueRef.set(newRevenue).then(() => {
            logActivity(`تم خصم مبلغ ${amount} من إيرادات الشركة`);
          });
        });
      } else {
        alert("الرصيد غير كافٍ.");
        return;
      }
    }

    employeeRef.update({ balance: newBalance }).then(() => {
      selectedEmployeeBalance.textContent = `الرصيد الحالي: ${newBalance}`;
      balanceChangeInput.value = "";
    });
  });
}

function displayActivityLog() {
  activityLogTableBody.innerHTML = "";
  db.ref("activityLog").once("value", snapshot => {
    snapshot.forEach(child => {
      const log = child.val();
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${log.timestamp}</td>
        <td>${log.activity}</td>
      `;
      activityLogTableBody.appendChild(row);
    });
  });
}

function logActivity(activity) {
  const timestamp = new Date().toLocaleString();
  const newLogRef = db.ref("activityLog").push();
  newLogRef.set({
    timestamp: timestamp,
    activity: activity
  });
}

function displayCompanyRevenue() {
  db.ref("companyRevenue").once("value", snapshot => {
    const revenue = snapshot.val() || 0;
    companyRevenueDisplay.textContent = `إيرادات الشركة: ${revenue}`;
  });
}

function updateCompanyRevenue(action) {
  const amount = parseFloat(companyRevenueAmount.value);
  if (isNaN(amount) || amount <= 0) {
    alert("يرجى إدخال قيمة صحيحة.");
    return;
  }

  const companyRevenueRef = db.ref("companyRevenue");
  companyRevenueRef.once("value", snapshot => {
    const currentRevenue = snapshot.val() || 0;
    let newRevenue = currentRevenue;

    if (action === "increase") {
      newRevenue += amount;
      logActivity(`تمت إضافة مبلغ ${amount} إلى إيرادات الشركة`);
    } else if (action === "decrease") {
      if (newRevenue >= amount) {
        newRevenue -= amount;
        logActivity(`تم خصم مبلغ ${amount} من إيرادات الشركة`);
      } else {
        alert("إيرادات الشركة غير كافية.");
        return;
      }
    }

    companyRevenueRef.set(newRevenue).then(() => {
      companyRevenueDisplay.textContent = `إيرادات الشركة: ${newRevenue}`;
      companyRevenueAmount.value = "";
    });
  });
}

function searchEmployee() {
  const searchText = searchNameInput.value.toLowerCase();
  const rows = employeeTableBody.getElementsByTagName("tr");

  for (let row of rows) {
    const nameCell = row.cells[0];
    const idCell = row.cells[2];
    const name = nameCell.textContent.toLowerCase();
    const id = idCell.textContent;

    if (name.includes(searchText) || id.includes(searchText)) {
      row.style.display = "";
    } else {
      row.style.display = "none";
    }
  }
}

// إضافة الرصيد التلقائي كل 5 دقائق
function autoAddBalance() {
  db.ref("employees").once("value", snapshot => {
    snapshot.forEach(child => {
      const emp = child.val();
      const dailyAmount = emp.dailyAmount || 0;
      const employeeRef = db.ref("employees/" + child.key);
      
      if (dailyAmount > 0) {
        employeeRef.once("value", snapshot => {
          const newBalance = snapshot.val().balance + dailyAmount;
          employeeRef.update({ balance: newBalance });
          logActivity(`تم إضافة ${dailyAmount} إلى رصيد الموظف ${emp.name}`);
        });
      }
    });
  });
}

// تشغيل الرصيد التلقائي كل 5 دقائق
setInterval(autoAddBalance, 1440 * 60 * 1000);

window.onload = function() {
  hideAllSections();
  showEmployeeList();
};
