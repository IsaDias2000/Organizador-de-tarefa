
document.addEventListener('DOMContentLoaded', () => {
  const financeTab = document.getElementById('finance-tab');
  const paymentTab = document.getElementById('payment-tab');
  const reminderTab = document.getElementById('reminder-tab');
  const financeSection = document.getElementById('finance-section');
  const paymentSection = document.getElementById('payment-section');
  const reminderSection = document.getElementById('reminder-section');
  const themeToggle = document.getElementById('theme-toggle');

  const financeForm = document.getElementById('finance-form');
  const transactionsList = document.getElementById('transactions');
  const cashflowEl = document.getElementById('cashflow');
  const dailyExpenseEl = document.getElementById('daily-expense');
  const fixedExpensesEl = document.getElementById('fixed-expenses');
  const gastoDiarioInfo = document.getElementById('gasto-diario-info');
  const clearBtn = document.getElementById('clear-transactions');

  const paymentForm = document.getElementById('payment-form');
  const paymentInfo = document.getElementById('payment-info');

  const reminderForm = document.getElementById('reminder-form');
  const remindersList = document.getElementById('reminders');
  const completedList = document.getElementById('completed-reminders');

  const transactions = JSON.parse(localStorage.getItem('transactions')) || [];
  const reminders = JSON.parse(localStorage.getItem('reminders')) || [];
  const completedReminders = JSON.parse(localStorage.getItem('completedReminders')) || [];
  let nextPaymentDate = localStorage.getItem('nextPaymentDate') || null;

  function switchTab(show) {
    [financeSection, paymentSection, reminderSection].forEach(sec => sec.classList.remove('active'));
    show.classList.add('active');
  }

  financeTab.onclick = () => switchTab(financeSection);
  paymentTab.onclick = () => switchTab(paymentSection);
  reminderTab.onclick = () => switchTab(reminderSection);

  themeToggle.onclick = () => {
    document.body.classList.toggle('dark');
    localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
  };

  if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark');
  }

  financeForm.onsubmit = (e) => {
    e.preventDefault();
    const desc = document.getElementById('description').value.trim();
    const amount = parseFloat(document.getElementById('amount').value);
    const type = document.getElementById('type').value;
    const category = document.getElementById('category').value.trim();
    const fixed = document.getElementById('fixed').checked;

    if (!desc || isNaN(amount) || !category) return;

    transactions.push({ desc, amount, type, category, fixed, date: new Date().toISOString().split('T')[0] });
    localStorage.setItem('transactions', JSON.stringify(transactions));
    financeForm.reset();
    updateUI();
  };

  clearBtn.onclick = () => {
    if (confirm("Tem certeza que deseja limpar todos os lançamentos?")) {
      localStorage.removeItem('transactions');
      transactions.length = 0;
      updateUI();
    }
  };

  function updateUI() {
    transactionsList.innerHTML = '';
    let saldo = 0, hoje = new Date().toISOString().split('T')[0];
    let gastosHoje = 0;
    let fixos = transactions.filter(t => t.fixed && t.type === 'despesa');
    let totalFixos = fixos.reduce((sum, t) => sum + t.amount, 0);

    transactions.forEach((t, i) => {
      saldo += t.type === 'receita' ? t.amount : -t.amount;
      if (t.date === hoje && t.type === 'despesa') gastosHoje += t.amount;
      const li = document.createElement('li');
      li.textContent = `${t.desc} - R$ ${t.amount.toFixed(2)} (${t.category})`;
      const del = document.createElement('button');
      del.textContent = '🗑️';
      del.onclick = () => {
        transactions.splice(i, 1);
        localStorage.setItem('transactions', JSON.stringify(transactions));
        updateUI();
      };
      li.appendChild(del);
      transactionsList.appendChild(li);
    });

    cashflowEl.textContent = `Saldo Atual: R$ ${saldo.toFixed(2)}`;
    dailyExpenseEl.textContent = `Gastos de Hoje: R$ ${gastosHoje.toFixed(2)}`;
    fixedExpensesEl.textContent = `Despesas Fixas: ${fixos.length} itens • Total: R$ ${totalFixos.toFixed(2)}`;

    updateGastoDiario(saldo);
  }

  paymentForm.onsubmit = (e) => {
    e.preventDefault();
    const date = document.getElementById('next-payment').value;
    if (!date) return;
    nextPaymentDate = date;
    localStorage.setItem('nextPaymentDate', date);
    updateGastoDiario();
    updatePaymentInfo();
  };

  function updatePaymentInfo() {
    if (nextPaymentDate) {
      paymentInfo.textContent = `Próxima data de pagamento: ${nextPaymentDate}`;
    }
  }

  function updateGastoDiario(saldoAtual = null) {
    if (!nextPaymentDate) return gastoDiarioInfo.textContent = "Próximo pagamento não definido.";
    const hoje = new Date();
    const proximo = new Date(nextPaymentDate);
    const dias = Math.max(1, Math.ceil((proximo - hoje) / (1000 * 60 * 60 * 24)));
    const saldo = saldoAtual !== null ? saldoAtual : transactions.reduce((acc, t) => acc + (t.type === 'receita' ? t.amount : -t.amount), 0);
    const valor = saldo / dias;
    gastoDiarioInfo.textContent = `Faltam ${dias} dias • Valor diário permitido: R$ ${valor.toFixed(2)}`;
  }

  reminderForm.onsubmit = (e) => {
    e.preventDefault();
    const text = document.getElementById('reminder').value.trim();
    if (!text) return;
    reminders.push(text);
    localStorage.setItem('reminders', JSON.stringify(reminders));
    reminderForm.reset();
    updateReminders();
  };

  function updateReminders() {
    remindersList.innerHTML = '';
    reminders.forEach((text, i) => {
      const li = document.createElement('li');
      const box = document.createElement('input');
      box.type = 'checkbox';
      box.onchange = () => {
        completedReminders.push(text);
        reminders.splice(i, 1);
        localStorage.setItem('reminders', JSON.stringify(reminders));
        localStorage.setItem('completedReminders', JSON.stringify(completedReminders));
        updateReminders();
        updateCompleted();
      };
      const del = document.createElement('button');
      del.textContent = '🗑️';
      del.onclick = () => {
        reminders.splice(i, 1);
        localStorage.setItem('reminders', JSON.stringify(reminders));
        updateReminders();
      };
      li.appendChild(box);
      li.appendChild(document.createTextNode(text));
      li.appendChild(del);
      remindersList.appendChild(li);
    });
  }

  function updateCompleted() {
    completedList.innerHTML = '';
    completedReminders.forEach((text, i) => {
      const li = document.createElement('li');
      li.textContent = text;
      const del = document.createElement('button');
      del.textContent = '🗑️';
      del.onclick = () => {
        completedReminders.splice(i, 1);
        localStorage.setItem('completedReminders', JSON.stringify(completedReminders));
        updateCompleted();
      };
      li.appendChild(del);
      completedList.appendChild(li);
    });
  }

  updateUI();
  updateReminders();
  updateCompleted();
  updatePaymentInfo();
});
