/**
 * SISTEMA DE GESTÃO COMERCIAL - MERCEARIA BOM PREÇO
 * Utilizando JS Vanilla, LocalStorage e Chart.js
 */

// --- DADOS INICIAIS PADRÃO ---
const DEFAULT_PRODUTOS = [
  { id: 1, nome: "Arroz Branco 5kg", categoria: "Mercearia", custo: 19.50, preco: 27.90, estoque: 40, unidade: "un", minimo: 10 },
  { id: 2, nome: "Feijão Carioca 1kg", categoria: "Mercearia", custo: 5.90, preco: 8.49, estoque: 55, unidade: "un", minimo: 10 },
  { id: 3, nome: "Óleo de Soja 900ml", categoria: "Mercearia", custo: 5.40, preco: 7.99, estoque: 32, unidade: "un", minimo: 10 },
  { id: 4, nome: "Café Torrado 500g", categoria: "Mercearia", custo: 12.80, preco: 18.90, estoque: 24, unidade: "un", minimo: 5 },
  { id: 5, nome: "Açúcar Refinado 1kg", categoria: "Mercearia", custo: 3.30, preco: 4.99, estoque: 48, unidade: "un", minimo: 10 },
  { id: 6, nome: "Leite Integral 1L", categoria: "Laticínios", custo: 3.90, preco: 5.49, estoque: 60, unidade: "un", minimo: 15 },
  { id: 7, nome: "Queijo Mussarela", categoria: "Laticínios", custo: 34.00, preco: 49.90, estoque: 6, unidade: "kg", minimo: 8 },
  { id: 8, nome: "Pão Francês", categoria: "Padaria", custo: 8.00, preco: 15.90, estoque: 12, unidade: "kg", minimo: 5 },
  { id: 9, nome: "Banana Prata", categoria: "Hortifruti", custo: 3.80, preco: 6.99, estoque: 18, unidade: "kg", minimo: 10 },
  { id: 10, nome: "Tomate", categoria: "Hortifruti", custo: 5.20, preco: 8.99, estoque: 4, unidade: "kg", minimo: 5 },
  { id: 11, nome: "Refrigerante Cola 2L", categoria: "Bebidas", custo: 7.20, preco: 10.99, estoque: 36, unidade: "un", minimo: 10 },
  { id: 12, nome: "Água Mineral 1.5L", categoria: "Bebidas", custo: 1.80, preco: 3.49, estoque: 70, unidade: "un", minimo: 20 },
  { id: 13, nome: "Detergente 500ml", categoria: "Limpeza", custo: 1.60, preco: 2.79, estoque: 3, unidade: "un", minimo: 10 },
  { id: 14, nome: "Sabão em Pó 1kg", categoria: "Limpeza", custo: 9.80, preco: 14.90, estoque: 15, unidade: "un", minimo: 5 }
];

const DEFAULT_CLIENTES = [
  { id: 1, nome: "Consumidor Final", telefone: "(00) 00000-0000" },
  { id: 2, nome: "Maria Souza", telefone: "(11) 98765-4321" },
  { id: 3, nome: "João Pereira", telefone: "(11) 99876-1234" },
  { id: 4, nome: "Ana Lima", telefone: "(11) 97654-3210" },
  { id: 5, nome: "Carlos Oliveira", telefone: "(11) 96543-2109" }
];

// --- GESTÃO DE ESTADO (LOCALSTORAGE) ---
let produtos = JSON.parse(localStorage.getItem('mbp_produtos')) || DEFAULT_PRODUTOS;
let clientes = JSON.parse(localStorage.getItem('mbp_clientes')) || DEFAULT_CLIENTES;
let vendas = JSON.parse(localStorage.getItem('mbp_vendas')) || [];
let movimentacoes = JSON.parse(localStorage.getItem('mbp_movimentacoes')) || [];
let carrinho = [];

function salvarDados() {
  localStorage.setItem('mbp_produtos', JSON.stringify(produtos));
  localStorage.setItem('mbp_clientes', JSON.stringify(clientes));
  localStorage.setItem('mbp_vendas', JSON.stringify(vendas));
  localStorage.setItem('mbp_movimentacoes', JSON.stringify(movimentacoes));
}

