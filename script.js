// Configuração inicial
document.addEventListener("DOMContentLoaded", () => {
  // Controle de abas
  const tabButtons = [
    { button: 'finance-tab', section: 'finance-section' },
    { button: 'payment-tab', section: 'payment-section' },
    { button: 'reminder-tab', section: 'reminder-section' }
  ];

  tabButtons.forEach(({button, section}) => {
    const btn = document.getElementById(button);
    const sec = document.getElementById(section);
    
    btn?.addEventListener('click', () => {
      // Atualiza estado das abas
      tabButtons.forEach(t => {
        document.getElementById(t.button)?.setAttribute('aria-selected', 'false');
        document.getElementById(t.section)?.setAttribute('hidden', '');
      });
      
      // Ativa aba selecionada
      btn.setAttribute('aria-selected', 'true');
      sec?.removeAttribute('hidden');
    });
  });

  // Tema escuro/claro
  const themeToggle = document.getElementById('theme-toggle');
  themeToggle?.addEventListener('click', () => {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    themeToggle.textContent = isDark ? '🌜 / 🌞' : '🌞 / 🌜';
  });

  // Verificar preferência de tema salva
  const savedTheme = localStorage.getItem('theme') || 
    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  if (savedTheme === 'dark') {
    document.documentElement.classList.add('dark');
    themeToggle.textContent = '🌜 / 🌞';
  }

  // Registrar Service Worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js')
        .then(reg => console.log('Service Worker registrado'))
        .catch(err => console.error('Falha ao registrar SW', err));
    });
  }
});

// Módulo de finanças
class FinanceManager {
  constructor() {
    this.transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    this.initForm();
    this.renderTransactions();
    this.initCharts();
  }

  initForm() {
    const form = document.getElementById('finance-form');
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const transaction = {
        id: Date.now(),
        description: form.description.value.trim(),
        amount: parseFloat(form.amount.value),
        type: form.type.value,
        category: form.category.value.trim(),
        fixed: form.fixed.checked,
        date: new Date().toISOString(),
        installments: form.installments.value ? parseInt(form.installments.value) : 1
      };

      this.addTransaction(transaction);
      form.reset();
    });
  }

  addTransaction(transaction) {
    this.transactions.push(transaction);
    this.save();
    this.renderTransactions();
    this.updateCharts();
    
    // Feedback visual
    const feedback = document.getElementById('feedback');
    if (feedback) {
      feedback.textContent = `${transaction.type === 'receita' ? 'Receita' : 'Despesa'} adicionada!`;
      setTimeout(() => feedback.textContent = '', 3000);
    }
  }

  save() {
    localStorage.setItem('transactions', JSON.stringify(this.transactions));
  }

  renderTransactions() {
    const list = document.getElementById('transactions-list');
    if (!list) return;
    
    list.innerHTML = this.transactions.map(t => `
      <li data-id="${t.id}" data-type="${t.type}">
        <span>
          <strong>${t.description}</strong><br>
          <small>${t.category} • ${new Date(t.date).toLocaleDateString()}</small>
        </span>
        <span class="amount ${t.type}">
          ${t.type === 'despesa' ? '-' : ''}R$ ${t.amount.toFixed(2)}
        </span>
      </li>
    `).join('');
  }

  initCharts() {
    this.pieChart = new Chart(
      document.getElementById('pieChart'),
      this.getPieChartConfig()
    );
    
    this.barChart = new Chart(
      document.getElementById('barChart'),
      this.getBarChartConfig()
    );
  }

  updateCharts() {
    this.pieChart.data = this.getPieChartData();
    this.barChart.data = this.getBarChartData();
    this.pieChart.update();
    this.barChart.update();
  }

  getPieChartConfig() {
    return {
      type: 'pie',
      data: this.getPieChartData(),
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'top' }
        }
      }
    };
  }

  getPieChartData() {
    const income = this.transactions
      .filter(t => t.type === 'receita')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expense = this.transactions
      .filter(t => t.type === 'despesa')
      .reduce((sum, t) => sum + t.amount, 0);
    
    return {
      labels: ['Receitas', 'Despesas'],
      datasets: [{
        data: [income, expense],
        backgroundColor: ['#16a34a', '#dc2626'],
        borderWidth: 1
      }]
    };
  }

  getBarChartConfig() {
    return {
      type: 'bar',
      data: this.getBarChartData(),
      options: {
        responsive: true,
        scales: {
          y: { beginAtZero: true }
        }
      }
    };
  }

  getBarChartData() {
    const categories = [...new Set(this.transactions.map(t => t.category))];
    const incomeData = Array(categories.length).fill(0);
    const expenseData = Array(categories.length).fill(0);
    
    this.transactions.forEach(t => {
      const index = categories.indexOf(t.category);
      if (index !== -1) {
        if (t.type === 'receita') {
          incomeData[index] += t.amount;
        } else {
          expenseData[index] += t.amount;
        }
      }
    });
    
    return {
      labels: categories,
      datasets: [
        {
          label: 'Receitas',
          data: incomeData,
          backgroundColor: '#16a34a'
        },
        {
          label: 'Despesas',
          data: expenseData,
          backgroundColor: '#dc2626'
        }
      ]
    };
  }
}

// Inicialização da aplicação
new FinanceManager();
