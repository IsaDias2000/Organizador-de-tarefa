"use strict";

class FinanceApp {
  constructor() {
    this.transactions = [];
    this.fixedTransactions = [];
    this.categories = [];
    this.reminders = [];
    this.currentBalance = 0;

    // Instâncias dos gráficos
    this.balanceChartInstance = null;
    this.categoriesChartInstance = null;

    this.initElements();
    this.loadData();
    this.initEventListeners();
    this.renderAll();
  }

  initElements() {
    // Elementos do DOM
    this.elements = {
      // Formulários
      transactionForm: document.getElementById('transaction-form'),
      reminderForm: document.getElementById('reminder-form'),
      categoryForm: document.getElementById('category-form'),

      // Inputs
      transactionType: document.getElementById('transaction-type'),
      transactionDate: document.getElementById('transaction-date'),
      transactionDescription: document.getElementById('transaction-description'),
      transactionAmount: document.getElementById('transaction-amount'),
      transactionCategory: document.getElementById('transaction-category'),
      transactionParceled: document.getElementById('transaction-parceled'),
      transactionInstallments: document.getElementById('transaction-installments'),
      transactionFixed: document.getElementById('transaction-fixed'),
      reminderDescription: document.getElementById('reminder-description'),
      newCategoryName: document.getElementById('new-category-name'),
      newCategoryColor: document.getElementById('new-category-color'),

      // Containers
      transactionsContainer: document.getElementById('transactions-container'),
      fixedContainer: document.getElementById('fixed-container'),
      activeReminders: document.getElementById('active-reminders'),
      completedReminders: document.getElementById('completed-reminders'),
      cashFlowBody: document.getElementById('cash-flow-body'),
      goalsContainer: document.getElementById('goals-container'),

      // Filtros
      filterType: document.getElementById('filter-type'),
      filterCategory: document.getElementById('filter-category'),
      filterStatus: document.getElementById('filter-status'),
      filterMonth: document.getElementById('filter-month'),
      clearFilters: document.getElementById('clear-filters'),
      filterFixedType: document.getElementById('filter-fixed-type'),
      filterFixedStatus: document.getElementById('filter-fixed-status'),
      filterFixedCategory: document.getElementById('filter-fixed-category'),

      // Sumários / Relatórios
      reportPeriodSelect: document.getElementById('reportPeriodSelect'),
      fixedExpensesSummary: document.getElementById('fixed-expenses-summary'),
      parceledExpensesSummary: document.getElementById('parceled-expenses-summary'),
      fixedIncomeSummary: document.getElementById('fixed-income-summary'),
      fixedExpenseSummary: document.getElementById('fixed-expense-summary'),

      // Displays de saldo e totais
      currentBalance: document.getElementById('current-balance'),
      totalIncome: document.getElementById('total-income'),
      totalExpenses: document.getElementById('total-expenses'),

      // Elementos dos Gráficos
      balanceChart: document.getElementById('balance-chart'),
      categoriesChart: document.getElementById('categories-chart'),

      // Botões
      addCategoryBtn: document.getElementById('add-category-btn'),
      themeToggle: document.getElementById('theme-toggle'),
      clearTransactions: document.getElementById('clear-transactions'),
      clearCompleted: document.getElementById('clear-completed'),
      confirmClear: document.getElementById('confirm-clear'),
      cancelClear: document.getElementById('cancel-clear'),

      // Tabs
      tabButtons: document.querySelectorAll('.tab-button'),
      tabContents: document.querySelectorAll('.tab-content'),

      // Modais
      confirmClearModal: document.getElementById('confirm-clear-modal'),
      categoryModal: document.getElementById('category-modal'),
      closeModal: document.querySelector('.close-modal')
    };

    // Configura data padrão para a transação
    const today = new Date();
    if (this.elements.transactionDate) {
      this.elements.transactionDate.value = today.toISOString().split('T')[0];
    }
  }

  loadData() {
    // Carrega os dados do localStorage (ou usa valores padrão)
    this.transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    this.fixedTransactions = JSON.parse(localStorage.getItem('fixedTransactions')) || [];
    this.categories = JSON.parse(localStorage.getItem('categories')) || [
      { name: 'Alimentação', type: 'expense', color: '#ef4444' },
      { name: 'Moradia', type: 'expense', color: '#3b82f6' },
      { name: 'Transporte', type: 'expense', color: '#10b981' },
      { name: 'Lazer', type: 'expense', color: '#f59e0b' },
      { name: 'Salário', type: 'income', color: '#8b5cf6' }
    ];
    this.reminders = JSON.parse(localStorage.getItem('reminders')) || [];

    // Verifica contas fixas do mês atual
    this.checkFixedTransactions();
  }