// --- INSTÂNCIAS DE GRÁFICOS ---
let chartDash14 = null;
let chartRelatorio = null;

// --- INICIALIZAÇÃO DA APLICAÇÃO ---
document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initModals();
  initPOS();
  initEstoque();
  
  // Se não houver histórico prévio de vendas/movimentações, gera dados simulados realistas
  if (vendas.length === 0) seedHistoricoSimulado();

  renderAll();
});

function renderAll() {
  renderDashboard();
  renderProdutos();
  renderPOS();
  renderEstoque();
  renderClientes();
  renderRelatorios();
}

// --- NAVEGAÇÃO ENTRE ABAS ---
function initNavigation() {
  const navBtns = document.querySelectorAll('[data-target]');
  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');
      
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));

      const currentNav = document.querySelector(`.nav-btn[data-target="${targetId}"]`);
      if (currentNav) currentNav.classList.add('active');

      const targetSection = document.getElementById(targetId);
      if (targetSection) targetSection.classList.add('active');

      // Atualiza os gráficos ao alternar para a aba visível
      if (targetId === 'sec-dashboard') renderDashboardCharts();
      if (targetId === 'sec-relatorios') renderRelatoriosCharts();
    });
  });

  document.getElementById('btn-ver-estoque').addEventListener('click', () => {
    document.querySelector('[data-target="sec-estoque"]').click();
  });
}

