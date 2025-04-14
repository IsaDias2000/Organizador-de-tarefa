class FinanceApp {
  constructor() {
    this.transactions = [];
    this.fixedTransactions = [];
    this.categories = [];
    this.reminders = [];
    this.currentBalance = 0;
    this.payday = null;
    this.balanceChart = null;

    this.initElements();
    this.loadData();
    this.initEventListeners();
    this.renderAll();
    this.checkDueDates();
  }

  initElements() {
    this.elements = {
      transactionForm: document.getElementById('transaction-form'),
      transactionType: document.getElementById('transaction-type'),
      transactionDate: document.getElementById('transaction-date'),
      transactionDescription: document.getElementById('transaction-description'),
      transactionAmount: document.getElementById('transaction-amount'),
      transactionCategory: document.getElementById('transaction-category'),
      transactionDueDate: document.getElementById('transaction-due-date'),
      transactionPayday: document.getElementById('transaction-payday'),
      transactionParceled: document.getElementById('transaction-parceled'),
      transactionInstallments: document.getElementById('transaction-installments'),
      transactionFixed: document.getElementById('transaction-fixed'),
      transactionsContainer: document.getElementById('transactions-container'),
      fixedContainer: document.getElementById('fixed-container'),
      activeReminders: document.getElementById('active-reminders'),
      reminderForm: document.getElementById('reminder-form'),
      reminderDescription: document.getElementById('reminder-description'),
      updateCalculation: document.getElementById('update-calculation'),
      tabButtons: document.querySelectorAll('.tab-button'),
      tabContents: document.querySelectorAll('.tab-content'),
      currentBalance: document.getElementById('current-balance'),
      totalIncome: document.getElementById('total-income'),
      totalExpenses: document.getElementById('total-expenses')
    };

    const today = new Date();
    this.elements.transactionDate.value = today.toISOString().split('T')[0];
  }

  loadData() {
    this.transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    this.fixedTransactions = JSON.parse(localStorage.getItem('fixedTransactions')) || [];
    this.categories = JSON.parse(localStorage.getItem('categories')) || [
      { name: 'Alimentação', color: '#ef4444' },
      { name: 'Moradia', color: '#3b82f6' },
      { name: 'Transporte', color: '#10b981' }
    ];
    this.reminders = JSON.parse(localStorage.getItem('reminders')) || [];

    this.checkFixedTransactions();
  }

  saveData() {
    localStorage.setItem('transactions', JSON.stringify(this.transactions));
    localStorage.setItem('fixedTransactions', JSON.stringify(this.fixedTransactions));
    localStorage.setItem('categories', JSON.stringify(this.categories));
    localStorage.setItem('reminders', JSON.stringify(this.reminders));
  }

  initEventListeners() {
    // Tabs
    this.elements.tabButtons.forEach(button => {
      button.addEventListener('click', () => this.switchTab(button));
    });

    // Formulário de transação
    this.elements.transactionForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.addTransaction();
    });

    // Formulário de lembrete
    this.elements.reminderForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.addReminder();
    });

    // Parcelamento
    this.elements.transactionParceled.addEventListener('change', (e) => {
      this.elements.transactionInstallments.disabled = !e.target.checked;
    });

    // Atualizar cálculo diário
    this.elements.updateCalculation.addEventListener('click', () => {
      this.calculateDailyBudget();
    });
  }

  switchTab(button) {
    this.elements.tabButtons.forEach(btn => btn.classList.remove('active'));
    this.elements.tabContents.forEach(content => content.classList.remove('active'));
    
    button.classList.add('active');
    const tabId = button.getAttribute('data-tab');
    document.getElementById(tabId).classList.add('active');

    // Atualiza conteúdo específico da aba
    if (tabId === 'reports') {
      this.updateReports();
    }
  }

  addTransaction() {
    const type = this.elements.transactionType.value;
    const date = this.elements.transactionDate.value;
    const description = this.elements.transactionDescription.value.trim();
    const amount = parseFloat(this.elements.transactionAmount.value);
    const category = this.elements.transactionCategory.value;
    const dueDate = this.elements.transactionDueDate.value;
    const isParceled = this.elements.transactionParceled.checked;
    const installments = isParceled ? parseInt(this.elements.transactionInstallments.value) : 1;
    const isFixed = this.elements.transactionFixed.checked;

    if (!description || isNaN(amount)) {
      alert('Preencha todos os campos obrigatórios!');
      return;
    }

    const newTransaction = {
      id: Date.now(),
      type,
      date,
      description,
      amount: type === 'expense' ? -Math.abs(amount) : Math.abs(amount),
      category,
      dueDate: dueDate || null,
      status: 'pendente',
      paid: false,
      fixed: isFixed,
      installments,
      installmentNumber: 1,
      createdAt: new Date().toISOString()
    };

    if (isParceled && installments > 1) {
      this.addInstallments(newTransaction, installments);
    }

    this.transactions.push(newTransaction);
    
    if (isFixed) {
      this.fixedTransactions.push({
        ...newTransaction,
        originalId: newTransaction.id
      });
    }

    this.saveData();
    this.renderAll();
    this.elements.transactionForm.reset();
    
    // Reset para data atual
    this.elements.transactionDate.value = new Date().toISOString().split('T')[0];
  }

  addInstallments(baseTransaction, installments) {
    const baseDate = new Date(baseTransaction.date);
    const baseDueDate = baseTransaction.dueDate ? new Date(baseTransaction.dueDate) : baseDate;
    
    for (let i = 2; i <= installments; i++) {
      const installmentDate = new Date(baseDate);
      installmentDate.setMonth(baseDate.getMonth() + (i - 1));
      
      const installmentDueDate = new Date(baseDueDate);
      installmentDueDate.setMonth(baseDueDate.getMonth() + (i - 1));
      
      const installment = {
        ...baseTransaction,
        id: Date.now() + i,
        date: installmentDate.toISOString().split('T')[0],
        dueDate: installmentDueDate.toISOString().split('T')[0],
        installmentNumber: i,
        paid: false
      };
      
      this.transactions.push(installment);
    }
  }

  addReminder() {
    const description = this.elements.reminderDescription.value.trim();
    
    if (!description) {
      alert('Digite uma descrição para o lembrete!');
      return;
    }
    
    const newReminder = {
      id: Date.now(),
      description,
      completed: false,
      createdAt: new Date().toISOString()
    };
    
    this.reminders.push(newReminder);
    this.saveData();
    this.renderReminders();
    this.elements.reminderDescription.value = '';
  }

  renderTransactions() {
    this.elements.transactionsContainer.innerHTML = '';
    
    this.transactions.forEach(transaction => {
      const li = document.createElement('li');
      li.className = `transaction-item ${transaction.type} ${transaction.status}`;
      
      let dueBadge = '';
      if (transaction.dueDate && !transaction.paid) {
        const dueDate = new Date(transaction.dueDate);
        const today = new Date();
        const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
        
        if (daysUntilDue <= 3) {
          dueBadge = `<span class="due-badge" title="Vence em ${daysUntilDue} dias">!</span>`;
        }
      }
      
      li.innerHTML = `
        <div class="transaction-info">
          <div class="transaction-description">
            ${transaction.description}
            ${dueBadge}
          </div>
          <div class="transaction-meta">
            <span>${new Date(transaction.date).toLocaleDateString()}</span>
            ${transaction.category ? `<span>${transaction.category}</span>` : ''}
            ${transaction.installments > 1 ? `<span>Parcela ${transaction.installmentNumber}/${transaction.installments}</span>` : ''}
          </div>
        </div>
        <div class="transaction-amount ${transaction.type}">
          ${transaction.type === 'expense' ? '-' : ''}R$ ${Math.abs(transaction.amount).toFixed(2)}
        </div>
      `;
      
      this.elements.transactionsContainer.appendChild(li);
    });
  }

  renderReminders() {
    this.elements.activeReminders.innerHTML = '';
    
    this.reminders
      .filter(r => !r.completed)
      .forEach(reminder => {
        const li = document.createElement('li');
        li.className = 'reminder-item';
        li.innerHTML = `
          <label>
            <input type="checkbox" class="reminder-checkbox" data-id="${reminder.id}">
            ${reminder.description}
          </label>
        `;
        this.elements.activeReminders.appendChild(li);
      });
  }

  calculateDailyBudget() {
    const paydayInput = this.elements.transactionPayday;
    if (!paydayInput.value) {
      alert("Informe sua próxima data de pagamento");
      return;
    }

    const payday = new Date(paydayInput.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const timeDiff = payday - today;
    const daysRemaining = Math.max(Math.ceil(timeDiff / (1000 * 60 * 60 * 24)), 1);
    const dailyBudget = this.currentBalance / daysRemaining;

    document.getElementById('days-until-payday').textContent = daysRemaining;
    document.getElementById('daily-budget').textContent = `R$ ${dailyBudget.toFixed(2)}`;
  }

  checkDueDates() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    this.transactions.forEach(transaction => {
      if (transaction.dueDate) {
        const dueDate = new Date(transaction.dueDate);
        if (dueDate < today && !transaction.paid) {
          transaction.status = 'pendente';
        }
      }
    });
    
    this.saveData();
    this.renderAll();
  }

  updateBalance() {
    const income = this.transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    const expenses = this.transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    this.currentBalance = income - expenses;
    
    this.elements.totalIncome.textContent = `R$ ${income.toFixed(2)}`;
    this.elements.totalExpenses.textContent = `R$ ${expenses.toFixed(2)}`;
    this.elements.currentBalance.textContent = `R$ ${this.currentBalance.toFixed(2)}`;
    this.elements.currentBalance.style.color = this.currentBalance >= 0 ? 'var(--success)' : 'var(--danger)';
  }

  updateReports() {
    if (this.balanceChart) {
      this.balanceChart.destroy();
    }

    const income = this.transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    const expenses = this.transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    this.balanceChart = new Chart(document.getElementById('balance-chart'), {
      type: 'doughnut',
      data: {
        labels: ['Receitas', 'Despesas'],
        datasets: [{
          data: [income, expenses],
          backgroundColor: [
            'rgba(16, 185, 129, 0.7)',
            'rgba(239, 68, 68, 0.7)'
          ],
          borderColor: [
            'rgba(16, 185, 129, 1)',
            'rgba(239, 68, 68, 1)'
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    });
  }

  renderAll() {
    this.renderTransactions();
    this.renderReminders();
    this.updateBalance();
    this.calculateDailyBudget();
    this.updateReports();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new FinanceApp();
});
