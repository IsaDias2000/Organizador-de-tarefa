class FinanceApp {
  constructor() {
    this.transactions = [];
    this.fixedTransactions = [];
    this.categories = [];
    this.reminders = [];
    this.goals = [];
    this.currentBalance = 0;
    this.payday = null;
    this.balanceChart = null;
    this.categoriesChart = null;
    this.monthlyTrendChart = null;

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
      completedReminders: document.getElementById('completed-reminders'),
      goalsContainer: document.getElementById('goals-container'),
      cashFlowBody: document.getElementById('cash-flow-body'),
      filterType: document.getElementById('filter-type'),
      filterCategory: document.getElementById('filter-category'),
      filterStatus: document.getElementById('filter-status'),
      filterMonth: document.getElementById('filter-month'),
      clearFilters: document.getElementById('clear-filters'),
      currentBalance: document.getElementById('current-balance'),
      totalIncome: document.getElementById('total-income'),
      totalExpenses: document.getElementById('total-expenses'),
      addCategoryBtn: document.getElementById('add-category-btn'),
      clearTransactions: document.getElementById('clear-transactions'),
      tabButtons: document.querySelectorAll('.tab-button'),
      tabContents: document.querySelectorAll('.tab-content'),
      updateCalculation: document.getElementById('update-calculation')
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
    this.goals = JSON.parse(localStorage.getItem('goals')) || [];

    this.checkFixedTransactions();
  }

  saveData() {
    localStorage.setItem('transactions', JSON.stringify(this.transactions));
    localStorage.setItem('fixedTransactions', JSON.stringify(this.fixedTransactions));
    localStorage.setItem('categories', JSON.stringify(this.categories));
    localStorage.setItem('reminders', JSON.stringify(this.reminders));
    localStorage.setItem('goals', JSON.stringify(this.goals));
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

    // Parcelamento
    this.elements.transactionParceled.addEventListener('change', (e) => {
      this.elements.transactionInstallments.disabled = !e.target.checked;
    });

    // Botão para atualizar cálculo
    this.elements.updateCalculation.addEventListener('click', () => {
      this.calculateDailyBudget();
    });

    // Filtros
    this.elements.filterType.addEventListener('change', () => this.filterTransactions());
    this.elements.filterCategory.addEventListener('change', () => this.filterTransactions());
    this.elements.filterStatus.addEventListener('change', () => this.filterTransactions());
    this.elements.filterMonth.addEventListener('change', () => this.filterTransactions());
    this.elements.clearFilters.addEventListener('click', () => this.clearFilters());

    // Verifica vencimentos periodicamente
    setInterval(() => this.checkDueDates(), 60 * 60 * 1000);
  }

  switchTab(button) {
    this.elements.tabButtons.forEach(btn => btn.classList.remove('active'));
    this.elements.tabContents.forEach(content => content.classList.remove('active'));
    
    button.classList.add('active');
    const tabId = button.getAttribute('data-tab');
    document.getElementById(tabId).classList.add('active');
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

  renderTransactions(transactions) {
    this.elements.transactionsContainer.innerHTML = '';
    
    transactions.forEach(transaction => {
      const li = document.createElement('li');
      li.className = `transaction-item ${transaction.type} ${transaction.status} ${transaction.paid ? 'paid' : ''}`;
      
      let dueBadge = '';
      if (transaction.dueDate && !transaction.paid) {
        const dueDate = new Date(transaction.dueDate);
        const today = new Date();
        const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
        
        if (daysUntilDue <= 3 && daysUntilDue >= 0) {
          dueBadge = `<span class="due-badge due-soon" title="Vence em ${daysUntilDue} dias"><i class="fas fa-exclamation-circle"></i></span>`;
        } else if (daysUntilDue < 0) {
          dueBadge = `<span class="due-badge due-late" title="Vencido há ${Math.abs(daysUntilDue)} dias"><i class="fas fa-exclamation-triangle"></i></span>`;
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

  filterTransactions() {
    const type = this.elements.filterType.value;
    const category = this.elements.filterCategory.value;
    const status = this.elements.filterStatus.value;
    const month = this.elements.filterMonth.value;
    
    let filtered = [...this.transactions];
    
    if (type !== 'all') filtered = filtered.filter(t => t.type === type);
    if (category !== 'all') filtered = filtered.filter(t => t.category === category);
    
    if (status === 'fixed') {
      filtered = filtered.filter(t => t.fixed);
    } else if (status === 'parceled') {
      filtered = filtered.filter(t => t.installments > 1);
    } else if (status === 'pending') {
      filtered = filtered.filter(t => !t.paid);
    }
    
    if (month) {
      const [year, monthNum] = month.split('-');
      filtered = filtered.filter(t => {
        const date = new Date(t.date);
        return date.getFullYear() === parseInt(year) && 
               date.getMonth() + 1 === parseInt(monthNum);
      });
    }
    
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    this.renderTransactions(filtered);
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

  updateCategoriesDropdowns() {
    this.elements.transactionCategory.innerHTML = '<option value="">Sem categoria</option>';
    this.elements.filterCategory.innerHTML = '<option value="all">Todas Categorias</option>';
    
    this.categories.forEach(category => {
      const option = document.createElement('option');
      option.value = category.name;
      option.textContent = category.name;
      option.style.color = category.color;
      this.elements.transactionCategory.appendChild(option);
      
      const filterOption = document.createElement('option');
      filterOption.value = category.name;
      filterOption.textContent = category.name;
      this.elements.filterCategory.appendChild(filterOption);
    });
  }

  clearFilters() {
    this.elements.filterType.value = 'all';
    this.elements.filterCategory.value = 'all';
    this.elements.filterStatus.value = 'all';
    this.elements.filterMonth.value = '';
    this.filterTransactions();
  }

  renderAll() {
    this.updateCategoriesDropdowns();
    this.filterTransactions();
    this.updateBalance();
    this.calculateDailyBudget();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new FinanceApp();
});
