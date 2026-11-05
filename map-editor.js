(() => {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const gridEl = $('#grid');
  const widthInput = $('#width');
  const heightInput = $('#height');
  const output = $('#output');
  const message = $('#message');
  const symbols = { '#': { name: 'Parede', cls: 'wall' }, '.': { name: 'Piso', cls: 'floor' }, p: { name: 'Caminho', cls: 'path' }, D: { name: 'Porta/passagem', cls: 'door' }, ' ': { name: 'Apagar', cls: 'erase' } };
  let width = 17, height = 12, activeTool = '#', cells = [], painting = false;

  function announce(text) { message.textContent = text; }
  function createGrid(w, h, fill = '.') {
    width = Math.max(3, Math.min(60, Math.floor(w) || 17));
    height = Math.max(3, Math.min(40, Math.floor(h) || 12));
    widthInput.value = width; heightInput.value = height;
    cells = Array.from({ length: height }, () => Array(width).fill(fill));
    render(); announce(`Grade criada: ${width} × ${height} tiles.`);
  }
  function render() {
    gridEl.replaceChildren();
    gridEl.style.gridTemplateColumns = `repeat(${width}, 24px)`;
    const frag = document.createDocumentFragment();
    for (let r = 0; r < height; r++) for (let c = 0; c < width; c++) {
      const value = cells[r][c];
      const button = document.createElement('button');
      button.type = 'button'; button.className = `cell ${symbols[value]?.cls || 'erase'}`;
      button.dataset.row = r; button.dataset.col = c; button.title = `Coluna ${c}, linha ${r}: ${symbols[value]?.name || 'Apagar'}`;
      button.setAttribute('role', 'gridcell');
      if (value === 'D' || value === 'p') button.textContent = value;
      button.addEventListener('pointerdown', (e) => { e.preventDefault(); painting = true; paint(r, c); });
      button.addEventListener('pointerenter', () => { if (painting) paint(r, c); });
      frag.append(button);
    }
    gridEl.append(frag);
    $('#dimensions').textContent = `${width} colunas × ${height} linhas · ${width * height} tiles`;
  }
  function paint(r, c) {
    if (!cells[r] || cells[r][c] === undefined) return;
    cells[r][c] = activeTool;
    const index = r * width + c;
    const cell = gridEl.children[index];
    if (cell) {
      cell.className = `cell ${symbols[activeTool].cls}`;
      cell.textContent = activeTool === 'D' || activeTool === 'p' ? activeTool : '';
      cell.title = `Coluna ${c}, linha ${r}: ${symbols[activeTool].name}`;
    }
  }
  function selectTool(value) {
    activeTool = value;
    document.querySelectorAll('.tool').forEach((el) => el.classList.toggle('active', el.dataset.tool === value));
    $('#activeTool').textContent = `Pincel: ${symbols[value].name} (${value === ' ' ? 'apagar' : value})`;
  }
  function bordered() {
    for (let c = 0; c < width; c++) { cells[0][c] = '#'; cells[height - 1][c] = '#'; }
    for (let r = 0; r < height; r++) { cells[r][0] = '#'; cells[r][width - 1] = '#'; }
    render(); announce('Paredes aplicadas nas bordas. Pinte por cima para abrir passagens.');
  }
  function loadPreset(name) {
    if (name === 'hall') { createGrid(17, 8, '.'); bordered(); }
    else if (name === 'l') {
      createGrid(17, 12, '.');
      for (let c=0;c<width;c++) { cells[0][c]='#'; cells[height-1][c]='#'; }
      for (let r=0;r<height;r++) { cells[r][0]='#'; cells[r][width-1]='#'; }
      for (let r=9;r<height;r++) for (let c=0;c<9;c++) cells[r][c]='#';
      render(); announce('Modelo em L carregado.');
    } else if (name === 'zoo') {
      createGrid(36,24,'.'); bordered();
      for (let c=3;c<=32;c++) { cells[5][c]='p'; cells[18][c]='p'; }
      for (let r=5;r<=18;r++) { cells[r][3]='p'; cells[r][32]='p'; }
      for (let r=18;r<height-1;r++) cells[r][18]='p';
      render(); announce('Modelo do zoológico carregado. Ajuste caminhos e entrada conforme desejar.');
    } else { createGrid(17,12,'.'); bordered(); }
    output.value = '';
  }
  function makeData() { return { width, height, layout: cells.map(row => row.map(v => v === ' ' ? '.' : v).join('')) }; }
  function jsCode() {
    const data = makeData();
    return `// Layout desenhado no Editor visual de cenários\nwidth: ${data.width},\nheight: ${data.height},\nlayout: [\n${data.layout.map(line => `  ${JSON.stringify(line)}`).join(',\n')}\n],`;
  }
  function download(name, text, type) {
    const blob = new Blob([text], { type }); const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url);
  }
  document.querySelectorAll('.tool').forEach(el => el.addEventListener('click', () => selectTool(el.dataset.tool)));
  $('#resize').addEventListener('click', () => {
    const nw = Math.max(3, Math.min(60, Number(widthInput.value) || 17));
    const nh = Math.max(3, Math.min(40, Number(heightInput.value) || 12));
    const next = Array.from({ length: nh }, (_, r) => Array.from({ length: nw }, (_, c) => cells[r]?.[c] ?? '.'));
    width = nw; height = nh; cells = next; render(); output.value = ''; announce('Tamanho atualizado. O conteúdo que coube na nova grade foi preservado.');
  });
  $('#loadPreset').addEventListener('click', () => loadPreset($('#preset').value));
  $('#border').addEventListener('click', bordered);
  $('#clear').addEventListener('click', () => { createGrid(width, height, '.'); output.value = ''; });
  $('#exportJs').addEventListener('click', () => { output.value = jsCode(); announce('Código JavaScript gerado. Copie o trecho para a definição do mapa em MAPS no script.js.'); });
  $('#exportJson').addEventListener('click', () => { download('layout-cenario.json', JSON.stringify(makeData(), null, 2), 'application/json'); announce('Arquivo JSON baixado.'); });
  $('#copy').addEventListener('click', async () => {
    if (!output.value) output.value = jsCode();
    try { await navigator.clipboard.writeText(output.value); announce('Código copiado.'); }
    catch { output.select(); document.execCommand('copy'); announce('Tentei copiar o código; se não funcionar, use Ctrl+C.'); }
  });
  $('#importFile').addEventListener('change', async (event) => {
    const file = event.target.files?.[0]; if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (!Array.isArray(data.layout) || !Number.isInteger(data.width) || !Number.isInteger(data.height) || data.layout.length !== data.height || data.layout.some(line => typeof line !== 'string' || line.length !== data.width)) throw new Error('Formato inválido');
      if (data.width > 60 || data.height > 40 || data.width < 3 || data.height < 3) throw new Error('Dimensões fora do limite (3–60 colunas, 3–40 linhas)');
      width = data.width; height = data.height; cells = data.layout.map(line => [...line].map(v => ['#','.','p','D'].includes(v) ? v : '.'));
      widthInput.value = width; heightInput.value = height; render(); output.value = ''; announce('Mapa importado.');
    } catch (err) { announce(`Não foi possível importar: ${err.message}`); }
    event.target.value = '';
  });
  window.addEventListener('pointerup', () => { painting = false; });
  window.addEventListener('blur', () => { painting = false; });
  createGrid(17,12,'.'); bordered();
})();
