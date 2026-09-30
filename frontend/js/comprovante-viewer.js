/**
 * Visualizador Oficial de Comprovantes AMAS (HTML5 Canvas com PDF.js)
 * Renderiza documentos PDF e imagens diretamente no Canvas, sem IFRAMEs nem plugins externos.
 * Corrige em definitivo o erro "Esta página foi bloqueada pelo Microsoft Edge",
 * proporcionando experiência fluida com zoom, visualização contínua de páginas e alta nitidez.
 */
(function () {
  'use strict';

  function criarInstanciaVisualizador(prefixo) {
    let pdfDoc = null;
    let escalaAtual = 1.25;
    let urlAtual = '';
    let renderTaskId = 0;

    function getEl(id) {
      return document.getElementById(id);
    }

    async function renderizarPaginas() {
      const scrollArea = getEl(prefixo + 'ScrollArea');
      const spinner = getEl(prefixo + 'Spinner');
      const zoomVal = getEl(prefixo + 'ZoomVal');
      const pageCountEl = getEl(prefixo + 'PageCount');

      if (!scrollArea) return;
      renderTaskId++;
      const currentTaskId = renderTaskId;

      if (!pdfDoc) return;

      scrollArea.innerHTML = '';
      if (spinner) spinner.style.display = 'flex';

      try {
        const numPages = pdfDoc.numPages;
        if (pageCountEl) {
          pageCountEl.textContent = numPages === 1 ? '1 página' : `${numPages} páginas`;
        }
        if (zoomVal) {
          zoomVal.textContent = Math.round(escalaAtual * 100) + '%';
        }

        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
          if (currentTaskId !== renderTaskId) return;

          const page = await pdfDoc.getPage(pageNum);
          const viewport = page.getViewport({ scale: escalaAtual });

          const pageWrapper = document.createElement('div');
          pageWrapper.style.position = 'relative';
          pageWrapper.style.marginBottom = '20px';
          pageWrapper.style.display = 'flex';
          pageWrapper.style.flexDirection = 'column';
          pageWrapper.style.alignItems = 'center';

          // Indicador de número da página se for multi-páginas
          if (numPages > 1) {
            const pageNumTag = document.createElement('span');
            pageNumTag.textContent = `Página ${pageNum} de ${numPages}`;
            pageNumTag.style.fontSize = '0.75rem';
            pageNumTag.style.color = '#94a3b8';
            pageNumTag.style.marginBottom = '6px';
            pageWrapper.appendChild(pageNumTag);
          }

          const canvas = document.createElement('canvas');
          canvas.className = 'comprovante-pdf-page';

          // Suporte a telas HiDPI / Retina para texto ultra nítido
          const outputScale = window.devicePixelRatio || 1;
          canvas.width = Math.floor(viewport.width * outputScale);
          canvas.height = Math.floor(viewport.height * outputScale);
          canvas.style.width = Math.floor(viewport.width) + 'px';
          canvas.style.height = Math.floor(viewport.height) + 'px';
          canvas.style.borderRadius = '4px';
          canvas.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.5)';
          canvas.style.background = '#ffffff';

          const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null;

          const renderContext = {
            canvasContext: canvas.getContext('2d'),
            transform: transform,
            viewport: viewport
          };

          await page.render(renderContext).promise;

          if (currentTaskId !== renderTaskId) return;
          pageWrapper.appendChild(canvas);
          scrollArea.appendChild(pageWrapper);
        }

        if (spinner) spinner.style.display = 'none';
      } catch (err) {
        console.error('Erro ao renderizar páginas do PDF:', err);
        if (currentTaskId === renderTaskId) {
          mostrarFallback(err.message || 'Falha ao renderizar documento.');
        }
      }
    }

    function mostrarFallback(msg) {
      const scrollArea = getEl(prefixo + 'ScrollArea');
      const spinner = getEl(prefixo + 'Spinner');
      if (spinner) spinner.style.display = 'none';
      if (!scrollArea) return;

      scrollArea.innerHTML = `
        <div style="text-align:center; padding:48px 24px; color:#fff; max-width:500px; margin:auto;">
          <div style="width:72px; height:72px; border-radius:50%; background:rgba(207,148,29,0.15); border:2px solid #cf941d; display:flex; align-items:center; justify-content:center; margin:0 auto 16px;">
            <i class="bi bi-file-earmark-check" style="font-size:2.2rem; color:#cf941d;"></i>
          </div>
          <h4 style="font-size:1.15rem; margin-bottom:8px; font-weight:700; color:#f8fafc;">Documento Pronto para Acesso</h4>
          <p style="font-size:0.88rem; color:#94a3b8; margin-bottom:24px; line-height:1.55;">
            Você pode visualizar o comprovante abrindo-o em uma nova guia ou baixá-lo diretamente para seu dispositivo.
          </p>
          <div style="display:flex; gap:12px; justify-content:center; flex-wrap:wrap;">
            <a href="${urlAtual}" target="_blank" rel="noopener" class="btn btn-primary" style="background:#cf941d!important;color:#fff!important;padding:10px 18px;">
              <i class="bi bi-box-arrow-up-right"></i> Abrir em Nova Guia
            </a>
            <a href="${urlAtual}" download class="btn btn-outline" style="border-color:rgba(255,255,255,0.25); color:#fff; padding:10px 18px;">
              <i class="bi bi-download"></i> Baixar Arquivo
            </a>
          </div>
        </div>
      `;
    }

    function renderizarImagem(url) {
      const scrollArea = getEl(prefixo + 'ScrollArea');
      const spinner = getEl(prefixo + 'Spinner');
      const pageCountEl = getEl(prefixo + 'PageCount');
      const zoomVal = getEl(prefixo + 'ZoomVal');

      if (!scrollArea) return;
      if (spinner) spinner.style.display = 'none';

      scrollArea.innerHTML = `
        <div style="display:flex; justify-content:center; padding:16px; width:100%;">
          <img src="${url}" alt="Comprovante" style="max-width:100%; max-height:80vh; object-fit:contain; border-radius:6px; box-shadow:0 8px 30px rgba(0,0,0,0.6);" />
        </div>
      `;
      if (pageCountEl) pageCountEl.textContent = 'Imagem';
      if (zoomVal) zoomVal.textContent = 'Auto';
    }

    async function carregarDocumento(url, nomeArquivo) {
      urlAtual = url;
      pdfDoc = null;
      renderTaskId++;

      const scrollArea = getEl(prefixo + 'ScrollArea');
      const spinner = getEl(prefixo + 'Spinner');

      if (scrollArea) scrollArea.innerHTML = '';
      if (spinner) spinner.style.display = 'flex';

      // Verifica se é imagem
      const ext = (nomeArquivo || url || '').toLowerCase();
      if (ext.endsWith('.png') || ext.endsWith('.jpg') || ext.endsWith('.jpeg') || ext.endsWith('.webp') || url.startsWith('data:image/')) {
        renderizarImagem(url);
        return;
      }

      // Certifica que o PDF.js está carregado
      if (!window.pdfjsLib) {
        mostrarFallback('Carregamento direto');
        return;
      }

      try {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'js/pdf.worker.min.js';
        const loadingTask = window.pdfjsLib.getDocument({
          url: url,
          cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
          cMapPacked: true
        });

        pdfDoc = await loadingTask.promise;
        escalaAtual = 1.25;

        // Auto-fit inicial proporcional ao container
        const firstPage = await pdfDoc.getPage(1);
        const unscaledViewport = firstPage.getViewport({ scale: 1.0 });
        const availableWidth = scrollArea ? (scrollArea.clientWidth - 48) : 800;
        if (availableWidth > 200 && unscaledViewport.width > 0) {
          escalaAtual = Math.min(1.4, Math.max(0.65, availableWidth / unscaledViewport.width));
        }

        await renderizarPaginas();
      } catch (err) {
        console.error('Erro ao abrir documento PDF:', err);
        mostrarFallback(err.message);
      }
    }

    function zoomIn() {
      if (!pdfDoc) return;
      escalaAtual = Math.min(3.0, escalaAtual + 0.25);
      renderizarPaginas();
    }

    function zoomOut() {
      if (!pdfDoc) return;
      escalaAtual = Math.max(0.5, escalaAtual - 0.25);
      renderizarPaginas();
    }

    async function zoomFit() {
      const scrollArea = getEl(prefixo + 'ScrollArea');
      if (!pdfDoc || !scrollArea) return;
      try {
        const page = await pdfDoc.getPage(1);
        const vp = page.getViewport({ scale: 1.0 });
        const availableWidth = scrollArea.clientWidth - 48;
        if (availableWidth > 200 && vp.width > 0) {
          escalaAtual = availableWidth / vp.width;
          renderizarPaginas();
        }
      } catch (e) {
        escalaAtual = 1.0;
        renderizarPaginas();
      }
    }

    function limpar() {
      renderTaskId++;
      pdfDoc = null;
      urlAtual = '';
      const scrollArea = getEl(prefixo + 'ScrollArea');
      const spinner = getEl(prefixo + 'Spinner');
      if (scrollArea) scrollArea.innerHTML = '';
      if (spinner) spinner.style.display = 'none';
    }

    // Configurar listeners de botões de zoom
    const zoomInBtn = getEl(prefixo + 'ZoomIn');
    const zoomOutBtn = getEl(prefixo + 'ZoomOut');
    const zoomFitBtn = getEl(prefixo + 'ZoomFit');
    if (zoomInBtn) zoomInBtn.onclick = zoomIn;
    if (zoomOutBtn) zoomOutBtn.onclick = zoomOut;
    if (zoomFitBtn) zoomFitBtn.onclick = zoomFit;

    return {
      carregar: carregarDocumento,
      limpar: limpar
    };
  }

  window.comprovanteViewerAdmin = null;
  window.comprovanteViewerUser = null;

  window.initComprovanteViewers = function () {
    if (document.getElementById('adminPdfScrollArea') && !window.comprovanteViewerAdmin) {
      window.comprovanteViewerAdmin = criarInstanciaVisualizador('adminPdf');
    }
    if (document.getElementById('userPdfScrollArea') && !window.comprovanteViewerUser) {
      window.comprovanteViewerUser = criarInstanciaVisualizador('userPdf');
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.initComprovanteViewers);
  } else {
    window.initComprovanteViewers();
  }
})();
