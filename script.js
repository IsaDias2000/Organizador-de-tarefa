// script.js - FULL FUNCTIONALITY + METAS, LEMBRETES, RELATÓRIOS
"use strict";

class FinanceApp {
  constructor() {
    this.transactions = [];
    this.fixedTransactions = [];
    this.categories = [];
    this.reminders = [];
    this.goals = [];
    this.currentBalance = 0;
    this.balanceChartInstance = null;
    this.categoriesChartInstance = null;

    this.initElements();
    this.loadData();
    this.initEventListeners();
    this.renderAll();
  }

  initElements() {
    this.elements = {
      transactionForm: document.getElementById("transaction-form"),
      transactionType: document.getElementById("transaction-type"),
      transactionDate: document.getElementById("transaction-date"),
      transactionDescription: document.getElementById("transaction-description"),
      transactionAmount: document.getElementById("transaction-amount"),
      transactionCategory: document.getElementById("transaction-category"),
      transactionParceled: document.getElementById("transaction-parceled"),
      transactionInstallments: document.getElementById("transaction-installments"),
      transactionFixed: document.getElementById("transaction-fixed"),
      transactionsContainer: document.getElementById("transactions-container"),
      currentBalance: document.getElementById("current-balance"),
      totalIncome: document.getElementById("total-income"),
      totalExpenses: document.getElementById("total-expenses"),
      balanceChart: document.getElementById("balance-chart"),
      categoriesChart: document.getElementById("categories-chart"),
      filterType: document.getElementById("filter-type"),
      filterCategory: document.getElementById("filter-category"),
      filterMonth: document.getElementById("filter-month"),
      clearFilters: document.getElementById("clear-filters"),
      // metas
      goalForm: document.getElementById("goal-form"),
      goalsContainer: document.getElementById("goals-container"),
      // lembretes
      reminderForm: document.getElementById("reminder-form"),
      activeReminders: document.getElementById("active-reminders-container"),
      completedReminders: document.getElementById("completed-reminders-container"),
      clearCompleted: document.getElementById("clear-completed"),
      // relatórios
      reportPeriod: document.getElementById("report-period")
    };
  }

  loadData() {
    this.transactions = JSON.parse(localStorage.getItem("transactions")) || [];
    this.fixedTransactions = JSON.parse(localStorage.getItem("fixedTransactions")) || [];
    this.categories = JSON.parse(localStorage.getItem("categories")) || [
      { name: "Sem Categoria", type: "both", color: "#cccccc" }
    ];
    this.reminders = JSON.parse(localStorage.getItem("reminders")) || [];
    this.goals = JSON.parse(localStorage.getItem("goals")) || [];
  }

  saveData() {
    localStorage.setItem("transactions", JSON.stringify(this.transactions));
    localStorage.setItem("fixedTransactions", JSON.stringify(this.fixedTransactions));
    localStorage.setItem("categories", JSON.stringify(this.categories));
    localStorage.setItem("reminders", JSON.stringify(this.reminders));
    localStorage.setItem("goals", JSON.stringify(this.goals));
  }