// --- UTILS ---
const formatCurrency = (val) => Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return `${d.toLocaleDateString('pt-BR')} ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
};

// --- 1. DASHBOARD ---
function renderDashboard() {
  const hojeStr = new Date().toISOString().split('T')[0];
  const vendasHoje = vendas.filter(v => v.data.startsWith(hojeStr));
  const totalHoje = vendasHoje.reduce((acc, v) => acc + v.total, 0);

  const mesAtualStr = hojeStr.substring(0, 7);
  const vendasMes = vendas.filter(v => v.data.startsWith(mesAtualStr));
  const totalMes = vendasMes.reduce((acc, v) => acc + v.total, 0);

  document.getElementById('dash-vendas-hoje').innerText = formatCurrency(totalHoje);
  document.getElementById('dash-vendas-hoje-count').innerText = `${vendasHoje.length} vendas realizadas`;

  document.getElementById('dash-faturamento-mes').innerText = formatCurrency(totalMes);
  document.getElementById('dash-faturamento-mes-count').innerText = `${vendasMes.length} vendas no mês`;

  const totalItensEstoque = produtos.reduce((acc, p) => acc + p.estoque, 0);
  document.getElementById('dash-produtos-count').innerText = produtos.length;
  document.getElementById('dash-produtos-total-itens').innerText = `${totalItensEstoque} itens em estoque`;

  const estoqueBaixo = produtos.filter(p => p.estoque <= p.minimo);
  document.getElementById('dash-estoque-baixo-count').innerText = estoqueBaixo.length;

  // Render da Lista de Alertas
  const alertListEl = document.getElementById('dash-alertas-lista');
  alertListEl.innerHTML = '';
  if (estoqueBaixo.length === 0) {
    alertListEl.innerHTML = '<li class="alert-item"><span>Nenhum alerta de estoque</span></li>';
  } else {
    estoqueBaixo.slice(0, 5).forEach(p => {
      alertListEl.innerHTML += `
        <li class="alert-item">
          <span>${p.nome}</span>
          <span class="badge-danger">${p.estoque} ${p.unidade}</span>
        </li>
      `;
    });
  }

  // Tabela das Últimas Vendas
  const tbody = document.getElementById('dash-ultimas-vendas-body');
  tbody.innerHTML = '';
  vendas.slice(0, 5).forEach(v => {
    const cliente = clientes.find(c => c.id == v.clienteId)?.nome || 'Consumidor final';
    tbody.innerHTML += `
      <tr>
        <td>${formatDate(v.data)}</td>
        <td>${cliente}</td>
        <td>${v.itens.length} itens · ${v.pagamento}</td>
        <td><strong>${formatCurrency(v.total)}</strong></td>
      </tr>
    `;
  });

  renderDashboardCharts();
}

function renderDashboardCharts() {
  const ctx = document.getElementById('chartDashboard14Dias').getContext('2d');
  
  // Agrupar faturamento dos últimos 14 dias
  const labels = [];
  const dataMap = {};
  
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const labelFormatted = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
    labels.push(labelFormatted);
    dataMap[dateStr] = 0;
  }

  vendas.forEach(v => {
    const dateStr = v.data.split('T')[0];
    if (dataMap[dateStr] !== undefined) {
      dataMap[dateStr] += v.total;
    }
  });

  if (chartDash14) chartDash14.destroy();

  chartDash14 = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Faturamento (R$)',
        data: Object.values(dataMap),
        borderColor: '#059669',
        backgroundColor: 'rgba(5, 150, 105, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.3,
        pointBackgroundColor: '#059669'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, grid: { borderDash: [4, 4] } },
        x: { grid: { display: false } }
      }
    }
  });
}

// --- 2. VENDAS (POS) ---
function initPOS() {
  document.getElementById('pos-search-input').addEventListener('input', (e) => {
    renderPOSProducts(e.target.value);
  });

  document.getElementById('pos-desconto-input').addEventListener('input', renderCartSummary);

  document.getElementById('btn-finalizar-venda').addEventListener('click', finalizarVenda);
}

function renderPOS() {
  renderPOSProducts();
  
  // Popula Select de Clientes
  const cliSelect = document.getElementById('pos-cliente-select');
  cliSelect.innerHTML = '';
  clientes.forEach(c => {
    cliSelect.innerHTML += `<option value="${c.id}">${c.nome}</option>`;
  });

  renderCartItems();
}

function renderPOSProducts(filter = '') {
  const grid = document.getElementById('pos-products-grid');
  grid.innerHTML = '';
  
  const prods = produtos.filter(p => p.nome.toLowerCase().includes(filter.toLowerCase()) || p.categoria.toLowerCase().includes(filter.toLowerCase()));

  prods.forEach(p => {
    const isOut = p.estoque <= 0;
    grid.innerHTML += `
      <div class="product-card" onclick="${isOut ? '' : `adicionarAoCarrinho(${p.id})`}" style="${isOut ? 'opacity:0.5; cursor:not-allowed;' : ''}">
        <div>
          <h4>${p.nome}</h4>
          <span class="badge-category">${p.categoria}</span>
        </div>
        <div>
          <div class="price">${formatCurrency(p.preco)}</div>
          <div class="stock">${p.estoque} ${p.unidade} disponível</div>
        </div>
      </div>
    `;
  });
}

function adicionarAoCarrinho(id) {
  const produto = produtos.find(p => p.id === id);
  if (!produto || produto.estoque <= 0) return;

  const itemExistente = carrinho.find(c => c.produtoId === id);
  if (itemExistente) {
    if (itemExistente.qtd + 1 > produto.estoque) {
      alert("Quantidade limite do estoque atingida!");
      return;
    }
    itemExistente.qtd += 1;
  } else {
    carrinho.push({ produtoId: id, qtd: 1, precoUnit: produto.preco });
  }

  renderCartItems();
}

function alterarQtdCarrinho(id, delta) {
  const item = carrinho.find(c => c.produtoId === id);
  if (!item) return;

  const produto = produtos.find(p => p.id === id);
  if (delta > 0 && item.qtd + delta > produto.estoque) {
    alert("Quantidade excede o estoque disponível.");
    return;
  }

  item.qtd += delta;
  if (item.qtd <= 0) {
    carrinho = carrinho.filter(c => c.produtoId !== id);
  }
  renderCartItems();
}

function renderCartItems() {
  const container = document.getElementById('pos-cart-items');
  container.innerHTML = '';

  if (carrinho.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-basket-shopping"></i>
        <p>Nenhum item adicionado</p>
      </div>`;
  } else {
    carrinho.forEach(item => {
      const p = produtos.find(prod => prod.id === item.produtoId);
      container.innerHTML += `
        <div class="cart-item">
          <div class="cart-item-info">
            <h5>${p.nome}</h5>
            <span>${item.qtd}x ${formatCurrency(item.precoUnit)}</span>
          </div>
          <div>
            <button class="btn-icon" onclick="alterarQtdCarrinho(${p.id}, -1)">-</button>
            <span style="font-weight:600; margin:0 4px;">${item.qtd}</span>
            <button class="btn-icon" onclick="alterarQtdCarrinho(${p.id}, 1)">+</button>
          </div>
        </div>
      `;
    });
  }

  renderCartSummary();
  renderVendasRecentesTable();
}

