class FinanceApp {
  constructor() {
    this.transactions = [];
    this.fixedTransactions = [];
    this.categories = [];
    this.reminders = [];
    this.currentBalance = 0;
    this.nextPaymentDate = null;
    this.dailyBudget = 0;
    
    this.initElements();
    this.loadData();
    this.initEventListeners();
    this.renderAll();
  }

  // ... (métodos existentes até calculateTotals)

  calculateDailyBudget() {
    const nextPaymentInput = document.getElementById('next-payment-date');
    const nextPaymentDate = new Date(nextPaymentInput.value);
    
    if (!nextPaymentDate || isNaN(nextPaymentDate.getTime())) {
      alert('Defina uma data válida para o próximo pagamento');
      return;
    }
    
    this.nextPaymentDate = nextPaymentDate;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Calcula dias restantes
    const timeDiff = nextPaymentDate - today;
    const daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    
    if (daysRemaining <= 0) {
      alert('A data do próximo pagamento deve ser futura');
      return;
    }
    
    // Calcula orçamento diário
    this.dailyBudget = this.currentBalance / daysRemaining;
    
    // Atualiza UI
    document.getElementById('daily-budget').textContent = `R$ ${this.dailyBudget.toFixed(2)}`;
    document.getElementById('days-remaining').textContent = `${daysRemaining} dias restantes`;
    
    // Salva no localStorage
    localStorage.setItem('nextPaymentDate', nextPaymentInput.value);
    localStorage.setItem('dailyBudget', this.dailyBudget.toString());
  }

  checkPaymentStatus() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    this.transactions.forEach(transaction => {
      if (transaction.dueDate) {
        const dueDate = new Date(transaction.dueDate);
        
        if (transaction.paid && dueDate < today) {
          // Se está marcado como pago mas venceu, marca como pendente
          transaction.paid = false;
          transaction.status = 'overdue';
        } else if (!transaction.paid) {
          // Atualiza status baseado na data
          transaction.status = dueDate < today ? 'overdue' : 'pending';
        }
      }
    });
    
