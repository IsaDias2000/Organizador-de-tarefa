document.addEventListener("DOMContentLoaded", () => {
  const financeForm = document.getElementById("finance-form");
  const paymentForm = document.getElementById("payment-form");
  const reminderForm = document.getElementById("reminder-form");
  const transactionsList = document.getElementById("transactions");
  const cashflowEl = document.getElementById("cashflow");
  const paymentInfo = document.getElementById("payment-info");
  const remindersList = document.getElementById("reminders");
  const completedList = document.getElementById("completed-reminders");
  const themeToggle = document.getElementById("theme-toggle");
  const feedback = document.getElementById("feedback");

  let transactions = JSON.parse(localStorage.getItem("transactions")) || [];
  let reminders = JSON.parse(localStorage.getItem("reminders")) || [];
  let completedReminders = JSON.parse(localStorage.getItem("completedReminders")) || [];
  let nextPaymentDate = localStorage.getItem("nextPaymentDate") || null;

  document.getElementById("filtro-fixas").addEventListener("click", () => {
  const todas = document.querySelectorAll("#transactions li");
  todas.forEach(item => {
    if (item.classList.contains("transacao-fixa")) {
      item.style.display = "flex";
    } else {
      item.style.display = "none";
    }
  });
});

  // Alternar tema
  themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark");
  });

  // Alternar abas
  document.getElementById("finance-tab").addEventListener("click", () => showTab("finance-section"));
  document.getElementById("payment-tab").addEventListener("click", () => showTab("payment-section"));
  document.getElementById("reminder-tab").addEventListener("click", () => showTab("reminder-section"));

  function showTab(id) {
    document.querySelectorAll(".tab-section").forEach(tab => tab.classList.remove("active"));
    document.getElementById(id).classList.add("active");
  }

  // Lançamentos
  financeForm.addEventListener("submit", e => {
    e.preventDefault();
    const desc = document.getElementById("description").value.trim();
    const value = parseFloat(document.getElementById("amount").value.replace(",", "."));
    const cat = document.getElementById("category").value;
    const installments = parseInt(document.getElementById("installments")?.value || 1);
    const type = document.getElementById("type").value;

    if (!desc || isNaN(value) || value <= 0) {
      feedback.textContent = "⚠️ Preencha todos os campos corretamente!";
      feedback.style.color = "red";
      return;
    }

    const transaction = { desc, value, cat, installments, type };
    transactions.push(transaction);
    localStorage.setItem("transactions", JSON.stringify(transactions));
    feedback.textContent = "✅ Lançamento adicionado com sucesso!";
    feedback.style.color = "green";
    financeForm.reset();
    updateTransactions();
    updateCashflow();
    updatePaymentInfo();
    renderCharts();
  });

  function updateTransactions() {
    transactionsList.innerHTML = "";
    transactions.forEach((t, i) => {
      const li = document.createElement("li");
      li.textContent = `${t.desc}: R$ ${t.value.toFixed(2)} (${t.cat})${t.installments > 1 ? ` - ${t.installments}x` : ""}`;
      const del = document.createElement("button");
      del.textContent = "🗑️";
      del.onclick = () => {
        transactions.splice(i, 1);
        localStorage.setItem("transactions", JSON.stringify(transactions));
        updateTransactions();
        updateCashflow();
        updatePaymentInfo();
        renderCharts();
      };
      li.appendChild(del);
      transactionsList.appendChild(li);
    });
  }

  function updateCashflow() {
    const total = transactions.reduce((acc, t) => acc + (t.type === "receita" ? t.value : -t.value), 0);
    cashflowEl.textContent = `Saldo Atual: R$ ${total.toFixed(2)}`;
  }
