// No método initModals() da classe App, substitua por:
initModals() {
  this.modal = document.getElementById('data-modal');
  this.modalTitle = document.getElementById('modal-title');
  this.modalBody = document.getElementById('modal-body');
  
  document.getElementById('export-data').addEventListener('click', () => {
    this.showExportModal();
  });
  
  document.getElementById('import-data').addEventListener('click', () => {
    this.showImportModal();
  });
  
  // Correção: Adicionar evento de clique no overlay para fechar
  this.modal.addEventListener('click', (e) => {
    if (e.target === this.modal || e.target.classList.contains('close-modal')) {
      this.closeModal();
    }
  });
  
  // Adicionar evento de tecla ESC para fechar
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !this.modal.hidden) {
      this.closeModal();
    }
  });
  
  // Configurar botão de cópia
  document.getElementById('copy-data').addEventListener('click', () => {
    const textarea = document.getElementById('data-json');
    textarea.select();
    document.execCommand('copy');
    this.showFeedback('Dados copiados para a área de transferência!');
  });
  
  // Configurar botão de download
  document.getElementById('download-data').addEventListener('click', () => {
    this.downloadData();
  });
  
  // Configurar importação
  document.getElementById('confirm-import').addEventListener('click', () => {
    this.importData();
  });
}

// Adicionar novos métodos auxiliares:
showFeedback(message) {
  const feedback = document.createElement('div');
  feedback.className = 'feedback-message';
  feedback.textContent = message;
  document.body.appendChild(feedback);
  
  setTimeout(() => {
    feedback.remove();
  }, 3000);
}

downloadData() {
  const data = document.getElementById('data-json').value;
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `backup-financas-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  
  URL.revokeObjectURL(url);
  this.showFeedback('Download iniciado!');
}

async importData() {
  const fileInput = document.getElementById('file-input');
  if (!fileInput.files.length) return;
  
  const file = fileInput.files[0];
  try {
    const data = await file.text();
    if (this.dataManager.importData(data)) {
      this.showFeedback('Dados importados com sucesso!');
      this.closeModal();
      location.reload(); // Recarregar para aplicar os novos dados
    } else {
      this.showFeedback('Erro ao importar dados. Verifique o arquivo.');
    }
  } catch (error) {
    console.error('Erro na importação:', error);
    this.showFeedback('Falha ao ler arquivo.');
  }
}
