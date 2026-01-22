document.addEventListener('DOMContentLoaded', () => {
    const dom = { 
        main: document.getElementById('main-content'),
        deleteModal: document.getElementById('delete-modal'),
        cancelDeleteBtn: document.getElementById('cancel-delete-btn'),
        confirmDeleteBtn: document.getElementById('confirm-delete-btn'),
        clearDataBtn: document.getElementById('clear-data-btn'), 
        projectDetailsModal: document.getElementById('project-details-modal'),
        closeProjectModalBtn: document.getElementById('close-project-modal-btn'),
        projectEmployeesList: document.getElementById('project-employees-list'),
        projectModalTitle: document.getElementById('project-modal-title'),
        projectModalSubtitle: document.getElementById('project-modal-subtitle'),
        trainingDetailsModal: document.getElementById('training-details-modal'),
        closeTrainingModalBtn: document.getElementById('close-training-modal-btn'),
        trainingEmployeesList: document.getElementById('training-employees-list'),
        searchInput: document.getElementById('searchInput'), 
        contractsGrid: document.getElementById('contractsGrid'), 
        totalGeralAD: document.getElementById('totalGeralAD'), 
        totalAtivos: document.getElementById('totalAtivos'), 
        totalInativos: document.getElementById('totalInativos'), 
        totalPendentes: document.getElementById('totalPendentes'), 
        totalRealizados: document.getElementById('totalRealizados'), 
        contractCount: document.getElementById('contractCount'), 
        machineChart: document.getElementById('machineStatusChart'), 
        contractChart: document.getElementById('contractStatusChart'),
        functionChart: document.getElementById('functionChart'),
        situationChart: document.getElementById('situationChart'),
        currentDateDisplay: document.getElementById('currentDateDisplay'),
        filterCoordenador: document.getElementById('filterCoordenador'), 
        filterContratoStatus: document.getElementById('filterContratoStatus'),
        importCsvBtn: document.getElementById('import-csv-btn'),
        csvInput: document.getElementById('csvInput'),
        clearFiltersBtn: document.getElementById('clearFiltersBtn'),
        themeToggle: document.getElementById('theme-toggle')
    };

    let machineStatusChart, contractStatusChart, functionChart, situationChart;
    let currentFilteredData = [], activeContractsData = [];
    let contractToDeleteId = null;
    let currentTrainingFilter = 'all';

    const getChartTextColor = () => document.documentElement.classList.contains('dark') ? '#9ca3af' : '#4b5563';

    function loadData() {
        const savedData = localStorage.getItem('bsm_contracts_data');
        activeContractsData = savedData ? JSON.parse(savedData) : [];
        
        // DATA ATUAL AUTOMÁTICA
        const now = new Date();
        const options = { day: 'numeric', month: 'long', year: 'numeric' };
        dom.currentDateDisplay.textContent = `HOJE: ${now.toLocaleDateString('pt-BR', options)}`;
        
        renderUI();
    }

    function saveData(data) {
        localStorage.setItem('bsm_contracts_data', JSON.stringify(data));
        activeContractsData = data;
        renderUI();
    }

    function renderUI() {
        populateFilters(); 
        updateSummaryCards(); 
        applyFiltersAndSearch();
        dom.clearDataBtn.style.display = activeContractsData.length > 0 ? 'inline-flex' : 'none';
    }

    function renderContracts(contracts) {
        dom.contractsGrid.innerHTML = '';
        if (contracts.length === 0) {
            dom.contractsGrid.innerHTML = `
                <div class="col-span-full flex flex-col items-center justify-center py-16 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-dashed border-gray-300 dark:border-gray-700">
                    <div class="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-full mb-4">
                        <i data-lucide="folder-open" class="w-8 h-8 text-gray-400"></i>
                    </div>
                    <p class="text-gray-500 dark:text-gray-400 font-medium text-lg">Nenhum dado encontrado</p>
                    <p class="text-sm text-gray-400 dark:text-gray-500 mt-1">Importe uma planilha CSV para começar.</p>
                </div>`;
            lucide.createIcons();
            return;
        }
        const fragment = document.createDocumentFragment();
        contracts.forEach(c => {
            const totalColab = c.projetos.reduce((acc, p) => acc + (p.colaboradores||[]).length, 0);

            const card = document.createElement('div');
            card.className = `bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow duration-200 flex flex-col h-full`;
            
            let html = `<div class="flex-grow">
                <div class="flex justify-between items-start mb-4">
                    <div class="pr-4">
                        <h2 class="font-bold text-lg text-gray-800 dark:text-white leading-tight">${c.empresa}</h2>
                        <div class="flex items-center mt-1 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700/50 w-fit px-2 py-1 rounded-md">
                            <i data-lucide="users" class="w-3.5 h-3.5 mr-1.5"></i> ${totalColab} Colaboradores
                        </div>
                    </div>
                    <div class="flex items-center gap-1 flex-shrink-0">
                        <button title="Excluir" class="delete-btn p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" data-id="${c.id}"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                    </div>
                </div>
                <div>
                    <h3 class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Projetos (${c.projetos.length})</h3>
                    <ul class="space-y-2 text-sm max-h-56 overflow-y-auto pr-1 custom-scrollbar">`;

            if (c.projetos.length === 0) {
                    html += `<li class="text-xs text-gray-400 italic p-2 text-center bg-gray-50 dark:bg-gray-800/50 rounded-lg">Sem projetos cadastrados.</li>`;
            }

            c.projetos.forEach((proj, idx) => {
                    const qtd = (proj.colaboradores || []).length;
                    const pendentes = (proj.colaboradores || []).filter(col => col.status !== 'Realizado' && col.situacao !== 'D').length;
                    const desligados = (proj.colaboradores || []).filter(col => col.situacao === 'D').length;
                    
                    let statusColor = pendentes > 0 ? 'text-yellow-700 bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800' : 'text-green-700 bg-green-50 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800';
                    let statusText = pendentes > 0 ? `${pendentes} Pend.` : '100% OK';
                    
                    if(desligados === qtd && qtd > 0) {
                        statusText = 'Inativo';
                        statusColor = 'text-red-700 bg-red-50 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800';
                    } else if (qtd === 0) {
                        statusText = 'Vazio';
                        statusColor = 'text-gray-500 bg-gray-100 border-gray-200';
                    }

                    const badge = `<span class="text-[10px] font-semibold px-2 py-0.5 rounded border ${statusColor} ml-auto shrink-0">${statusText}</span>`;

                    html += `<li class="flex justify-between items-center p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer project-item group transition-colors border border-transparent hover:border-gray-100 dark:hover:border-gray-700" data-contract-id="${c.id}" data-project-idx="${idx}">
                            <span class="flex items-center min-w-0 mr-2">
                                <div class="p-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-md mr-2.5 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 transition-colors shrink-0"><i data-lucide="folder" class="w-3.5 h-3.5"></i></div>
                                <div class="flex flex-col truncate">
                                    <span class="truncate font-medium text-gray-700 dark:text-gray-300" title="${proj.nome}">${proj.nome}</span>
                                    <span class="text-xs text-gray-400">${qtd} colab.</span>
                                </div>
                            </span>
                            ${badge}
                            </li>`;
            });

            html += `</ul></div></div>`;
            card.innerHTML = html;
            fragment.appendChild(card);
        });
        dom.contractsGrid.appendChild(fragment);
        lucide.createIcons({ nodes: dom.contractsGrid.querySelectorAll('[data-lucide]') });

        dom.contractsGrid.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', (e) => { e.stopPropagation(); handleDeleteClick(btn.dataset.id); }));
        
        dom.contractsGrid.querySelectorAll('.project-item').forEach(item => {
            item.addEventListener('click', () => handleProjectClick(item.dataset.contractId, item.dataset.projectIdx));
        });
    }

    function handleProjectClick(contractId, projectIdx) {
        const contract = activeContractsData.find(c => String(c.id) === String(contractId));
        if (!contract || !contract.projetos[projectIdx]) return;

        const projeto = contract.projetos[projectIdx];
        
        dom.projectModalTitle.textContent = projeto.nome;
        dom.projectModalSubtitle.textContent = `${contract.empresa} - ${projeto.colaboradores.length} Colaboradores`;
        dom.projectEmployeesList.innerHTML = '';

        if (projeto.colaboradores.length === 0) {
                dom.projectEmployeesList.innerHTML = `<tr><td colspan="4" class="px-6 py-4 text-center text-gray-400">Nenhum colaborador neste projeto.</td></tr>`;
        } else {
            projeto.colaboradores.forEach(col => {
                const isInactive = col.situacao === 'D';
                const isPending = col.status !== 'Realizado' && !isInactive;
                
                let statusBadge = '';
                if (isInactive) statusBadge = `<span class="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">Desligado</span>`;
                else statusBadge = `<span class="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">Ativo</span>`;

                let treinoBadge = '';
                if (col.status === 'Realizado') treinoBadge = `<span class="flex items-center text-green-600 dark:text-green-400"><i data-lucide="check-circle" class="w-4 h-4 mr-1"></i> Realizado</span>`;
                else if (isInactive) treinoBadge = `<span class="text-gray-400">-</span>`;
                else treinoBadge = `<span class="flex items-center text-yellow-600 dark:text-yellow-400"><i data-lucide="clock" class="w-4 h-4 mr-1"></i> Pendente</span>`;

                const row = `
                <tr class="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td class="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">${col.nome}</td>
                    <td class="px-6 py-4">${col.funcao || '-'}</td>
                    <td class="px-6 py-4">${statusBadge}</td>
                    <td class="px-6 py-4">${treinoBadge}</td>
                </tr>`;
                dom.projectEmployeesList.innerHTML += row;
            });
        }
        lucide.createIcons({ nodes: dom.projectEmployeesList.querySelectorAll('[data-lucide]') });
        dom.projectDetailsModal.classList.remove('hidden');
    }

    // Expose to window for onclick in HTML
    window.openTrainingModal = function(type) {
        const titleMap = { 'ativos': 'Colaboradores Ativos', 'pendente': 'Pendência de Treinamento', 'realizado': 'Treinamentos Realizados' };
        dom.trainingModalTitle.textContent = titleMap[type] || 'Detalhamento';
        
        // Set default filter based on click type
        if (type === 'pendente') setTrainingFilter('pendente');
        else if (type === 'realizado') setTrainingFilter('realizado');
        else setTrainingFilter('all');
        
        dom.trainingDetailsModal.classList.remove('hidden');
    };

    window.setTrainingFilter = function(filter) {
        currentTrainingFilter = filter;
        const buttons = {
            'all': document.getElementById('btn-filter-all'),
            'realizado': document.getElementById('btn-filter-realizado'),
            'pendente': document.getElementById('btn-filter-pendente')
        };

        // Reset styles
        Object.values(buttons).forEach(btn => {
            btn.className = "px-4 py-2 text-sm rounded-lg font-medium transition-all shadow-sm bg-gray-100 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600";
        });
        
        // Active style
        buttons[filter].className = "px-4 py-2 text-sm rounded-lg font-medium transition-all shadow-sm bg-blue-600 text-white hover:bg-blue-700";

        renderTrainingList();
    };

    function renderTrainingList() {
        dom.trainingEmployeesList.innerHTML = '';
        let rows = [];

        activeContractsData.forEach(c => {
            c.projetos.forEach(p => {
                p.colaboradores.forEach(col => {
                    if (col.situacao === 'D') return; // Only actives in this modal
                    
                    const isPendente = col.status !== 'Realizado';
                    
                    if (currentTrainingFilter === 'realizado' && isPendente) return;
                    if (currentTrainingFilter === 'pendente' && !isPendente) return;

                    let statusHtml = isPendente 
                        ? `<span class="flex items-center text-yellow-600 dark:text-yellow-400 font-medium"><i data-lucide="alert-triangle" class="w-4 h-4 mr-1.5"></i> Pendente</span>`
                        : `<span class="flex items-center text-green-600 dark:text-green-400 font-medium"><i data-lucide="check-circle-2" class="w-4 h-4 mr-1.5"></i> Realizado</span>`;

                    rows.push(`
                    <tr class="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td class="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">${col.nome}</td>
                        <td class="px-6 py-4 text-xs uppercase tracking-wide">${c.empresa}</td>
                        <td class="px-6 py-4 text-xs">${p.nome}</td>
                        <td class="px-6 py-4 text-xs">${col.funcao}</td>
                        <td class="px-6 py-4">${statusHtml}</td>
                    </tr>`);
                });
            });
        });

        if (rows.length === 0) {
            dom.trainingEmployeesList.innerHTML = `<tr><td colspan="5" class="px-6 py-8 text-center text-gray-500">Nenhum registro encontrado para este filtro.</td></tr>`;
        } else {
            dom.trainingEmployeesList.innerHTML = rows.join('');
        }
        lucide.createIcons({ nodes: dom.trainingEmployeesList.querySelectorAll('[data-lucide]') });
    }

    function handleDeleteClick(id) {
        contractToDeleteId = id;
        dom.deleteModal.classList.remove('hidden');
    }

    function confirmDelete() {
        if (contractToDeleteId) {
            const newData = activeContractsData.filter(c => String(c.id) !== String(contractToDeleteId));
            saveData(newData);
            dom.deleteModal.classList.add('hidden');
            contractToDeleteId = null;
        }
    }

    function updateSummaryCards() {
        let totalGeral = 0, ativos = 0, inativos = 0, pendentes = 0, realizados = 0;

        activeContractsData.forEach(c => {
            c.projetos.forEach(p => {
                if (!p.colaboradores) return;
                p.colaboradores.forEach(col => {
                    totalGeral++;
                    if (col.situacao === 'D') {
                        inativos++;
                    } else {
                        ativos++;
                        if (col.status === 'Realizado') realizados++;
                        else pendentes++;
                    }
                });
            });
        });

        animateValue(dom.totalGeralAD, parseInt(dom.totalGeralAD.innerText), totalGeral, 500);
        animateValue(dom.totalAtivos, parseInt(dom.totalAtivos.innerText), ativos, 500);
        animateValue(dom.totalInativos, parseInt(dom.totalInativos.innerText), inativos, 500);
        animateValue(dom.totalPendentes, parseInt(dom.totalPendentes.innerText), pendentes, 500);
        animateValue(dom.totalRealizados, parseInt(dom.totalRealizados.innerText), realizados, 500);
        dom.contractCount.textContent = `Total Empresas: ${activeContractsData.length}`;
    }

    function animateValue(obj, start, end, duration) {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            obj.innerHTML = Math.floor(progress * (end - start) + start);
            if (progress < 1) window.requestAnimationFrame(step);
        };
        window.requestAnimationFrame(step);
    }

    function populateFilters() {
        const empresas = [...new Set(activeContractsData.map(c => c.empresa))].sort();
        let projetos = new Set();
        activeContractsData.forEach(c => c.projetos.forEach(p => projetos.add(p.nome)));
        const projetosSorted = [...projetos].sort();

        // Save current selections
        const currentEmpresa = dom.filterContratoStatus.value;
        const currentProjeto = dom.filterCoordenador.value;

        dom.filterContratoStatus.innerHTML = '<option value="">Todas Empresas</option>';
        empresas.forEach(emp => {
            dom.filterContratoStatus.innerHTML += `<option value="${emp}">${emp}</option>`;
        });

        dom.filterCoordenador.innerHTML = '<option value="">Todos Projetos</option>';
        projetosSorted.forEach(proj => {
            dom.filterCoordenador.innerHTML += `<option value="${proj}">${proj}</option>`;
        });

        // Restore selections if valid
        if (empresas.includes(currentEmpresa)) dom.filterContratoStatus.value = currentEmpresa;
        if (projetosSorted.includes(currentProjeto)) dom.filterCoordenador.value = currentProjeto;
    }

    function applyFiltersAndSearch() {
        const term = dom.searchInput.value.toLowerCase();
        const empresaFilter = dom.filterContratoStatus.value;
        const projetoFilter = dom.filterCoordenador.value;

        currentFilteredData = activeContractsData.filter(c => {
            // Filter by Empresa
            if (empresaFilter && c.empresa !== empresaFilter) return false;

            // Filter by Search (Empresa name)
            const matchesEmpresaName = c.empresa.toLowerCase().includes(term);

            // Filter by Search or Project Filter (Deep check in projects)
            const hasMatchingProject = c.projetos.some(p => {
                const matchesProjFilter = projetoFilter ? p.nome === projetoFilter : true;
                const matchesProjName = p.nome.toLowerCase().includes(term);
                
                // Also search in collaborator names
                const matchesColabName = p.colaboradores.some(col => col.nome.toLowerCase().includes(term));

                return matchesProjFilter && (matchesEmpresaName || matchesProjName || matchesColabName);
            });
            
            if (!hasMatchingProject && !matchesEmpresaName) return false;
            
            // If we are filtering by project, ensure the contract actually has that project
            if (projetoFilter) {
                    return c.projetos.some(p => p.nome === projetoFilter);
            }

            return true;
        }).map(c => {
            // Clone to avoid mutating original data during display filtering
            if (projetoFilter) {
                return {
                    ...c,
                    projetos: c.projetos.filter(p => p.nome === projetoFilter)
                };
            }
            return c;
        });

        renderContracts(currentFilteredData);
        updateCharts();
    }

    function updateCharts() {
        let pendentes = 0, realizados = 0;
        let projectVolumes = {};
        let functionCounts = {};
        let statusCounts = { 'A': 0, 'D': 0 };

        currentFilteredData.forEach(c => {
            c.projetos.forEach(p => {
                if (!projectVolumes[p.nome]) projectVolumes[p.nome] = 0;
                projectVolumes[p.nome] += p.colaboradores.length;

                p.colaboradores.forEach(col => {
                    // Stats for Chart 1
                    if (col.situacao !== 'D') {
                        if (col.status === 'Realizado') realizados++;
                        else pendentes++;
                    }

                    // Stats for Chart 3 (Functions)
                    const func = col.funcao || 'Não Informado';
                    if (!functionCounts[func]) functionCounts[func] = 0;
                    functionCounts[func]++;

                    // Stats for Chart 4 (Situation)
                    if (col.situacao === 'D') statusCounts['D']++;
                    else statusCounts['A']++;
                });
            });
        });

        // --- Chart 1: Status Treinamento (Doughnut) ---
        if (machineStatusChart) machineStatusChart.destroy();
        const ctx1 = dom.machineChart.getContext('2d');
        machineStatusChart = new Chart(ctx1, {
            type: 'doughnut',
            data: {
                labels: ['Realizado', 'Pendente'],
                datasets: [{
                    data: [realizados, pendentes],
                    backgroundColor: ['#10b981', '#fbbf24'], 
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { color: getChartTextColor() } },
                    datalabels: {
                        color: '#fff',
                        font: { weight: 'bold' },
                        formatter: (value, ctx) => {
                            if(value === 0) return '';
                            let sum = 0;
                            let dataArr = ctx.chart.data.datasets[0].data;
                            dataArr.map(data => { sum += data; });
                            return (value*100 / sum).toFixed(1)+"%";
                        }
                    }
                }
            },
            plugins: [ChartDataLabels]
        });

        // --- Chart 2: Volume por Projeto (Bar) ---
        const sortedProjects = Object.entries(projectVolumes)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 8);
        
        if (contractStatusChart) contractStatusChart.destroy();
        const ctx2 = dom.contractChart.getContext('2d');
        contractStatusChart = new Chart(ctx2, {
            type: 'bar',
            data: {
                labels: sortedProjects.map(([name]) => name.length > 15 ? name.substring(0,15)+'...' : name),
                datasets: [{
                    label: 'Colaboradores',
                    data: sortedProjects.map(([,count]) => count),
                    backgroundColor: '#3b82f6',
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                scales: {
                    x: { grid: { display: false }, ticks: { color: getChartTextColor() } },
                    y: { grid: { display: false }, ticks: { color: getChartTextColor() } }
                },
                plugins: {
                    legend: { display: false },
                    datalabels: {
                        anchor: 'end',
                        align: 'end',
                        color: getChartTextColor(),
                        formatter: Math.round
                    }
                }
            },
            plugins: [ChartDataLabels]
        });

        // --- NEW Chart 3: Top Funções (Bar Horizontal) ---
        const sortedFunctions = Object.entries(functionCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5); // Top 5
        
        if (functionChart) functionChart.destroy();
        const ctx3 = dom.functionChart.getContext('2d');
        functionChart = new Chart(ctx3, {
            type: 'bar',
            data: {
                labels: sortedFunctions.map(([name]) => name.length > 15 ? name.substring(0,15)+'...' : name),
                datasets: [{
                    label: 'Qtd',
                    data: sortedFunctions.map(([,count]) => count),
                    backgroundColor: '#8b5cf6', // Violet-500
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                scales: {
                    x: { grid: { display: false }, ticks: { color: getChartTextColor() } },
                    y: { grid: { display: false }, ticks: { color: getChartTextColor() } }
                },
                plugins: {
                    legend: { display: false },
                    datalabels: {
                        anchor: 'end',
                        align: 'end',
                        color: getChartTextColor(),
                        formatter: Math.round
                    }
                }
            },
            plugins: [ChartDataLabels]
        });

        // --- NEW Chart 4: Situação (Doughnut/Pie) ---
        if (situationChart) situationChart.destroy();
        const ctx4 = dom.situationChart.getContext('2d');
        situationChart = new Chart(ctx4, {
            type: 'doughnut',
            data: {
                labels: ['Ativos', 'Inativos'],
                datasets: [{
                    data: [statusCounts['A'], statusCounts['D']],
                    backgroundColor: ['#10b981', '#ef4444'], // Green-500, Red-500
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '60%',
                plugins: {
                    legend: { position: 'bottom', labels: { color: getChartTextColor() } },
                    datalabels: {
                        color: '#fff',
                        font: { weight: 'bold' },
                        formatter: (value, ctx) => {
                            if(value === 0) return '';
                            let sum = 0;
                            let dataArr = ctx.chart.data.datasets[0].data;
                            dataArr.map(data => { sum += data; });
                            return (value*100 / sum).toFixed(1)+"%";
                        }
                    }
                }
            },
            plugins: [ChartDataLabels]
        });
    }

    // --- CSV PARSING ---
    dom.importCsvBtn.addEventListener('click', () => dom.csvInput.click());
    dom.csvInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const text = event.target.result;
                processCSV(text);
                dom.csvInput.value = ''; // Reset
            } catch (err) {
                alert('Erro ao processar arquivo: ' + err.message);
            }
        };
        reader.readAsText(file, 'ISO-8859-1'); // Common for Excel CSVs in Brazil
    });

    function processCSV(csvText) {
        // Expected Headers: Empresa;Projeto;Colaborador;Funcao;Situacao;StatusTreinamento
        const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== '');
        if (lines.length < 2) return;

        const separator = lines[0].includes(';') ? ';' : ',';
        const rows = lines.slice(1).map(line => line.split(separator).map(c => c.trim().replace(/^"|"$/g, '')));

        let newContractsMap = new Map();

        rows.forEach(row => {
            if (row.length < 3) return; 
            
            const empresaName = row[0] || 'Sem Empresa';
            const projetoName = row[1] || 'Geral';
            const colabNome = row[2];
            const colabFuncao = row[3] || '';
            const colabSituacao = row[4] || 'A';
            const colabStatus = row[5] || 'Pendente';

            if (!newContractsMap.has(empresaName)) {
                newContractsMap.set(empresaName, {
                    id: Date.now() + Math.random().toString(36).substr(2, 9),
                    empresa: empresaName,
                    projetos: []
                });
            }

            const contract = newContractsMap.get(empresaName);
            let projeto = contract.projetos.find(p => p.nome === projetoName);
            
            if (!projeto) {
                projeto = { nome: projetoName, colaboradores: [] };
                contract.projetos.push(projeto);
            }

            if (colabNome) {
                projeto.colaboradores.push({
                    nome: colabNome,
                    funcao: colabFuncao,
                    situacao: colabSituacao,
                    status: colabStatus
                });
            }
        });

        const importedData = Array.from(newContractsMap.values());
        
        if (confirm(`Foram encontrados ${importedData.length} contratos/empresas. Deseja substituir os dados atuais?`)) {
            saveData(importedData);
        }
    }

    // --- EVENT LISTENERS ---
    dom.searchInput.addEventListener('input', applyFiltersAndSearch);
    dom.filterCoordenador.addEventListener('change', applyFiltersAndSearch);
    dom.filterContratoStatus.addEventListener('change', applyFiltersAndSearch);
    
    dom.clearFiltersBtn.addEventListener('click', () => {
        dom.searchInput.value = '';
        dom.filterCoordenador.value = '';
        dom.filterContratoStatus.value = '';
        applyFiltersAndSearch();
    });

    dom.closeProjectModalBtn.addEventListener('click', () => dom.projectDetailsModal.classList.add('hidden'));
    dom.closeTrainingModalBtn.addEventListener('click', () => dom.trainingDetailsModal.classList.add('hidden'));
    dom.projectDetailsModal.addEventListener('click', (e) => { if(e.target === dom.projectDetailsModal) dom.projectDetailsModal.classList.add('hidden'); });
    dom.trainingDetailsModal.addEventListener('click', (e) => { if(e.target === dom.trainingDetailsModal) dom.trainingDetailsModal.classList.add('hidden'); });

    dom.cancelDeleteBtn.addEventListener('click', () => dom.deleteModal.classList.add('hidden'));
    dom.confirmDeleteBtn.addEventListener('click', confirmDelete);

    dom.clearDataBtn.addEventListener('click', () => {
        if(confirm('Tem certeza que deseja apagar TODOS os dados?')) {
            saveData([]);
        }
    });

    dom.themeToggle.addEventListener('click', () => {
        document.documentElement.classList.toggle('dark');
        const isDark = document.documentElement.classList.contains('dark');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        updateCharts(); // Refresh chart colors
    });

    // Init
    loadData();
});