function renderCartSummary() {
  const subtotal = carrinho.reduce((acc, i) => acc + (i.qtd * i.precoUnit), 0);
  const descPercent = Number(document.getElementById('pos-desconto-input').value) || 0;
  const total = subtotal * (1 - (descPercent / 100));

  document.getElementById('pos-subtotal').innerText = formatCurrency(subtotal);
  document.getElementById('pos-total').innerText = formatCurrency(total);
}

function finalizarVenda() {
  if (carrinho.length === 0) {
    alert("Adicione ao menos um item ao carrinho!");
    return;
  }

  const clienteId = Number(document.getElementById('pos-cliente-select').value);
  const pagamento = document.getElementById('pos-pagamento-select').value;
  const descPercent = Number(document.getElementById('pos-desconto-input').value) || 0;

  const subtotal = carrinho.reduce((acc, i) => acc + (i.qtd * i.precoUnit), 0);
  const total = subtotal * (1 - (descPercent / 100));

  const novaVenda = {
    id: Date.now(),
    data: new Date().toISOString(),
    clienteId,
    pagamento,
    total,
    itens: [...carrinho]
  };

  // Atualiza estoques
  carrinho.forEach(item => {
    const prod = produtos.find(p => p.id === item.produtoId);
    if (prod) prod.estoque -= item.qtd;
  });

  vendas.unshift(novaVenda);
  carrinho = [];
  document.getElementById('pos-desconto-input').value = 0;

  salvarDados();
  renderAll();
  alert("Venda realizada com sucesso!");
}

function renderVendasRecentesTable() {
  const tbody = document.getElementById('pos-vendas-recentes-body');
  tbody.innerHTML = '';
  
  vendas.slice(0, 8).forEach(v => {
    const cliente = clientes.find(c => c.id == v.clienteId)?.nome || 'Consumidor final';
    const resumoItens = v.itens.map(i => {
      const p = produtos.find(prod => prod.id === i.produtoId);
      return `${i.qtd}× ${p ? p.nome : 'Produto'}`;
    }).join(', ');

    tbody.innerHTML += `
      <tr>
        <td>${formatDate(v.data)}</td>
        <td>${cliente}</td>
        <td><small>${resumoItens}</small></td>
        <td><strong>${formatCurrency(v.total)}</strong></td>
      </tr>
    `;
  });
}

// --- 3. PRODUTOS ---
function renderProdutos(filter = '') {
  const tbody = document.getElementById('produtos-table-body');
  tbody.innerHTML = '';

  const list = produtos.filter(p => p.nome.toLowerCase().includes(filter.toLowerCase()) || p.categoria.toLowerCase().includes(filter.toLowerCase()));
  document.getElementById('prod-total-count').innerText = `${produtos.length} produtos cadastrados`;

  list.forEach(p => {
    const estoqueClass = p.estoque <= p.minimo ? 'badge-danger' : '';
    tbody.innerHTML += `
      <tr>
        <td><strong>${p.nome}</strong></td>
        <td><span class="badge-category">${p.categoria}</span></td>
        <td>${formatCurrency(p.custo)}</td>
        <td>${formatCurrency(p.preco)}</td>
        <td><span class="${estoqueClass}">${p.estoque} ${p.unidade}</span></td>
        <td>
          <button class="btn-icon" onclick="editarProduto(${p.id})"><i class="fa-solid fa-pen-to-square"></i></button>
          <button class="btn-icon danger" onclick="deletarProduto(${p.id})"><i class="fa-solid fa-trash"></i></button>
        </td>
      </tr>
    `;
  });

  document.getElementById('prod-search-input').oninput = (e) => renderProdutos(e.target.value);
}