    this.saveData();
  }

  // Modifique o método addTransaction para incluir vencimento
  addTransaction() {
    const type = this.elements.transactionType.value;
    const date = this.elements.transactionDate.value;
    const description = this.elements.transactionDescription.value.trim();
    const amount = parseFloat(this.elements.transactionAmount.value);
    const category = this.elements.transactionCategory.value;
    const isParceled = this.elements.transactionParceled.checked;
    const installments = isParceled ? parseInt(this.elements.transactionInstallments.value) : 1;
    const isFixed = this.elements.transactionFixed.checked;
    const dueDate = this.elements.transactionDueDate.value;

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
      dueDate: isFixed || isParceled ? dueDate : null,
      paid: false,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    // Adiciona transação principal
    this.transactions.push(newTransaction);

    // Se for parcelado, cria as parcelas futuras
    if (isParceled && installments > 1) {
      const transactionDate = new Date(date);
      const dueDateObj = new Date(dueDate);
      
      for (let i = 2; i <= installments; i++) {
        const nextMonth = new Date(transactionDate);
        nextMonth.setMonth(transactionDate.getMonth() + (i - 1));
        
        const nextDueDate = new Date(dueDateObj);
        nextDueDate.setMonth(dueDateObj.getMonth() + (i - 1));
        
        const installment = {
          ...newTransaction,
          id: Date.now() + i,
          date: nextMonth.toISOString().split('T')[0],
          dueDate: nextDueDate.toISOString().split('T')[0],
          installmentNumber: i,
          paid: false,
          status: 'pending'
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

  // Modifique o método renderTransactions para mostrar status
  renderTransactions(transactions) {
    this.elements.transactionsContainer.innerHTML = '';
    
    transactions.forEach(transaction => {
      const li = document.createElement('li');
      li.className = `transaction-item ${transaction.type} ${transaction.fixed ? 'fixed' : ''} ${transaction.installments > 1 ? 'parceled' : ''} ${transaction.status === 'overdue' ? 'overdue' : ''}`;
      
      // Ícone de status
      const statusIcon = transaction.paid ? 'paid' : transaction.status;
      const statusText = transaction.paid ? 'Pago' : 
                       transaction.status === 'overdue' ? 'Atrasado' : 'Pendente';
      
      li.innerHTML = `
        <div class="transaction-info">
          <div class="transaction-description">${transaction.description}</div>
          <div class="transaction-meta">
            <span class="transaction-date">${new Date(transaction.date).toLocaleDateString()}</span>
            ${transaction.dueDate ? `<span class="due-date">Vence: ${new Date(transaction.dueDate).toLocaleDateString()}</span>` : ''}
            ${transaction.category ? `<span>${transaction.category}</span>` : ''}
            ${transaction.installments > 1 ? `<span>Parcela ${transaction.installmentNumber}/${transaction.installments}</span>` : ''}
          </div>
        </div>
        <div class="transaction-amount ${transaction.type}">
          ${transaction.type === 'expense' ? '-' : ''}R$ ${Math.abs(transaction.amount).toFixed(2)}
        </div>
        <div class="transaction-actions">
          <span class="status-badge ${statusIcon}">${statusText}</span>
          <button class="toggle-paid-btn" data-id="${transaction.id}" title="${transaction.paid ? 'Marcar como pendente' : 'Marcar como pago'}">
            <i class="fas ${transaction.paid ? 'fa-undo' : 'fa-check'}"></i>
          </button>
          <button class="delete-btn" data-id="${transaction.id}">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      `;
      
      // Adiciona evento para marcar como pago/pendente
      li.querySelector('.toggle-paid-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        this.togglePaidStatus(transaction.id);
      });
      
      // Adiciona evento para deletar
      li.querySelector('.delete-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        this.deleteTransaction(transaction.id);
      });
      
      this.elements.transactionsContainer.appendChild(li);
    });
  }

  togglePaidStatus(id) {
    const transaction = this.transactions.find(t => t.id === id);
    if (transaction) {
      transaction.paid = !transaction.paid;
      transaction.status = transaction.paid ? 'paid' : 
                          new Date(transaction.dueDate) < new Date() ? 'overdue' : 'pending';
      this.saveData();
      this.renderAll();
    }
  }

  // Modifique o initEventListeners para incluir o novo botão
  initEventListeners() {
    // ... (event listeners existentes)
    
    // Botão para calcular orçamento diário
    document.getElementById('calculate-budget').addEventListener('click', () => {
      this.calculateDailyBudget();
    });
    
    // ... (restante dos event listeners existentes)
  }

  // Modifique o loadData para carregar os novos dados
  loadData() {
    this.transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    this.fixedTransactions = JSON.parse(localStorage.getItem('fixedTransactions')) || [];
    this.categories = JSON.parse(localStorage.getItem('categories')) || this.getDefaultCategories();
    this.reminders = JSON.parse(localStorage.getItem('reminders')) || [];
    
    // Carrega dados do orçamento
    const nextPaymentDate = localStorage.getItem('nextPaymentDate');
    if (nextPaymentDate) {
      document.getElementById('next-payment-date').value = nextPaymentDate;
    }
    
    this.dailyBudget = parseFloat(localStorage.getItem('dailyBudget')) || 0;
    
    // Verifica status de pagamento
    this.checkPaymentStatus();
    this.calculateTotals();
    
    // Atualiza UI do orçamento
    if (this.dailyBudget > 0) {
      document.getElementById('daily-budget').textContent = `R$ ${this.dailyBudget.toFixed(2)}`;
      
      const nextPaymentDate = new Date(document.getElementById('next-payment-date').value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const daysRemaining = Math.ceil((nextPaymentDate - today) / (1000 * 60 * 60 * 24));
      
      if (daysRemaining > 0) {
        document.getElementById('days-remaining').textContent = `${daysRemaining} dias restantes`;
      }
    }
  }

  // ... (restante dos métodos existentes)
}

// Inicializa a aplicação
document.addEventListener('DOMContentLoaded', () => {
  const app = new FinanceApp();
  
  // Verifica contas fixas diariamente
  setInterval(() => {
    app.checkFixedTransactions();
    app.checkPaymentStatus();
    app.calculateTotals();
  }, 24 * 60 * 60 * 1000);
});
