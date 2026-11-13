const $ = id => document.getElementById(id);

let expenses = JSON.parse(localStorage.getItem("smartSpendExpenses") || "[]");
let budget = Number(localStorage.getItem("smartSpendBudget") || 0);
let editingId = null;
let chart;

const today = () => new Date().toISOString().split("T")[0];
$("date").value = today();

function money(n){ return "₹" + Number(n).toLocaleString("en-IN"); }

function save(){
  localStorage.setItem("smartSpendExpenses", JSON.stringify(expenses));
  localStorage.setItem("smartSpendBudget", budget);
}

function render(){
  const total = expenses.reduce((s,e)=>s+Number(e.amount),0);
  const balance = budget - total;
  $("budgetValue").textContent = money(budget);
  $("expenseValue").textContent = money(total);
  $("incomeValue").textContent = money(budget);
  $("balance").textContent = money(balance);
  $("expenseCount").textContent = `${expenses.length} transaction${expenses.length===1?"":"s"}`;
  $("balanceStatus").textContent = balance < 0 ? "⚠️ You are over budget" : balance === 0 ? "Budget fully used" : "You are within budget";
  const percent = budget ? Math.round((total/budget)*100) : 0;
  $("budgetPercent").textContent = percent + "%";
  $("progressBar").style.width = Math.min(percent,100) + "%";
  $("progressBar").className = percent >= 100 ? "danger" : percent >= 80 ? "warn" : "";
  renderTable();
  renderChart();
}

function renderTable(){
  const search = $("search").value.toLowerCase();
  const filter = $("filter").value;
  const list = expenses.filter(e =>
    e.name.toLowerCase().includes(search) &&
    (filter === "all" || e.category === filter)
  );
  $("expenseList").innerHTML = list.map(e => `
    <tr>
      <td><strong>${escapeHtml(e.name)}</strong></td>
      <td><span class="cat">${e.category}</span></td>
      <td>${new Date(e.date+"T00:00:00").toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}</td>
      <td>${money(e.amount)}</td>
      <td><div class="actions"><button class="small-btn" onclick="editExpense('${e.id}')">✏️</button><button class="small-btn delete" onclick="deleteExpense('${e.id}')">🗑️</button></div></td>
    </tr>`).join("");
  $("emptyState").style.display = list.length ? "none" : "block";
}

function renderChart(){
  const sums = {};
  expenses.forEach(e => sums[e.category] = (sums[e.category]||0) + Number(e.amount));
  const labels = Object.keys(sums), data = Object.values(sums);
  $("emptyChart").style.display = data.length ? "none" : "block";
  if(chart) chart.destroy();
  if(!data.length) return;
  chart = new Chart($("expenseChart"), {
    type:"doughnut",
    data:{labels,datasets:[{data}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:"right",labels:{boxWidth:12,font:{size:10}}}}}
  });
}

function escapeHtml(s){return s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));}

$("setBudget").onclick = () => {
  const value = Number($("budgetInput").value);
  if(value < 0 || !Number.isFinite(value)) return;
  budget = value; $("budgetInput").value = ""; save(); render(); toast("Budget updated successfully!");
};

$("openModal").onclick = () => {
  editingId = null; $("modalTitle").textContent="Add Expense"; $("saveBtn").textContent="Add Expense";
  $("expenseForm").reset(); $("date").value=today(); $("modal").classList.add("show");
};
function closeModal(){ $("modal").classList.remove("show"); }
$("closeModal").onclick=closeModal; $("cancel").onclick=closeModal;
$("modal").onclick=e=>{if(e.target===$("modal"))closeModal()};

$("expenseForm").onsubmit = e => {
  e.preventDefault();
  const item = {id: editingId || Date.now().toString(), name:$("name").value.trim(), amount:Number($("amount").value), category:$("category").value, date:$("date").value};
  if(editingId) expenses = expenses.map(x=>x.id===editingId?item:x);
  else expenses.unshift(item);
  save(); render(); closeModal(); toast(editingId ? "Expense updated!" : "Expense added!");
};

window.deleteExpense = id => {
  if(confirm("Delete this expense?")){ expenses=expenses.filter(e=>e.id!==id); save(); render(); toast("Expense deleted."); }
};
window.editExpense = id => {
  const e=expenses.find(x=>x.id===id); if(!e)return;
  editingId=id; $("modalTitle").textContent="Edit Expense"; $("saveBtn").textContent="Save Changes";
  $("name").value=e.name; $("amount").value=e.amount; $("category").value=e.category; $("date").value=e.date;
  $("modal").classList.add("show");
};

$("search").oninput=renderTable;
$("filter").onchange=renderTable;

$("clearAll").onclick=()=>{
  if(confirm("Clear all expenses and budget? This cannot be undone.")){
    expenses=[]; budget=0; save(); render(); toast("All data cleared.");
  }
};

$("themeBtn").onclick=()=>{
  document.body.classList.toggle("dark");
  const dark=document.body.classList.contains("dark");
  localStorage.setItem("smartSpendTheme",dark?"dark":"light");
  $("themeBtn").textContent=dark?"☀️":"🌙";
};
if(localStorage.getItem("smartSpendTheme")==="dark"){document.body.classList.add("dark");$("themeBtn").textContent="☀️"}

let toastTimer;
function toast(msg){clearTimeout(toastTimer);$("toast").textContent=msg;$("toast").classList.add("show");toastTimer=setTimeout(()=>$("toast").classList.remove("show"),2200)}

render();