li.classList.add(t.type === "despesa" ? "transacao-despesa" : "transacao-receita");
if (t.fixed) {
  li.classList.remove("transacao-despesa");
  li.classList.add("transacao-fixa");
}

  paymentForm.addEventListener("submit", e => {
    e.preventDefault();
    const data = document.getElementById("next-payment").value;
    if (!data) return alert("Escolha uma data válida.");
    nextPaymentDate = data;
    localStorage.setItem("nextPaymentDate", nextPaymentDate);
    updatePaymentInfo();
  });

  function updatePaymentInfo() {
    if (!nextPaymentDate) {
      paymentInfo.textContent = "Nenhuma data definida.";
      return;
    }
    const hoje = new Date();
    const pagamento = new Date(nextPaymentDate);
    const dias = Math.ceil((pagamento - hoje) / (1000 * 60 * 60 * 24));
    const saldo = transactions.reduce((acc, t) => acc + (t.cat === "receita" ? t.value : -t.value), 0);
    const diario = dias > 0 ? (saldo / dias).toFixed(2) : "0.00";
    paymentInfo.textContent = `Próxima data: ${nextPaymentDate} • Faltam ${dias} dias • Valor diário permitido: R$ ${diario}`;
  }

  reminderForm.addEventListener("submit", e => {
    e.preventDefault();
    const texto = document.getElementById("reminder").value.trim();
    if (!texto) return;
    reminders.push(texto);
    localStorage.setItem("reminders", JSON.stringify(reminders));
    reminderForm.reset();
    updateReminders();
  });

  function updateReminders() {
    remindersList.innerHTML = "";
    reminders.forEach((r, i) => {
      const li = document.createElement("li");
      const check = document.createElement("input");
      check.type = "checkbox";
      check.onchange = () => {
        completedReminders.push(r);
        reminders.splice(i, 1);
        localStorage.setItem("reminders", JSON.stringify(reminders));
        localStorage.setItem("completedReminders", JSON.stringify(completedReminders));
        updateReminders();
        updateCompletedReminders();
      };
      const del = document.createElement("button");
      del.textContent = "🗑️";
      del.onclick = () => {
        reminders.splice(i, 1);
        localStorage.setItem("reminders", JSON.stringify(reminders));
        updateReminders();
      };
      li.appendChild(check);
      li.appendChild(document.createTextNode(r));
      li.appendChild(del);
      remindersList.appendChild(li);
    });
  }

  function updateCompletedReminders() {
    completedList.innerHTML = "";
    completedReminders.forEach((r, i) => {
      const li = document.createElement("li");
      li.textContent = r;
      const del = document.createElement("button");
      del.textContent = "🗑️";
      del.onclick = () => {
        completedReminders.splice(i, 1);
        localStorage.setItem("completedReminders", JSON.stringify(completedReminders));
        updateCompletedReminders();
      };
      li.appendChild(del);
      completedList.appendChild(li);
    });
  }

  function renderCharts() {
    const receitas = transactions.filter(t => t.cat === "receita").reduce((s, t) => s + t.value, 0);
    const despesas = transactions.filter(t => t.cat === "despesa").reduce((s, t) => s + t.value, 0);
    const categorias = {};
    transactions.forEach(t => {
      if (t.cat === "despesa") {
        categorias[t.desc] = (categorias[t.desc] || 0) + t.value;
      }
    });

    if (window.pieChart) window.pieChart.destroy();
    if (window.barChart) window.barChart.destroy();

    const pieCtx = document.getElementById("pieChart")?.getContext("2d");
    const barCtx = document.getElementById("barChart")?.getContext("2d");

    if (pieCtx) {
      window.pieChart = new Chart(pieCtx, {
        type: "pie",
        data: {
          labels: ["Receitas", "Despesas"],
          datasets: [{
            data: [receitas, despesas],
            backgroundColor: ["#38b000", "#ef4444"]
          }]
        }
      });
    }

    if (barCtx) {
      window.barChart = new Chart(barCtx, {
        type: "bar",
        data: {
          labels: Object.keys(categorias),
          datasets: [{
            label: "Despesas por categoria",
            data: Object.values(categorias),
            backgroundColor: "#3b82f6"
          }]
        }
      });
    }
  }

  // Inicialização
  updateTransactions();
  updateCashflow();
  updatePaymentInfo();
  updateReminders();
  updateCompletedReminders();
  renderCharts();
  document.getElementById("filtro-fixas").addEventListener("click", () => {
  const todas = document.querySelectorAll("#transactions li");
  todas.forEach(item => {
    if (item.classList.contains("transacao-fixa")) {
      item.style.display = "flex";
    } else {
      item.style.display = "none";
    }
  });
});

});