function editarProduto(id) {
  const p = produtos.find(item => item.id === id);
  if (!p) return;

  document.getElementById('prod-id').value = p.id;
  document.getElementById('prod-nome').value = p.nome;
  document.getElementById('prod-categoria').value = p.categoria;
  document.getElementById('prod-custo').value = p.custo;
  document.getElementById('prod-preco').value = p.preco;
  document.getElementById('prod-estoque').value = p.estoque;
  document.getElementById('prod-unidade').value = p.unidade;
  document.getElementById('prod-minimo').value = p.minimo;

  document.getElementById('modal-produto-titulo').innerText = "Editar Produto";
  document.getElementById('modal-produto').classList.add('active');
}

function deletarProduto(id) {
  if (confirm("Deseja realmente remover este produto?")) {
    produtos = produtos.filter(p => p.id !== id);
    salvarDados();
    renderAll();
  }
}

// --- 4. ESTOQUE ---
function initEstoque() {
  const tabBtns = document.querySelectorAll('.tabs-segmented .tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const type = btn.getAttribute('data-type');
      document.getElementById('btn-submit-mov').innerText = `Registrar ${type.toLowerCase()}`;
    });
  });

  document.getElementById('form-movimentacao').addEventListener('submit', (e) => {
    e.preventDefault();
    const prodId = Number(document.getElementById('mov-produto-select').value);
    const qtd = Number(document.getElementById('mov-quantidade-input').value);
    const obs = document.getElementById('mov-obs-input').value;
    const tipo = document.querySelector('.tabs-segmented .tab-btn.active').getAttribute('data-type');

    const prod = produtos.find(p => p.id === prodId);
    if (!prod) return;

    if (tipo === 'Saída' && prod.estoque < qtd) {
      alert("Estoque insuficiente para esta saída.");
      return;
    }

    if (tipo === 'Entrada') prod.estoque += qtd;
    else prod.estoque -= qtd;

    movimentacoes.unshift({
      id: Date.now(),
      data: new Date().toISOString(),
      produtoId: prodId,
      tipo,
      qtd,
      obs
    });

    salvarDados();
    renderAll();
    document.getElementById('form-movimentacao').reset();
    alert("Movimentação registrada com sucesso!");
  });
}

function renderEstoque() {
  // Populate Select
  const select = document.getElementById('mov-produto-select');
  select.innerHTML = '';
  produtos.forEach(p => {
    select.innerHTML += `<option value="${p.id}">${p.nome} (Atual: ${p.estoque} ${p.unidade})</option>`;
  });

  // Lista de Progresso do Estoque
  const progressContainer = document.getElementById('stock-progress-list');
  progressContainer.innerHTML = '';

  produtos.forEach(p => {
    const maxReference = p.minimo * 3 || 30;
    const percentage = Math.min(100, Math.round((p.estoque / maxReference) * 100));
    const isLow = p.estoque <= p.minimo;

    progressContainer.innerHTML += `
      <div class="stock-progress-item">
        <div class="stock-progress-header">
          <span>${p.nome}</span>
          <span style="font-weight:600; color: ${isLow ? 'var(--accent-red)' : 'var(--text-main)'}">${p.estoque} ${p.unidade}</span>
        </div>
        <div class="progress-bar-bg">
          <div class="progress-bar-fill ${isLow ? 'danger' : ''}" style="width: ${percentage}%"></div>
        </div>
      </div>
    `;
  });

  // Histórico de Movimentações
  const tbody = document.getElementById('historico-mov-body');
  tbody.innerHTML = '';

  movimentacoes.forEach(m => {
    const prod = produtos.find(p => p.id === m.produtoId);
    tbody.innerHTML += `
      <tr>
        <td>${formatDate(m.data)}</td>
        <td><span class="badge-category">${m.tipo}</span></td>
        <td>${prod ? prod.nome : 'Produto descontinuado'}<br><small color="gray">${m.obs || ''}</small></td>
        <td><strong>${m.tipo === 'Entrada' ? '+' : '-'}${m.qtd}</strong></td>
        <td><button class="btn-icon danger" onclick="deletarMovimentacao(${m.id})"><i class="fa-solid fa-trash"></i></button></td>
      </tr>
    `;
  });
}