  initEventListeners() {
    this.elements.transactionForm.addEventListener("submit", (e) => {
      e.preventDefault();
      this.addTransaction();
    });
    this.elements.transactionParceled.addEventListener("change", (e) => {
      this.elements.transactionInstallments.disabled = !e.target.checked;
    });
    this.elements.filterType.addEventListener("change", () => this.renderAll());
    this.elements.filterCategory.addEventListener("change", () => this.renderAll());
    this.elements.filterMonth.addEventListener("change", () => this.renderAll());
    this.elements.clearFilters.addEventListener("click", () => this.clearFilters());

    // metas
    if (this.elements.goalForm) {
      this.elements.goalForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.addGoal();
      });
    }

    // lembretes
    if (this.elements.reminderForm) {
      this.elements.reminderForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.addReminder();
      });
    }
    if (this.elements.clearCompleted) {
      this.elements.clearCompleted.addEventListener("click", () => this.clearCompletedReminders());
    }
    if (this.elements.reportPeriod) {
      this.elements.reportPeriod.addEventListener("change", () => this.renderAll());
    }
  }

  addReminder() {
    const desc = document.getElementById("reminder-description").value.trim();
    if (!desc) return alert("Preencha a descrição do lembrete.");
    this.reminders.push({ id: Date.now(), description: desc, completed: false });
    this.saveData();
    this.renderReminders();
  }

  toggleReminder(id) {
    const reminder = this.reminders.find(r => r.id === id);
    if (reminder) {
      reminder.completed = !reminder.completed;
      this.saveData();
      this.renderReminders();
    }
  }

  clearCompletedReminders() {
    this.reminders = this.reminders.filter(r => !r.completed);
    this.saveData();
    this.renderReminders();
  }

  renderReminders() {
    this.elements.activeReminders.innerHTML = "";
    this.elements.completedReminders.innerHTML = "";
    this.reminders.forEach(reminder => {
      const li = document.createElement("li");
      li.className = reminder.completed ? "reminder-item completed" : "reminder-item";
      li.innerHTML = `
        <label>
          <input type="checkbox" ${reminder.completed ? "checked" : ""}>
          ${reminder.description}
        </label>
      `;
      li.querySelector("input").addEventListener("change", () => this.toggleReminder(reminder.id));
      (reminder.completed ? this.elements.completedReminders : this.elements.activeReminders).appendChild(li);
    });
  }

  addGoal() {
    const desc = document.getElementById("goal-description").value.trim();
    const date = document.getElementById("goal-target-date").value;
    const amount = parseFloat(document.getElementById("goal-target-amount").value);
    if (!desc || !date || isNaN(amount)) return alert("Preencha todos os campos da meta.");
    this.goals.push({ id: Date.now(), description: desc, targetDate: date, targetAmount: amount });
    this.saveData();
    this.renderGoals();
  }

  renderGoals() {
    this.elements.goalsContainer.innerHTML = "";
    this.goals.forEach(goal => {
      const div = document.createElement("div");
      div.className = "goal-item";
      div.innerHTML = `<strong>${goal.description}</strong><br><small>Meta: R$ ${goal.targetAmount.toFixed(2)} até ${goal.targetDate}</small>`;
      this.elements.goalsContainer.appendChild(div);
    });
  }

  renderAll() {
    const filtered = this.filterTransactions();
    this.updateBalance(filtered);
    this.renderTransactions(filtered);
    this.updateBalanceChart(filtered);
    this.updateCategoriesChart(filtered);
    this.renderGoals();
    this.renderReminders();
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
    if (this.balanceChartInstance) {
  this.balanceChartInstance.destroy();
}
    this.updateBalanceChart(this.transactions);
    this.updateCategoriesChart(this.transactions);
  }

  updateCategoriesDropdowns() {
    if (!this.elements.transactionCategory ||
        !this.elements.filterCategory ||
        !this.elements.filterFixedCategory) return;

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
if (category !== 'all') {
  if (category === 'none') {
    filtered = filtered.filter(t => !t.category || t.category === 'Sem Categoria');
  } else {
    filtered = filtered.filter(t => t.category === category);
  }
}this.elements.filterCategory.innerHTML = `
  <option value="all">Todas Categorias</option>
  <option value="none">Sem Categoria</option>
  ${this.categories.map(c => `
    <option value="${c.name}">${c.name}</option>
  `).join('')}
`;
    this.elements.transactionCategory.innerHTML = '<option value="">Sem categoria</option>';
    this.elements.filterCategory.innerHTML = '<option value="all">Todas Categorias</option>';
    this.elements.filterFixedCategory.innerHTML = '<option value="all">Todas Categorias</option>';
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
        return date.getFullYear() === parseInt(year) && 
         (date.getMonth() + 1) === parseInt(monthNum);
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
    this.elements.fixedContainer.appendChild(li);
    `${transaction.type === 'expense' ? '-' : '+'}R$ ${Math.abs(transaction.amount).toFixed(2)}`
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