  saveData() {
    localStorage.setItem('transactions', JSON.stringify(this.transactions));
    localStorage.setItem('fixedTransactions', JSON.stringify(this.fixedTransactions));
    localStorage.setItem('categories', JSON.stringify(this.categories));
    localStorage.setItem('reminders', JSON.stringify(this.reminders));
  }

  initEventListeners() {
    // Eventos para as Tabs
    this.elements.tabButtons.forEach(button => {
      button.addEventListener('click', () => this.switchTab(button));
    });

    // Envio dos formulários
    this.elements.transactionForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.addTransaction();
    });
    this.elements.reminderForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.addReminder();
    });
    this.elements.categoryForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.addCategory();
    });

    // Habilita/desabilita o input de parcelas
    this.elements.transactionParceled.addEventListener('change', (e) => {
      this.elements.transactionInstallments.disabled = !e.target.checked;
    });

    // Eventos dos filtros
    this.elements.filterType.addEventListener('change', () => this.filterTransactions());
    this.elements.filterCategory.addEventListener('change', () => this.filterTransactions());
    this.elements.filterStatus.addEventListener('change', () => this.filterTransactions());
    this.elements.filterMonth.addEventListener('change', () => this.filterTransactions());
    this.elements.clearFilters.addEventListener('click', () => this.clearFilters());
    this.elements.filterFixedType.addEventListener('change', () => this.filterFixedTransactions());
    this.elements.filterFixedStatus.addEventListener('change', () => this.filterFixedTransactions());
    this.elements.filterFixedCategory.addEventListener('change', () => this.filterFixedTransactions());

    // Atualiza os relatórios ao alterar o período
    if (this.elements.reportPeriodSelect) {
      this.elements.reportPeriodSelect.addEventListener('change', () => this.updateReports());
    }

    // Tema claro/escuro
    this.elements.themeToggle.addEventListener('click', () => {
      document.documentElement.classList.toggle('light-mode');
      localStorage.setItem('theme', document.documentElement.classList.contains('light-mode') ? 'light' : 'dark');
    });

    // Abre o modal para adicionar categoria
    this.elements.addCategoryBtn.addEventListener('click', () => {
      this.elements.categoryModal.classList.add('active');
    });

    // Modal de confirmação de limpeza de transações
    this.elements.clearTransactions.addEventListener('click', () => {
      this.elements.confirmClearModal.classList.add('active');
    });
    this.elements.confirmClear.addEventListener('click', () => {
      this.clearAllTransactions();
      this.elements.confirmClearModal.classList.remove('active');
    });
    this.elements.cancelClear.addEventListener('click', () => {
      this.elements.confirmClearModal.classList.remove('active');
    });

    // Limpa lembretes concluídos
    this.elements.clearCompleted.addEventListener('click', () => {
      this.clearCompletedReminders();
    });

    // Fechamento dos modais
    this.elements.closeModal.addEventListener('click', () => {
      this.elements.categoryModal.classList.remove('active');
    });
    document.querySelectorAll('.modal').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.remove('active');
        }
      });
    });

    // Verifica o tema salvo
    if (localStorage.getItem('theme') === 'light') {
      document.documentElement.classList.add('light-mode');
    }
  }

  switchTab(button) {
    this.elements.tabButtons.forEach(btn => btn.classList.remove('active'));
    this.elements.tabContents.forEach(content => content.classList.remove('active'));

    button.classList.add('active');
    const tabId = button.getAttribute('data-tab');
    document.getElementById(tabId).classList.add('active');

    if (tabId === 'fixed') {
      this.filterFixedTransactions();
    } else if (tabId === 'reminders') {
      this.renderReminders();
    } else if (tabId === 'reports') {
      this.updateReports();
    }
  }

  addTransaction() {
    const type = this.elements.transactionType.value;
    const date = this.elements.transactionDate.value;
    const description = this.elements.transactionDescription.value.trim();
    const amount = parseFloat(this.elements.transactionAmount.value);
    // Agora a categoria é opcional; se não for selecionada, ficará como string vazia.
    const category = this.elements.transactionCategory.value || "";
    const isParceled = this.elements.transactionParceled.checked;
    const installments = isParceled ? parseInt(this.elements.transactionInstallments.value) : 1;
    const isFixed = this.elements.transactionFixed.checked;

    if (!description || isNaN(amount)) {
      alert('Preencha todos os campos corretamente!');
      return;
    }

    const newTransaction = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      type,
      date,
      description,
      // Se for despesa, garante o valor negativo; se for receita, valor positivo.
      amount: type === 'expense' ? -Math.abs(amount) : Math.abs(amount),
      category, // Campo opcional
      installments,
      installmentNumber: 1,
      fixed: isFixed,
      paid: false,
      createdAt: new Date().toISOString()
    };

    this.transactions.push(newTransaction);

    if (isParceled && installments > 1) {
      const transactionDate = new Date(date);
      for (let i = 2; i <= installments; i++) {
        const nextMonth = new Date(transactionDate);
        nextMonth.setMonth(transactionDate.getMonth() + (i - 1));
        const installment = {
          ...newTransaction,
          id: Date.now() + Math.floor(Math.random() * 1000) + i,
          date: nextMonth.toISOString().split('T')[0],
          installmentNumber: i,
          paid: false
        };
        this.transactions.push(installment);
      }
    }

    if (isFixed) {
      this.fixedTransactions.push({ ...newTransaction, originalId: newTransaction.id });
    }

    this.saveData();
    this.renderAll();
    this.elements.transactionForm.reset();
    this.elements.transactionDate.value = new Date().toISOString().split('T')[0];
  }

  deleteTransaction(id) {
    if (confirm('Deseja realmente excluir este lançamento?')) {
      this.transactions = this.transactions.filter(t => t.id !== id);
      this.fixedTransactions = this.fixedTransactions.filter(t => t.id !== id);
      this.saveData();
      this.renderAll();
    }
  }

  clearAllTransactions() {
    this.transactions = [];
    this.fixedTransactions = [];
    this.saveData();
    this.renderAll();
  }

  checkFixedTransactions() {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const lastCheck = localStorage.getItem('lastFixedCheck');
    if (lastCheck) {
      const [year, month] = lastCheck.split('-').map(Number);
      if (year === currentYear && month === currentMonth) {
        return;
      }
    }

    const addedTransactions = [];
    this.fixedTransactions.forEach(transaction => {
      const transactionDate = new Date(transaction.date);
      if (transactionDate.getMonth() !== currentMonth || transactionDate.getFullYear() !== currentYear) {
        const newDate = new Date(currentYear, currentMonth, transactionDate.getDate());
        const newTransaction = {
          ...transaction,
          id: Date.now() + Math.floor(Math.random() * 1000),
          date: newDate.toISOString().split('T')[0],
          paid: false
        };
        this.transactions.push(newTransaction);
        addedTransactions.push(newTransaction);
      }
    });

    localStorage.setItem('lastFixedCheck', `${currentYear}-${currentMonth}`);
    this.saveData();
    if (addedTransactions.length > 0) {
      this.renderAll();
    }
  }

  addReminder() {
    const description = this.elements.reminderDescription.value.trim();
    if (!description) {
      alert('Digite uma descrição para o lembrete!');
      return;
    }
    const newReminder = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      description,
      completed: false,
      createdAt: new Date().toISOString()
    };
    this.reminders.push(newReminder);
    this.saveData();
    this.renderReminders();
    this.elements.reminderDescription.value = '';
  }

  deleteReminder(id) {
    this.reminders = this.reminders.filter(r => r.id !== id);
    this.saveData();
    this.renderReminders();
  }

  clearCompletedReminders() {
    if (confirm('Deseja realmente limpar todos os lembretes concluídos?')) {
      this.reminders = this.reminders.filter(r => !r.completed);
      this.saveData();
      this.renderReminders();
    }
  }

  toggleReminder(id) {
    const reminder = this.reminders.find(r => r.id === id);
    if (reminder) {
      reminder.completed = !reminder.completed;
      this.saveData();
      this.renderReminders();
    }
  }

  addCategory() {
    const name = this.elements.newCategoryName.value.trim();
    const color = this.elements.newCategoryColor.value;
    if (!name) {
      alert('Digite um nome para a categoria!');
      return;
    }
    if (this.categories.some(c => c.name.toLowerCase() === name.toLowerCase())) {
      alert('Já existe uma categoria com este nome!');
      return;
    }
    const newCategory = { name, color };
    this.categories.push(newCategory);
    this.saveData();
    this.updateCategoriesDropdowns();
    this.elements.categoryModal.classList.remove('active');
    this.elements.newCategoryName.value = '';
  }

  renderAll() {
    this.updateCategoriesDropdowns();
    this.filterTransactions();
    this.filterFixedTransactions();
    this.updateBalance();
    this.updateCashFlow();
    this.updateReports();
    this.renderReminders();
    // Atualiza os gráficos com base nas transações
    this.updateBalanceChart(this.transactions);
    this.updateCategoriesChart(this.transactions);
  }

  updateCategoriesDropdowns() {
    if (!this.elements.transactionCategory ||
        !this.elements.filterCategory ||
        !this.elements.filterFixedCategory) return;

    this.elements.transactionCategory.innerHTML = '<option value="">Sem categoria</option>';
    this.elements.filterCategory.innerHTML = '<option value="all">Todas Categorias</option>';
    this.elements.filterFixedCategory.innerHTML = '<option value="all">Todas Categorias</option>';

    this.categories.forEach(category => {
      const option1 = document.createElement('option');
      option1.value = category.name;
      option1.textContent = category.name;
      option1.style.color = category.color;
      this.elements.transactionCategory.appendChild(option1);

      const option2 = document.createElement('option');
      option2.value = category.name;
      option2.textContent = category.name;
      option2.style.color = category.color;
      this.elements.filterCategory.appendChild(option2);

      const option3 = document.createElement('option');
      option3.value = category.name;
      option3.textContent = category.name;
      option3.style.color = category.color;
      this.elements.filterFixedCategory.appendChild(option3);
    });
  }

  filterTransactions() {
    let filtered = [...this.transactions];
    const type = this.elements.filterType.value;
    const category = this.elements.filterCategory.value;
    const month = this.elements.filterMonth.value;

    if (type !== 'all') {
      filtered = filtered.filter(t => t.type === type);
    }
    if (category !== 'all') {
      filtered = filtered.filter(t => t.category === category);
    }
    if (month) {
      const [year, monthNum] = month.split('-');
      filtered = filtered.filter(t => {
        const date = new Date(t.date);
        return date.getFullYear() === parseInt(year) && (date.getMonth() + 1) === parseInt(monthNum);
      });
    }
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    this.updateTransactionsSummaries(filtered);
    this.renderTransactions(filtered);
    return filtered;
  }

  updateTransactionsSummaries(transactions) {
    const fixedExpenses = transactions
      .filter(t => t.type === 'expense' && t.fixed)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const parceledExpenses = transactions
      .filter(t => t.type === 'expense' && t.installments > 1)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    if (this.elements.fixedExpensesSummary && this.elements.parceledExpensesSummary) {
      this.elements.fixedExpensesSummary.querySelector('strong').textContent = `R$ ${fixedExpenses.toFixed(2)}`;
      this.elements.parceledExpensesSummary.querySelector('strong').textContent = `R$ ${parceledExpenses.toFixed(2)}`;
    }
  }

  renderTransactions(transactions) {
    this.elements.transactionsContainer.innerHTML = '';
    transactions.forEach(transaction => {
      const div = document.createElement('div');
      div.className = `transaction-item ${transaction.type} ${transaction.fixed ? 'fixed' : ''}`;
      div.innerHTML = `
        <div class="transaction-info">
          <div class="transaction-description">${transaction.description}</div>
          <div class="transaction-meta">
            <span>${new Date(transaction.date).toLocaleDateString()}</span>
            ${transaction.category ? `<span>${transaction.category}</span>` : ''}
          </div>
        </div>
        <div class="transaction-amount ${transaction.type}">
          R$ ${Math.abs(transaction.amount).toFixed(2)}
        </div>
        <div class="transaction-actions">
          <button class="delete-btn" data-id="${transaction.id}">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      `;
      div.querySelector('.delete-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        this.deleteTransaction(transaction.id);
      });
      this.elements.transactionsContainer.appendChild(div);
    });
  }

  filterFixedTransactions() {
    let filtered = [...this.fixedTransactions];
    const type = this.elements.filterFixedType.value;
    const status = this.elements.filterFixedStatus.value;
    const category = this.elements.filterFixedCategory.value;

    if (type !== 'all') {
      filtered = filtered.filter(t => t.type === type);
    }
    if (status === 'paid') {
      filtered = filtered.filter(t => t.paid);
    } else if (status === 'unpaid') {
      filtered = filtered.filter(t => !t.paid);
    }
    if (category !== 'all') {
      filtered = filtered.filter(t => t.category === category);
    }
    this.updateFixedSummaries(filtered);
    this.renderFixedTransactions(filtered);
  }

  updateFixedSummaries(fixedTransactions) {
    const fixedIncome = fixedTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const fixedExpense = fixedTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const totalIncome = this.transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const incomePercentage = totalIncome > 0 ? ((fixedIncome / totalIncome) * 100).toFixed(1) : '0';

    if (this.elements.fixedIncomeSummary) {
      this.elements.fixedIncomeSummary.querySelector('strong').textContent = `R$ ${fixedIncome.toFixed(2)}`;
      this.elements.fixedIncomeSummary.querySelector('small').textContent = `${incomePercentage}% da receita total`;
    }
    if (this.elements.fixedExpenseSummary) {
      this.elements.fixedExpenseSummary.querySelector('strong').textContent = `R$ ${fixedExpense.toFixed(2)}`;
    }
  }

  renderFixedTransactions(transactions) {
    this.elements.fixedContainer.innerHTML = '';
    transactions.forEach(transaction => {
      const li = document.createElement('li');
      li.className = `transaction-item fixed ${transaction.paid ? 'paid' : ''}`;
      li.innerHTML = `
        <div class="transaction-info">
          <div class="transaction-description">${transaction.description}</div>
          <div class="transaction-meta">
            <span>Todo dia ${new Date(transaction.date).getDate()}</span>
            ${transaction.category ? `<span>${transaction.category}</span>` : ''}
          </div>
        </div>
        <div class="transaction-amount ${transaction.type}">
          ${transaction.type === 'expense' ? '-' : ''}R$ ${Math.abs(transaction.amount).toFixed(2)}
        </div>
        <div class="transaction-actions">
          <button class="delete-btn" data-id="${transaction.id}">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      `;
      li.querySelector('.delete-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        this.deleteTransaction(transaction.id);
      });
      this.elements.fixedContainer.appendChild(li);
    });
  }

  renderReminders() {
    this.elements.activeReminders.innerHTML = '';
    this.elements.completedReminders.innerHTML = '';

    const activeReminders = this.reminders.filter(r => !r.completed);
    const completedReminders = this.reminders.filter(r => r.completed);

    activeReminders.forEach(reminder => {
      const li = document.createElement('li');
      li.className = 'reminder-item';
      li.innerHTML = `
        <label>
          <input type="checkbox" class="reminder-checkbox" data-id="${reminder.id}">
          ${reminder.description}
        </label>
        <div class="reminder-actions">
          <button class="delete-btn" data-id="${reminder.id}">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      `;
      li.querySelector('.reminder-checkbox').addEventListener('change', () => {
        this.toggleReminder(reminder.id);
      });
      li.querySelector('.delete-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        this.deleteReminder(reminder.id);
      });
      this.elements.activeReminders.appendChild(li);
    });

    completedReminders.forEach(reminder => {
      const li = document.createElement('li');
      li.className = 'reminder-item completed';
      li.innerHTML = `
        <label>
          <input type="checkbox" class="reminder-checkbox" data-id="${reminder.id}" checked>
          ${reminder.description}
        </label>
        <div class="reminder-actions">
          <button class="delete-btn" data-id="${reminder.id}">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      `;
      li.querySelector('.reminder-checkbox').addEventListener('change', () => {
        this.toggleReminder(reminder.id);
      });
      li.querySelector('.delete-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        this.deleteReminder(reminder.id);
      });
      this.elements.completedReminders.appendChild(li);
    });
  }

  updateBalance() {
    const income = this.transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const expenses = this.transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    this.currentBalance = income - expenses;

    if (this.elements.totalIncome) {
      this.elements.totalIncome.textContent = `R$ ${income.toFixed(2)}`;
    }
    if (this.elements.totalExpenses) {
      this.elements.totalExpenses.textContent = `R$ ${expenses.toFixed(2)}`;
    }
    if (this.elements.currentBalance) {
      this.elements.currentBalance.textContent = `R$ ${this.currentBalance.toFixed(2)}`;
      this.elements.currentBalance.style.color = this.currentBalance >= 0 ? 'var(--success)' : 'var(--danger)';
    }
  }

  updateCashFlow() {
    const sortedTransactions = [...this.transactions].sort((a, b) => new Date(a.date) - new Date(b.date));
    let runningBalance = 0;
    this.elements.cashFlowBody.innerHTML = '';

    sortedTransactions.forEach(transaction => {
      runningBalance += transaction.amount;
      const row = document.createElement('tr');
      row.className = `${transaction.type}-row ${transaction.fixed ? 'fixed-row' : ''} ${transaction.installments > 1 ? 'parceled-row' : ''}`;
      row.innerHTML = `
        <td>${new Date(transaction.date).toLocaleDateString()}</td>
        <td>
          ${transaction.description}
          ${transaction.installments > 1 ? ` (${transaction.installmentNumber}/${transaction.installments})` : ''}
        </td>
        <td>${transaction.category || '-'}</td>
        <td>${transaction.type === 'expense' ? '-' : ''}R$ ${Math.abs(transaction.amount).toFixed(2)}</td>
        <td>R$ ${runningBalance.toFixed(2)}</td>
      `;
      this.elements.cashFlowBody.appendChild(row);
    });
  }

  updateReports() {
    const period = this.elements.reportPeriodSelect ? this.elements.reportPeriodSelect.value : 'all';
    let transactions = [];
    switch (period) {
      case 'current-month':
        transactions = this.getCurrentMonthTransactions();
        break;
      case 'last-month':
        transactions = this.getLastMonthTransactions();
        break;
      case 'last-3-months':
        transactions = this.getLastThreeMonthsTransactions();
        break;
      default:
        transactions = this.transactions;
    }
    this.updateBalanceChart(transactions);
    this.updateCategoriesChart(transactions);
  }

  getCurrentMonthTransactions() {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    return this.transactions.filter(t => {
      const date = new Date(t.date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });
  }

  getLastMonthTransactions() {
    const currentDate = new Date();
    currentDate.setMonth(currentDate.getMonth() - 1);
    const lastMonth = currentDate.getMonth();
    const year = currentDate.getFullYear();
    return this.transactions.filter(t => {
      const date = new Date(t.date);
      return date.getMonth() === lastMonth && date.getFullYear() === year;
    });
  }

  getLastThreeMonthsTransactions() {
    const currentDate = new Date();
    const threeMonthsAgo = new Date(currentDate);
    threeMonthsAgo.setMonth(currentDate.getMonth() - 3);
    return this.transactions.filter(t => {
      const date = new Date(t.date);
      return date >= threeMonthsAgo && date <= currentDate;
    });
  }

  updateBalanceChart(transactions) {
    if (!transactions || transactions.length === 0) return;
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const expenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    if (this.balanceChartInstance) {
      this.balanceChartInstance.destroy();
    }
    const ctx = this.elements.balanceChart.getContext('2d');
    this.balanceChartInstance = new Chart(ctx, {
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

  updateCategoriesChart(transactions) {
    if (!transactions || transactions.length === 0) return;
    const expenses = transactions.filter(t => t.type === 'expense');
    const categoriesMap = {};
    expenses.forEach(expense => {
      const category = expense.category || 'Outros';
      if (!categoriesMap[category]) {
        categoriesMap[category] = 0;
      }
      categoriesMap[category] += Math.abs(expense.amount);
    });
    const categories = Object.keys(categoriesMap);
    const amounts = Object.values(categoriesMap);

    if (this.categoriesChartInstance) {
      this.categoriesChartInstance.destroy();
    }
    this.categoriesChartInstance = new Chart(this.elements.categoriesChart.getContext('2d'), {
      type: 'bar',
      data: {
        labels: categories,
        datasets: [{
          label: 'Despesas por Categoria',
          data: amounts,
          backgroundColor: 'rgba(239, 68, 68, 0.7)',
          borderColor: 'rgba(239, 68, 68, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }

  clearFilters() {
    this.elements.filterType.value = 'all';
    this.elements.filterCategory.value = 'all';
    this.elements.filterStatus.value = 'all';
    this.elements.filterMonth.value = '';
    this.filterTransactions();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new FinanceApp();
  app.renderAll();
  app.updateBalance();

  setInterval(() => app.renderAll(), 5000);
  setInterval(() => app.checkFixedTransactions(), 24 * 60 * 60 * 1000);
});
