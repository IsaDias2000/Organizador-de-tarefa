
document.addEventListener("DOMContentLoaded", () => {
  const financeForm = document.getElementById("finance-form");
  const paymentForm = document.getElementById("payment-form");
  const reminderForm = document.getElementById("reminder-form");
  const transactionsList = document.getElementById("transactions");
  const paymentInfo = document.getElementById("payment-info");
  const remindersList = document.getElementById("reminders");
  const completedList = document.getElementById("completed-reminders");
  const themeToggle = document.getElementById("theme-toggle");
  const amountInput = document.getElementById("amount");

  let transactions = JSON.parse(localStorage.getItem("transactions")) || [];
  let reminders = JSON.parse(localStorage.getItem("reminders")) || [];
  let completedReminders = JSON.parse(localStorage.getItem("completedReminders")) || [];
  let nextPaymentDate = localStorage.getItem("nextPaymentDate") || null;

  if (amountInput) {
    amountInput.setAttribute("step", "0.01");
    amountInput.addEventListener("input", (e) => {
      e.target.value = e.target.value.replace(",", ".");
    });
  }

  themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark");
  });

  financeForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const description = document.getElementById("description").value.trim();
    const amount = parseFloat(document.getElementById("amount").value);
    const category = document.getElementById("category").value;
    const installments = parseInt(document.getElementById("installments").value) || 1;

    if (!description || isNaN(amount)) {
      alert("Preencha os campos corretamente.");
      return;
    }

    const transaction = { description, amount, category, installments, paid: 1 };
    transactions.push(transaction);
    localStorage.setItem("transactions", JSON.stringify(transactions));
    updateTransactions();
    updateCashflow();
    renderCharts();
    financeForm.reset();
  });

  function updateTransactions() {
    transactionsList.innerHTML = "";
    transactions.forEach((t, i) => {
      const li = document.createElement("li");
      li.textContent = \`\${t.description}: R$ \${t.amount.toFixed(2)} (\${t.category})\${t.installments > 1 ? ' - ' + t.installments + 'x' : ''}\`;
      const btn = document.createElement("button");
      btn.textContent = "🗑️";
      btn.onclick = () => {
        transactions.splice(i, 1);
        localStorage.setItem("transactions", JSON.stringify(transactions));
        updateTransactions();
        updateCashflow();
        renderCharts();
      };
      li.appendChild(btn);
      transactionsList.appendChild(li);
    });
  }

  function updateCashflow() {
    let total = 0;
    transactions.forEach(t => {
      total += t.category === "receita" ? t.amount : -t.amount;
    });
    document.getElementById("cashflow").textContent = \`Saldo Atual: R$ \${total.toFixed(2)}\`;
  }

  paymentForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const date = document.getElementById("next-payment").value;
    if (!date) return alert("Selecione uma data.");
    nextPaymentDate = date;
    localStorage.setItem("nextPaymentDate", nextPaymentDate);
    updatePaymentInfo();
  });

  function updatePaymentInfo() {
    if (!nextPaymentDate) {
      paymentInfo.textContent = "Nenhuma data definida.";
    } else {
      const today = new Date();
      const next = new Date(nextPaymentDate);
      const diff = Math.ceil((next - today) / (1000 * 60 * 60 * 24));
      const total = transactions.reduce((sum, t) => {
        return sum + (t.category === "receita" ? t.amount : -t.amount);
      }, 0);
      const diario = diff > 0 ? (total / diff).toFixed(2) : "0.00";
      paymentInfo.textContent = \`Próxima data: \${nextPaymentDate} • Faltam \${diff} dias • Valor diário permitido: R$ \${diario}\`;
    }
  }

  reminderForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = document.getElementById("reminder").value.trim();
    if (!text) return;
    reminders.push(text);
    localStorage.setItem("reminders", JSON.stringify(reminders));
    updateReminders();
    reminderForm.reset();
  });

  function updateReminders() {
    remindersList.innerHTML = "";
    reminders.forEach((r, i) => {
      const li = document.createElement("li");
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.onchange = () => {
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
      li.appendChild(checkbox);
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
      const btn = document.createElement("button");
      btn.textContent = "🗑️";
      btn.onclick = () => {
        completedReminders.splice(i, 1);
        localStorage.setItem("completedReminders", JSON.stringify(completedReminders));
        updateCompletedReminders();
      };
      li.appendChild(btn);
      completedList.appendChild(li);
    });
  }

  function renderCharts() {
    const receitas = transactions.filter(t => t.category === 'receita').reduce((sum, t) => sum + t.amount, 0);
    const despesas = transactions.filter(t => t.category === 'despesa').reduce((sum, t) => sum + t.amount, 0);
    const categorias = {};
    transactions.forEach(t => {
      if (t.category === 'despesa') {
        categorias[t.description] = (categorias[t.description] || 0) + t.amount;
      }
    });

    if (window.pieChart) window.pieChart.destroy();
    if (window.barChart) window.barChart.destroy();

    const ctxPie = document.getElementById("pieChart")?.getContext("2d");
    if (ctxPie) {
      window.pieChart = new Chart(ctxPie, {
        type: "pie",
        data: {
          labels: ["Receitas", "Despesas"],
          datasets: [{
            data: [receitas, despesas],
            backgroundColor: ["#4caf50", "#f44336"]
          }]
        }
      });
    }

    const ctxBar = document.getElementById("barChart")?.getContext("2d");
    if (ctxBar) {
      window.barChart = new Chart(ctxBar, {
        type: "bar",
        data: {
          labels: Object.keys(categorias),
          datasets: [{
            label: "Despesas por Categoria",
            data: Object.values(categorias),
            backgroundColor: "#2196f3"
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
});