function deletarMovimentacao(id) {
  if (confirm("Remover esta movimentação do histórico?")) {
    movimentacoes = movimentacoes.filter(m => m.id !== id);
    salvarDados();
    renderAll();
  }
}

// --- 5. CLIENTES ---
function renderClientes() {
  const container = document.getElementById('clientes-list');
  container.innerHTML = '';
  document.getElementById('cli-total-count').innerText = `${clientes.length} clientes cadastrados`;

  clientes.forEach(c => {
    const vendasCliente = vendas.filter(v => v.clienteId === c.id);
    const totalGasto = vendasCliente.reduce((acc, v) => acc + v.total, 0);

    container.innerHTML += `
      <div class="client-card" onclick="selecionarCliente(${c.id})">
        <div class="client-avatar">${c.nome.substring(0, 2).toUpperCase()}</div>
        <div style="flex:1;">
          <h4>${c.nome}</h4>
          <span style="font-size:0.8rem; color:var(--text-muted);">${c.telefone}</span>
        </div>
        <div style="text-align:right;">
          <strong>${formatCurrency(totalGasto)}</strong>
          <div style="font-size:0.75rem; color:var(--text-muted);">${vendasCliente.length} compras</div>
        </div>
      </div>
    `;
  });
}

function selecionarCliente(id) {
  const c = clientes.find(item => item.id === id);
  if (!c) return;

  const cardDetalhes = document.getElementById('cliente-detalhes-card');
  const vendasCliente = vendas.filter(v => v.clienteId === c.id);
  const totalGasto = vendasCliente.reduce((acc, v) => acc + v.total, 0);
  const ticketMedio = vendasCliente.length ? (totalGasto / vendasCliente.length) : 0;

  let historicoHTML = vendasCliente.map(v => `
    <div style="padding:0.6rem 0; border-bottom:1px solid var(--border); font-size:0.85rem;">
      <div style="display:flex; justify-content:space-between; font-weight:600;">
        <span>${formatDate(v.data)} · ${v.pagamento}</span>
        <span>${formatCurrency(v.total)}</span>
      </div>
      <div style="color:var(--text-muted); font-size:0.75rem;">
        ${v.itens.map(i => {
          const p = produtos.find(prod => prod.id === i.produtoId);
          return `${i.qtd}× ${p ? p.nome : 'Produto'}`;
        }).join(', ')}
      </div>
    </div>
  `).join('');

  if (vendasCliente.length === 0) historicoHTML = '<p style="color:var(--text-muted); font-size:0.85rem;">Nenhuma compra realizada ainda.</p>';

  cardDetalhes.innerHTML = `
    <div class="card-header-flex">
      <h3>Histórico — ${c.nome}</h3>
      <div>
        <button class="btn-icon" onclick="editarCliente(${c.id})"><i class="fa-solid fa-pen-to-square"></i></button>
        ${c.id !== 1 ? `<button class="btn-icon danger" onclick="deletarCliente(${c.id})"><i class="fa-solid fa-trash"></i></button>` : ''}
      </div>
    </div>
    <div class="cards-grid" style="margin-bottom:1rem; grid-template-columns: repeat(3, 1fr);">
      <div style="background:#f8fafc; padding:0.5rem; border-radius:6px; text-align:center;">
        <small>Compras</small>
        <h4>${vendasCliente.length}</h4>
      </div>
      <div style="background:#f8fafc; padding:0.5rem; border-radius:6px; text-align:center;">
        <small>Total gasto</small>
        <h4>${formatCurrency(totalGasto)}</h4>
      </div>
      <div style="background:#f8fafc; padding:0.5rem; border-radius:6px; text-align:center;">
        <small>Ticket médio</small>
        <h4>${formatCurrency(ticketMedio)}</h4>
      </div>
    </div>
    <div style="max-height: 250px; overflow-y:auto;">
      ${historicoHTML}
    </div>
  `;
}

function editarCliente(id) {
  const c = clientes.find(item => item.id === id);
  if (!c) return;

  document.getElementById('cli-id').value = c.id;
  document.getElementById('cli-nome').value = c.nome;
  document.getElementById('cli-telefone').value = c.telefone;
  document.getElementById('modal-cliente-titulo').innerText = "Editar Cliente";
  document.getElementById('modal-cliente').classList.add('active');
}

