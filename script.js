class FinanceApp {
  constructor() {
    this.transactions = [];
    this.fixedTransactions = [];
    this.categories = [];
    this.currentBalance = 0;
    
    this.initElements();
    this.loadData();
    this.initEventListeners();
    this.renderAll();
  }

  initElements() {
    // Elementos do DOM
    this.elements = {
      transactionForm: document.getElementById('transaction-form'),
      transactionType: document.getElementById('transaction-type'),
      transactionDate: document.getElementById('transaction-date'),
      transactionDescription: document.getElementById('transaction-description'),
      transactionAmount: document.getElementById('transaction-amount'),
      transactionCategory: document.getElementById('transaction-category'),
      transactionParceled: document.getElementById('transaction-parceled'),
      transactionInstallments: document.getElementById('transaction-installments'),
      transactionFixed: document.getElementById('transaction-fixed'),
      transactionsContainer: document.getElementById('transactions-container'),
      fixedContainer: document.getElementById('fixed-container'),
      cashFlowBody: document.getElementById('cash-flow-body'),
      filterType: document.getElementById('filter-type'),
      filterCategory: document.getElementById('filter-category'),
      filterStatus: document.getElementById('filter-status'),
      filterMonth: document.getElementById('filter-month'),
      clearFilters: document.getElementById('clear-filters'),
      filterFixedStatus: document.getElementById('filter-fixed-status'),
      filterFixedCategory: document.getElementById('filter-fixed-category'),
      reportPeriodSelect: document.getElementById('report-period-select'),
      currentBalance: document.getElementById('current-balance'),
      totalIncome: document.getElementById('total-income'),
      totalExpenses: document.getElementById('total-expenses'),
      themeToggle: document.getElementById('theme-toggle'),
      tabButtons: document.querySelectorAll('.tab-button'),
      tabContents: document.querySelectorAll('.tab-content'),
      balanceChart: document.getElementById('balance-chart'),
      categoriesChart: document.getElementById('categories-chart')
    };

    // Configura data padrão para hoje
    const today = new Date();
    this.elements.transactionDate.value = today.toISOString().split('T')[0];
  }

  loadData() {
    // Carrega dados do localStorage
    this.transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    this.fixedTransactions = JSON.parse(localStorage.getItem('fixedTransactions')) || [];
    this.categories = JSON.parse(localStorage.getItem('categories')) || [
      { name: 'Alimentação', color: '#ef4444' },
      { name: 'Moradia', color: '#3b82f6' },
      { name: 'Transporte', color: '#10b981' },
      { name: 'Lazer', color: '#f59e0b' },
      { name: 'Salário', color: '#8b5cf6' }
    ];

    // Verifica contas fixas do mês atual
    this.checkFixedTransactions();
  }

  saveData() {
    localStorage.setItem('transactions', JSON.stringify(this.transactions));
    localStorage.setItem('fixedTransactions', JSON.stringify(this.fixedTransactions));
    localStorage.setItem('categories', JSON.stringify(this.categories));
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

    // Filtros
    this.elements.filterType.addEventListener('change', () => this.filterTransactions());
    this.elements.filterCategory.addEventListener('change', () => this.filterTransactions());
    this.elements.filterStatus.addEventListener('change', () => this.filterTransactions());
    this.elements.filterMonth.addEventListener('change', () => this.filterTransactions());
    this.elements.clearFilters.addEventListener('click', () => this.clearFilters());
    
    this.elements.filterFixedStatus.addEventListener('change', () => this.filterFixedTransactions());
    this.elements.filterFixedCategory.addEventListener('change', () => this.filterFixedTransactions());

    // Relatórios
    this.elements.reportPeriodSelect.addEventListener('change', () => this.updateReports());

    // Tema escuro/claro
    this.elements.themeToggle.addEventListener('click', () => {
      document.documentElement.classList.toggle('light-mode');
      localStorage.setItem('theme', document.documentElement.classList.contains('light-mode') ? 'light' : 'dark');
    });

    // Verifica tema salvo
    if (localStorage.getItem('theme') === 'light') {
      document.documentElement.classList.add('light-mode');
    }
  }

  switchTab(button) {
    // Remove classe active de todas as tabs
    this.elements.tabButtons.forEach(btn => btn.classList.remove('active'));
    this.elements.tabContents.forEach(content => content.classList.remove('active'));
    
    // Adiciona classe active na tab selecionada
    button.classList.add('active');
    const tabId = button.getAttribute('data-tab');
    document.getElementById(tabId).classList.add('active');
    
    // Atualiza os dados da tab
    if (tabId === 'fixed') {
      this.filterFixedTransactions();
    } else if (tabId === 'reports') {
      this.updateReports();
    }
  }

  addTransaction() {
    const type = this.elements.transactionType.value;
    const date = this.elements.transactionDate.value;
    const description = this.elements.transactionDescription.value.trim();
    const amount = parseFloat(this.elements.transactionAmount.value);
    const category = this.elements.transactionCategory.value;
    const isParceled = this.elements.transactionParceled.checked;
    const installments = isParceled ? parseInt(this.elements.transactionInstallments.value) : 1;
    const isFixed = this.elements.transactionFixed.checked;

    // Validação básica
    if (!description || isNaN(amount)) {
      alert('Preencha todos os campos corretamente!');
      return;
    }

    const newTransaction = {
      id: Date.now(),
      type,
      date,
      description,
      amount: type === 'expense' ? -Math.abs(amount) : Math.abs(amount),
      category,
      installments,
      installmentNumber: 1,
      fixed: isFixed,
      paid: false,
      createdAt: new Date().toISOString()
    };

    // Adiciona transação principal
    this.transactions.push(newTransaction);

    // Se for parcelado, cria as parcelas futuras
    if (isParceled && installments > 1) {
      const transactionDate = new Date(date);
      
      for (let i = 2; i <= installments; i++) {
        const nextMonth = new Date(transactionDate);
        nextMonth.setMonth(transactionDate.getMonth() + (i - 1));
        
        const installment = {
          ...newTransaction,
          id: Date.now() + i,
          date: nextMonth.toISOString().split('T')[0],
          installmentNumber: i,
          paid: false
        };
        
        this.transactions.push(installment);
      }
    }

    // Se for fixa, adiciona à lista de contas fixas
    if (isFixed) {
      this.fixedTransactions.push({
        ...newTransaction,
        originalId: newTransaction.id
      });
    }

    // Salva e atualiza a interface
    this.saveData();
    this.renderAll();
    this.elements.transactionForm.reset();
    
    // Reseta para data atual
    this.elements.transactionDate.value = new Date().toISOString().split('T')[0];
  }

  checkFixedTransactions() {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    // Verifica se já foi executado este mês
    const lastCheck = localStorage.getItem('lastFixedCheck');
    if (lastCheck && parseInt(lastCheck.split('-')[0]) === currentYear && parseInt(lastCheck.split('-')[1]) === currentMonth) {
      return;
    }
    
    // Adiciona contas fixas para o mês atual
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
    
    // Marca como verificado este mês
    localStorage.setItem('lastFixedCheck', `${currentYear}-${currentMonth}`);
    this.saveData();
    
    if (addedTransactions.length > 0) {
      this.renderAll();
    }
  }

  renderAll() {
    this.updateCategoriesDropdowns();
    this.filterTransactions();
    this.filterFixedTransactions();
    this.updateBalance();
    this.updateCashFlow();
    this.updateReports();
  }

  updateCategoriesDropdowns() {
    // Atualiza dropdown de categorias
    this.elements.transactionCategory.innerHTML = '<option value="">Sem categoria</option>';
    this.elements.filterCategory.innerHTML = '<option value="all">Todas Categorias</option>';
    this.elements.filterFixedCategory.innerHTML = '<option value="all">Todas Categorias</option>';
    
    this.categories.forEach(category => {
      const option1 = document.createElement('option');
      option1.value = category.name;
      option1.textContent = category.name;
      this.elements.transactionCategory.appendChild(option1);
      
      const option2 = document.createElement('option');
      option2.value = category.name;
      option2.textContent = category.name;
      this.elements.filterCategory.appendChild(option2);
      
      const option3 = document.createElement('option');
      option3.value = category.name;
      option3.textContent = category.name;
      this.elements.filterFixedCategory.appendChild(option3);
    });
  }

  filterTransactions() {
    const type = this.elements.filterType.value;
    const category = this.elements.filterCategory.value;
    const status = this.elements.filterStatus.value;
    const month = this.elements.filterMonth.value;
    
    let filtered = [...this.transactions];
    
    // Filtra por tipo
    if (type !== 'all') {
      filtered = filtered.filter(t => t.type === type);
    }
    
    // Filtra por categoria
    if (category !== 'all') {
      filtered = filtered.filter(t => t.category === category);
    }
    
    // Filtra por status
    if (status === 'fixed') {
      filtered = filtered.filter(t => t.fixed);
    } else if (status === 'parceled') {
      filtered = filtered.filter(t => t.installments > 1);
    }
    
    // Filtra por mês/ano
    if (month) {
      const [year, monthNum] = month.split('-');
      filtered = filtered.filter(t => {
        const date = new Date(t.date);
        return date.getFullYear() === parseInt(year) && 
               date.getMonth() + 1 === parseInt(monthNum);
      });
    }
    
    // Ordena por data (mais recente primeiro)
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Renderiza as transações filtradas
    this.renderTransactions(filtered);
    
    return filtered;
  }

  renderTransactions(transactions) {
    this.elements.transactionsContainer.innerHTML = '';
    
    transactions.forEach(transaction => {
      const li = document.createElement('li');
      li.className = `transaction-item ${transaction.type} ${transaction.fixed ? 'fixed' : ''} ${transaction.installments > 1 ? 'parceled' : ''} ${transaction.paid ? 'paid' : ''}`;
      
      li.innerHTML = `
        <div class="transaction-info">
          <div class="transaction-description">${transaction.description}</div>
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

  filterFixedTransactions() {
    const status = this.elements.filterFixedStatus.value;
    const category = this.elements.filterFixedCategory.value;
    
    let filtered = [...this.fixedTransactions];
    
    // Filtra por status
    if (status === 'paid') {
      filtered = filtered.filter(t => t.paid);
    } else if (status === 'unpaid') {
      filtered = filtered.filter(t => !t.paid);
    }
    
    // Filtra por categoria
    if (category !== 'all') {
      filtered = filtered.filter(t => t.category === category);
    }
    
    // Renderiza as contas fixas filtradas
    this.renderFixedTransactions(filtered);
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
      `;
      
      this.elements.fixedContainer.appendChild(li);
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
    
    this.elements.totalIncome.textContent = `R$ ${income.toFixed(2)}`;
    this.elements.totalExpenses.textContent = `R$ ${expenses.toFixed(2)}`;
    this.elements.currentBalance.textContent = `R$ ${this.currentBalance.toFixed(2)}`;
    
    // Cor do saldo
    this.elements.currentBalance.style.color = this.currentBalance >= 0 ? 'var(--success)' : 'var(--danger)';
  }

  updateCashFlow() {
    // Ordena transações por data
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
    const period = this.elements.reportPeriodSelect.value;
    let transactions = [];
    
    // Filtra por período
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
    
    // Atualiza gráficos
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
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    const expenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    // Se já existir um gráfico, destrua antes de criar um novo
    if (this.balanceChartInstance) {
      this.balanceChartInstance.destroy();
    }
    
    this.balanceChartInstance = new Chart(this.elements.balanceChart, {
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
    const expenses = transactions.filter(t => t.type === 'expense');
    
    // Agrupa despesas por categoria
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
    
    // Se já existir um gráfico, destrua antes de criar um novo
    if (this.categoriesChartInstance) {
      this.categoriesChartInstance.destroy();
    }
    
    this.categoriesChartInstance = new Chart(this.elements.categoriesChart, {
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

// Inicializa a aplicação quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  const app = new FinanceApp();
  
  // Verifica contas fixas diariamente
  setInterval(() => app.checkFixedTransactions(), 24 * 60 * 60 * 1000);
});