function deletarCliente(id) {
  if (id === 1) {
    alert("O cliente padrão Consumidor Final não pode ser excluído.");
    return;
  }
  if (confirm("Remover este cliente?")) {
    clientes = clientes.filter(c => c.id !== id);
    salvarDados();
    renderAll();
    document.getElementById('cliente-detalhes-card').innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-user-gear"></i>
        <p>Selecione um cliente para ver o histórico detalhado</p>
      </div>`;
  }
}

// --- 6. RELATÓRIOS ---
function renderRelatorios() {
  // Top Produtos Vendidos
  const ranking = {};
  vendas.forEach(v => {
    v.itens.forEach(i => {
      if (!ranking[i.produtoId]) ranking[i.produtoId] = { qtd: 0, total: 0 };
      ranking[i.produtoId].qtd += i.qtd;
      ranking[i.produtoId].total += (i.qtd * i.precoUnit);
    });
  });

  const sortedRanking = Object.keys(ranking).map(prodId => {
    const p = produtos.find(prod => prod.id == prodId);
    return {
      nome: p ? p.nome : 'Produto Removido',
      unidade: p ? p.unidade : 'un',
      qtd: ranking[prodId].qtd,
      total: ranking[prodId].total
    };
  }).sort((a, b) => b.qtd - a.qtd);

  const ulTop = document.getElementById('relatorio-top-produtos');
  ulTop.innerHTML = '';
  sortedRanking.slice(0, 9).forEach((item, index) => {
    ulTop.innerHTML += `
      <li>
        <span><strong>${index + 1}.</strong> ${item.nome}</span>
        <span><strong>${item.qtd} ${item.unidade}</strong> · ${formatCurrency(item.total)}</span>
      </li>
    `;
  });

  // Resumo por Mês Tabela
  const resumoMes = {};
  vendas.forEach(v => {
    const mesKey = v.data.substring(0, 7); // YYYY-MM
    if (!resumoMes[mesKey]) resumoMes[mesKey] = { vendasCount: 0, total: 0 };
    resumoMes[mesKey].vendasCount += 1;
    resumoMes[mesKey].total += v.total;
  });

  const tbodyResumo = document.getElementById('relatorio-resumo-mes-body');
  tbodyResumo.innerHTML = '';
  
  Object.keys(resumoMes).sort().reverse().forEach(mesKey => {
    const [ano, mes] = mesKey.split('-');
    const dateObj = new Date(ano, mes - 1);
    const nomeMes = dateObj.toLocaleString('pt-BR', { month: 'short', year: '2-digit' });
    const total = resumoMes[mesKey].total;
    const count = resumoMes[mesKey].vendasCount;
    const ticket = count ? total / count : 0;

    tbodyResumo.innerHTML += `
      <tr>
        <td><strong>${nomeMes}</strong></td>
        <td>${count}</td>
        <td>${formatCurrency(ticket)}</td>
        <td><strong>${formatCurrency(total)}</strong></td>
      </tr>
    `;
  });

  renderRelatoriosCharts();
}

function renderRelatoriosCharts() {
  const ctx = document.getElementById('chartRelatorioMensal').getContext('2d');

  // Mapear vendas por mês dos últimos 7 meses
  const labels = [];
  const totals = [];
  
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const mesKey = d.toISOString().substring(0, 7);
    const labelMes = d.toLocaleString('pt-BR', { month: 'short', year: '2-digit' });
    
    labels.push(labelMes);
    
    const totalMes = vendas
      .filter(v => v.data.startsWith(mesKey))
      .reduce((acc, v) => acc + v.total, 0);
      
    totals.push(totalMes);
  }

  if (chartRelatorio) chartRelatorio.destroy();

  chartRelatorio = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Faturamento Mensal (R$)',
        data: totals,
        backgroundColor: '#059669',
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, grid: { borderDash: [4, 4] } },
        x: { grid: { display: false } }
      }
    }
  });
}

// --- MODAIS ---
function initModals() {
  // Modal Produto
  document.getElementById('btn-modal-novo-produto').addEventListener('click', () => {
    document.getElementById('form-produto').reset();
    document.getElementById('prod-id').value = '';
    document.getElementById('modal-produto-titulo').innerText = "Novo Produto";
    document.getElementById('modal-produto').classList.add('active');
  });

  document.getElementById('form-produto').addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('prod-id').value;
    const pData = {
      id: id ? Number(id) : Date.now(),
      nome: document.getElementById('prod-nome').value,
      categoria: document.getElementById('prod-categoria').value,
      custo: Number(document.getElementById('prod-custo').value),
      preco: Number(document.getElementById('prod-preco').value),
      estoque: Number(document.getElementById('prod-estoque').value),
      unidade: document.getElementById('prod-unidade').value,
      minimo: Number(document.getElementById('prod-minimo').value)
    };

    if (id) {
      const idx = produtos.findIndex(p => p.id === Number(id));
      if (idx !== -1) produtos[idx] = pData;
    } else {
      produtos.push(pData);
    }

    salvarDados();
    renderAll();
    document.getElementById('modal-produto').classList.remove('active');
  });

  // Modal Cliente
  document.getElementById('btn-modal-novo-cliente').addEventListener('click', () => {
    document.getElementById('form-cliente').reset();
    document.getElementById('cli-id').value = '';
    document.getElementById('modal-cliente-titulo').innerText = "Novo Cliente";
    document.getElementById('modal-cliente').classList.add('active');
  });

  document.getElementById('form-cliente').addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('cli-id').value;
    const cData = {
      id: id ? Number(id) : Date.now(),
      nome: document.getElementById('cli-nome').value,
      telefone: document.getElementById('cli-telefone').value
    };

    if (id) {
      const idx = clientes.findIndex(c => c.id === Number(id));
      if (idx !== -1) clientes[idx] = cData;
    } else {
      clientes.push(cData);
    }

    salvarDados();
    renderAll();
    document.getElementById('modal-cliente').classList.remove('active');
  });

  // Fechar modais
  document.querySelectorAll('.btn-close').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
    });
  });
}

// --- POPULADOR DE DADOS HISTÓRICOS SIMULADOS (Primeiro acesso) ---
function seedHistoricoSimulado() {
  const hoje = new Date();
  
  // Criar histórico de movimentações de entrada inicial
  produtos.forEach(p => {
    movimentacoes.push({
      id: Date.now() + Math.random(),
      data: new Date(hoje.getFullYear(), hoje.getMonth() - 5, 10, 12, 0).toISOString(),
      produtoId: p.id,
      tipo: 'Entrada',
      qtd: p.estoque + 30,
      obs: 'Estoque inicial'
    });
  });

  // Criar histórico de vendas para os últimos meses
  const pagamentos = ['PIX', 'Cartão de Crédito', 'Cartão de Débito', 'Dinheiro'];
  
  for (let i = 0; i < 45; i++) {
    const dataVenda = new Date(hoje);
    dataVenda.setDate(hoje.getDate() - Math.floor(Math.random() * 120));
    
    const prodAleatorio1 = produtos[Math.floor(Math.random() * produtos.length)];
    const prodAleatorio2 = produtos[Math.floor(Math.random() * produtos.length)];
    
    const item1 = { produtoId: prodAleatorio1.id, qtd: Math.floor(Math.random() * 3) + 1, precoUnit: prodAleatorio1.preco };
    const item2 = { produtoId: prodAleatorio2.id, qtd: Math.floor(Math.random() * 2) + 1, precoUnit: prodAleatorio2.preco };
    
    const total = (item1.qtd * item1.precoUnit) + (item2.qtd * item2.precoUnit);
    const cliAleatorio = clientes[Math.floor(Math.random() * clientes.length)];

    vendas.push({
      id: Date.now() + i,
      data: dataVenda.toISOString(),
      clienteId: cliAleatorio.id,
      pagamento: pagamentos[Math.floor(Math.random() * pagamentos.length)],
      total: total,
      itens: [item1, item2]
    });
  }

  // Ordenar vendas por data decrescente
  vendas.sort((a, b) => new Date(b.data) - new Date(a.data));
  salvarDados();
}