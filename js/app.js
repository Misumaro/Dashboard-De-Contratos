// Dashboard Application - Main Controller
const Dashboard = (function() {
    // Elementos DOM
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
        projectSearchInput: document.getElementById('projectSearchInput'),

        trainingDetailsModal: document.getElementById('training-details-modal'),
        closeTrainingModalBtn: document.getElementById('close-training-modal-btn'),
        trainingEmployeesList: document.getElementById('training-employees-list'),
        trainingModalTitle: document.getElementById('training-modal-title'),
        
        colabDetailsModal: document.getElementById('colab-details-modal'),
        closeColabModalBtn: document.getElementById('close-colab-modal-btn'),
        colabModalName: document.getElementById('colab-modal-name'),
        colabModalInfo: document.getElementById('colab-modal-info'),
        colabDisparado: document.getElementById('colab-disparado'),
        colabRealizado: document.getElementById('colab-realizado'),
        colabReciclagensList: document.getElementById('colab-reciclagens-list'),

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
        yearComplianceChart: document.getElementById('yearComplianceChart'),
        currentDateDisplay: document.getElementById('currentDateDisplay'),
        filterCoordenador: document.getElementById('filterCoordenador'), 
        filterContratoStatus: document.getElementById('filterContratoStatus'),
        filterAno: document.getElementById('filterAno'), 
        importCsvBtn: document.getElementById('import-csv-btn'),
        csvInput: document.getElementById('csvInput'),
        clearFiltersBtn: document.getElementById('clearFiltersBtn'),
        themeToggle: document.getElementById('theme-toggle')
    };

    // Estado da aplicação
    let state = {
        machineStatusChart: null,
        contractStatusChart: null,
        functionChart: null,
        situationChart: null,
        yearComplianceChart: null,
        currentFilteredData: [],
        activeContractsData: [],
        contractToDeleteId: null,
        currentTrainingFilter: 'all',
        activeDrillDown: null
    };

    // Configuração
    const CONFIG = {
        STORAGE_KEY: 'bsm_contracts_data_v3',
        DEFAULT_CHART_COLORS: {
            realized: '#10b981',
            delayed: '#ef4444',
            pending: '#fbbf24',
            active: '#10b981',
            inactive: '#ef4444',
            project: '#3b82f6',
            function: '#8b5cf6'
        }
    };

    // Utilitários
    const utils = {
        getChartTextColor: () => document.documentElement.classList.contains('dark') ? '#9ca3af' : '#4b5563',
        
        animateValue: (element, start, end, duration) => {
            if (start === end) return;
            let startTimestamp = null;
            const step = (timestamp) => {
                if (!startTimestamp) startTimestamp = timestamp;
                const progress = Math.min((timestamp - startTimestamp) / duration, 1);
                element.innerHTML = Math.floor(progress * (end - start) + start);
                if (progress < 1) window.requestAnimationFrame(step);
            };
            window.requestAnimationFrame(step);
        },
        
        cleanText: (text) => text ? text.trim().replace(/^"|"$/g, '') : '',
        
        parseBrDate: (str) => {
            if (!str || str.length < 8) return null;
            const parts = str.trim().split(/[\/\-]/);
            if (parts.length === 3) {
                const day = parseInt(parts[0], 10);
                const month = parseInt(parts[1], 10) - 1;
                const year = parseInt(parts[2], 10);
                if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
                    const d = new Date(year, month, day);
                    if (d.getFullYear() === year && d.getMonth() === month && d.getDate() === day) {
                        return d;
                    }
                }
            }
            return null;
        },
        
        escapeHtml: (text) => {
            const map = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#039;'
            };
            return text.replace(/[&<>"']/g, m => map[m]);
        }
    };

    // Funções principais
    function loadData() {
        try {
            const savedData = localStorage.getItem(CONFIG.STORAGE_KEY);
            state.activeContractsData = savedData ? JSON.parse(savedData) : [];
            
            const now = new Date();
            const options = { day: 'numeric', month: 'long', year: 'numeric' };
            dom.currentDateDisplay.textContent = `HOJE: ${now.toLocaleDateString('pt-BR', options)}`;
            
            renderUI();
            console.log('Dashboard carregado com sucesso!');
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            state.activeContractsData = [];
            renderUI();
        }
    }

    function saveData(data) {
        try {
            localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(data));
            state.activeContractsData = data;
            renderUI();
        } catch (error) {
            console.error('Erro ao salvar dados:', error);
            alert('Erro ao salvar dados. Verifique o console para mais detalhes.');
        }
    }

    function renderUI() {
        populateFilters();
        applyFiltersAndSearch();
        updateSummaryCards();
        dom.clearDataBtn.style.display = state.activeContractsData.length > 0 ? 'inline-flex' : 'none';
    }

    function renderContracts(contracts) {
        dom.contractsGrid.innerHTML = '';
        
        if (contracts.length === 0) {
            dom.contractsGrid.innerHTML = `
                <div class="col-span-full empty-state">
                    <div class="empty-state-icon">
                        <i data-lucide="folder-open" class="w-8 h-8 text-gray-400"></i>
                    </div>
                    <h3 class="empty-state-title">Nenhum dado encontrado</h3>
                    <p class="empty-state-description">Ajuste os filtros ou importe uma nova planilha.</p>
                </div>`;
            lucide.createIcons();
            return;
        }
        
        const fragment = document.createDocumentFragment();
        
        contracts.forEach(contract => {
            const totalColab = contract.projetos.reduce((acc, projeto) => acc + (projeto.colaboradores || []).length, 0);
            
            const card = document.createElement('div');
            card.className = 'bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow duration-200 flex flex-col h-full';
            
            let projetosHTML = '';
            
            if (contract.projetos.length === 0) {
                projetosHTML = `<li class="text-xs text-gray-400 italic p-2 text-center bg-gray-50 dark:bg-gray-800/50 rounded-lg">Sem projetos (após filtros).</li>`;
            } else {
                contract.projetos.forEach(projeto => {
                    const qtd = (projeto.colaboradores || []).length;
                    const pendentes = (projeto.colaboradores || []).filter(col => col.status !== 'Realizado' && col.situacao !== 'D').length;
                    const desligados = (projeto.colaboradores || []).filter(col => col.situacao === 'D').length;
                    const hasAtrasado = (projeto.colaboradores || []).some(col => col.status === 'Atrasado' && col.situacao !== 'D');
                    
                    let statusClass = 'badge-success';
                    let statusText = '100% OK';
                    
                    if (desligados === qtd && qtd > 0) {
                        statusClass = 'badge-neutral';
                        statusText = 'Inativo';
                    } else if (qtd === 0) {
                        statusClass = 'badge-neutral';
                        statusText = 'Vazio';
                    } else if (hasAtrasado) {
                        statusClass = 'badge-danger';
                        statusText = `${pendentes} Pend.`;
                    } else if (pendentes > 0) {
                        statusClass = 'badge-warning';
                        statusText = `${pendentes} Pend.`;
                    }
                    
                    const safeProjectName = utils.escapeHtml(projeto.nome);
                    
                    projetosHTML += `
                        <li class="flex justify-between items-center p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer project-item group transition-colors border border-transparent hover:border-gray-100 dark:hover:border-gray-700" 
                            data-contract-id="${contract.id}" 
                            data-project-name="${safeProjectName}">
                            <span class="flex items-center min-w-0 mr-2">
                                <div class="p-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-md mr-2.5 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 transition-colors shrink-0">
                                    <i data-lucide="folder" class="w-3.5 h-3.5"></i>
                                </div>
                                <div class="flex flex-col truncate">
                                    <span class="truncate font-medium text-gray-700 dark:text-gray-300" title="${safeProjectName}">${projeto.nome}</span>
                                    <span class="text-xs text-gray-400">${qtd} colab.</span>
                                </div>
                            </span>
                            <span class="badge ${statusClass}">${statusText}</span>
                        </li>`;
                });
            }
            
            card.innerHTML = `
                <div class="flex-grow">
                    <div class="flex justify-between items-start mb-4">
                        <div class="pr-4">
                            <h2 class="font-bold text-lg text-gray-800 dark:text-white leading-tight">${contract.empresa}</h2>
                            <div class="flex items-center mt-1 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700/50 w-fit px-2 py-1 rounded-md">
                                <i data-lucide="users" class="w-3.5 h-3.5 mr-1.5"></i> ${totalColab} Colaboradores
                            </div>
                        </div>
                        <div class="flex items-center gap-1 flex-shrink-0">
                            <button title="Excluir" class="delete-btn p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" data-id="${contract.id}">
                                <i data-lucide="trash-2" class="w-4 h-4"></i>
                            </button>
                        </div>
                    </div>
                    <div>
                        <h3 class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Projetos (${contract.projetos.length})</h3>
                        <ul class="space-y-2 text-sm max-h-56 overflow-y-auto pr-1 custom-scrollbar">
                            ${projetosHTML}
                        </ul>
                    </div>
                </div>`;
            
            fragment.appendChild(card);
        });
        
        dom.contractsGrid.appendChild(fragment);
        lucide.createIcons({ nodes: dom.contractsGrid.querySelectorAll('[data-lucide]') });

        // Event listeners
        dom.contractsGrid.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                handleDeleteClick(btn.dataset.id);
            });
        });
        
        dom.contractsGrid.querySelectorAll('.project-item').forEach(item => {
            item.addEventListener('click', () => {
                handleProjectClick(item.dataset.contractId, item.dataset.projectName);
            });
        });
    }

    function handleProjectClick(contractId, projectName) {
        const contract = state.currentFilteredData.find(c => String(c.id) === String(contractId));
        if (!contract) return;

        const projeto = contract.projetos.find(p => p.nome === projectName);
        if (!projeto) return;

        dom.projectModalTitle.textContent = projeto.nome;
        dom.projectModalSubtitle.textContent = `${contract.empresa} - ${projeto.colaboradores.length} Colaboradores`;
        
        dom.projectSearchInput.value = '';
        dom.projectEmployeesList.innerHTML = '';

        if (projeto.colaboradores.length === 0) {
            dom.projectEmployeesList.innerHTML = `
                <tr>
                    <td colspan="5" class="px-6 py-4 text-center text-gray-400">
                        Nenhum colaborador encontrado com os filtros atuais.
                    </td>
                </tr>`;
        } else {
            projeto.colaboradores.forEach(colaborador => {
                const isInactive = colaborador.situacao === 'D';
                
                let statusBadge = '';
                if (isInactive) {
                    statusBadge = '<span class="badge badge-danger">Desligado</span>';
                } else {
                    statusBadge = '<span class="badge badge-success">Ativo</span>';
                }

                let treinoBadge = '';
                if (colaborador.status === 'Realizado') {
                    treinoBadge = '<span class="flex items-center text-green-600 dark:text-green-400"><i data-lucide="check-circle" class="w-4 h-4 mr-1"></i> Realizado</span>';
                } else if (colaborador.status === 'Atrasado') {
                    treinoBadge = '<span class="flex items-center text-red-600 dark:text-red-400 font-medium"><i data-lucide="clock" class="w-4 h-4 mr-1"></i> Atrasado</span>';
                } else if (isInactive) {
                    treinoBadge = '<span class="text-gray-400">-</span>';
                } else {
                    treinoBadge = '<span class="flex items-center text-yellow-600 dark:text-yellow-400"><i data-lucide="alert-triangle" class="w-4 h-4 mr-1"></i> Não Realizado</span>';
                }

                const row = `
                <tr class="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td class="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                        <button onclick="Dashboard.openColabDetails('${contract.id}', '${utils.escapeHtml(projeto.nome).replace(/'/g, "\\'")}', '${utils.escapeHtml(colaborador.nome).replace(/'/g, "\\'")}')" 
                                class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline text-left">
                            ${colaborador.nome}
                        </button>
                    </td>
                    <td class="px-6 py-4">${colaborador.funcao || '-'}</td>
                    <td class="px-6 py-4 text-xs text-gray-500">${colaborador.ano || '-'}</td>
                    <td class="px-6 py-4">${statusBadge}</td>
                    <td class="px-6 py-4">${treinoBadge}</td>
                </tr>`;
                
                dom.projectEmployeesList.innerHTML += row;
            });
        }
        
        lucide.createIcons({ nodes: dom.projectEmployeesList.querySelectorAll('[data-lucide]') });
        dom.projectDetailsModal.classList.remove('hidden');
    }

    function openColabDetails(contractId, projectName, colabName) {
        const contract = state.activeContractsData.find(c => String(c.id) === String(contractId));
        if (!contract) return;
        
        const projeto = contract.projetos.find(p => p.nome === projectName);
        if (!projeto) return;
        
        const colab = projeto.colaboradores.find(c => c.nome === colabName);
        if (!colab) return;

        dom.colabModalName.textContent = colab.nome;
        
        let statusHtml = '';
        if (colab.situacao === 'D') {
            statusHtml = '<span class="badge badge-danger">Desligado</span>';
        } else if (colab.status === 'Realizado') {
            statusHtml = '<span class="badge badge-success"><i data-lucide="check-circle" class="w-3 h-3 mr-1"></i> Realizado</span>';
        } else if (colab.status === 'Atrasado') {
            statusHtml = '<span class="badge badge-danger"><i data-lucide="clock" class="w-3 h-3 mr-1"></i> Atrasado</span>';
        } else {
            statusHtml = '<span class="badge badge-warning"><i data-lucide="alert-triangle" class="w-3 h-3 mr-1"></i> Não Realizado</span>';
        }

        dom.colabModalInfo.innerHTML = `${contract.empresa} • ${projeto.nome} ${statusHtml}`;
        lucide.createIcons({ nodes: dom.colabModalInfo.querySelectorAll('[data-lucide]') });
        
        const detalhes = colab.detalhes || {};
        
        dom.colabDisparado.textContent = detalhes.disparado || '-';
        dom.colabRealizado.textContent = detalhes.realizado || '-';
        
        dom.colabReciclagensList.innerHTML = '';
        if (detalhes.reciclagens && detalhes.reciclagens.length > 0) {
            detalhes.reciclagens.forEach(rec => {
                const div = document.createElement('div');
                div.className = "flex justify-between items-center p-3 bg-white dark:bg-gray-800 rounded border border-gray-100 dark:border-gray-700";
                
                let valClass = "text-gray-800 dark:text-white";
                const valUpper = rec.valor.toUpperCase();
                if (valUpper.includes('REALIZADO') || valUpper.includes('OK') || valUpper.includes('VALIDO')) {
                    valClass = "text-green-600 dark:text-green-400 font-medium";
                } else if (valUpper.includes('PENDENTE') || valUpper.includes('VENCIDO')) {
                    valClass = "text-yellow-600 dark:text-yellow-400 font-medium";
                }
                
                div.innerHTML = `
                    <span class="text-sm text-gray-500 dark:text-gray-400">${rec.coluna}</span>
                    <span class="text-sm ${valClass}">${rec.valor}</span>
                `;
                dom.colabReciclagensList.appendChild(div);
            });
        } else {
            dom.colabReciclagensList.innerHTML = `
                <p class="text-sm text-gray-400 italic p-2 text-center">
                    Nenhuma informação de reciclagem encontrada.
                </p>`;
        }

        dom.colabDetailsModal.classList.remove('hidden');
    }

    function openTrainingModal(type) {
        state.activeDrillDown = null;
        
        const titleMap = {
            'ativos': 'Colaboradores Ativos',
            'pendente': 'Pendência de Treinamento',
            'realizado': 'Treinamentos Realizados'
        };
        
        dom.trainingModalTitle.textContent = titleMap[type] || 'Detalhamento';
        
        if (type === 'pendente') {
            setTrainingFilter('pendente');
        } else if (type === 'realizado') {
            setTrainingFilter('realizado');
        } else {
            setTrainingFilter('all');
        }
        
        dom.trainingDetailsModal.classList.remove('hidden');
    }

    function handleChartDrillDown(type, value) {
        state.activeDrillDown = { type: type, value: value };
        
        let title = `Detalhamento: ${value}`;
        if (type === 'year') title = `Colaboradores em ${value}`;
        if (type === 'project') title = `Colaboradores do Projeto: ${value}`;
        if (type === 'function') title = `Colaboradores: ${value}`;
        if (type === 'situation') title = `Colaboradores ${value === 'A' ? 'Ativos' : 'Inativos'}`;
        
        dom.trainingModalTitle.textContent = title;
        
        if (type === 'status') {
            if (value === 'Realizado') setTrainingFilter('realizado');
            else if (value === 'Atrasado') setTrainingFilter('atrasado');
            else setTrainingFilter('pendente');
        } else {
            setTrainingFilter('all');
        }
        
        dom.trainingDetailsModal.classList.remove('hidden');
    }

    function setTrainingFilter(filter) {
        state.currentTrainingFilter = filter;
        
        const buttons = {
            'all': document.getElementById('btn-filter-all'),
            'realizado': document.getElementById('btn-filter-realizado'),
            'atrasado': document.getElementById('btn-filter-atrasado'),
            'pendente': document.getElementById('btn-filter-pendente')
        };

        Object.values(buttons).forEach(btn => {
            if (btn) {
                btn.className = "px-4 py-2 text-sm rounded-lg font-medium transition-all shadow-sm bg-gray-100 dark:bg-gray-700 dark:text-gray-300";
            }
        });
        
        if (buttons[filter]) {
            buttons[filter].className = "px-4 py-2 text-sm rounded-lg font-medium transition-all shadow-sm bg-blue-600 text-white";
        }

        renderTrainingList();
    }

    function renderTrainingList() {
        dom.trainingEmployeesList.innerHTML = '';
        let rows = [];

        const dataToRender = state.currentFilteredData.length > 0 ? 
            state.currentFilteredData : 
            (isFiltersEmpty() ? state.activeContractsData : []);

        dataToRender.forEach(contract => {
            contract.projetos.forEach(projeto => {
                if (state.activeDrillDown && state.activeDrillDown.type === 'project' && projeto.nome !== state.activeDrillDown.value) {
                    return;
                }

                projeto.colaboradores.forEach(colaborador => {
                    if (state.activeDrillDown) {
                        if (state.activeDrillDown.type === 'year' && colaborador.ano !== state.activeDrillDown.value) return;
                        if (state.activeDrillDown.type === 'function' && (colaborador.funcao || 'Não Informado') !== state.activeDrillDown.value) return;
                        if (state.activeDrillDown.type === 'situation') {
                            if (state.activeDrillDown.value === 'A' && colaborador.situacao === 'D') return;
                            if (state.activeDrillDown.value === 'D' && colaborador.situacao !== 'D') return;
                        }
                    }

                    const showingInactives = state.activeDrillDown && state.activeDrillDown.type === 'situation' && state.activeDrillDown.value === 'D';
                    if (!showingInactives && colaborador.situacao === 'D') return;
                    
                    const isPendente = colaborador.status === 'Não Realizado';
                    const isAtrasado = colaborador.status === 'Atrasado';
                    const isRealizado = colaborador.status === 'Realizado';
                    
                    if (state.currentTrainingFilter === 'realizado' && !isRealizado) return;
                    if (state.currentTrainingFilter === 'pendente' && !isPendente) return;
                    if (state.currentTrainingFilter === 'atrasado' && !isAtrasado) return;

                    let statusHtml = '';
                    if (isRealizado) {
                        statusHtml = '<span class="flex items-center text-green-600 dark:text-green-400 font-medium"><i data-lucide="check-circle-2" class="w-4 h-4 mr-1.5"></i> Realizado</span>';
                    } else if (isAtrasado) {
                        statusHtml = '<span class="flex items-center text-red-600 dark:text-red-400 font-medium"><i data-lucide="clock" class="w-4 h-4 mr-1.5"></i> Atrasado</span>';
                    } else {
                        statusHtml = '<span class="flex items-center text-yellow-600 dark:text-yellow-400 font-medium"><i data-lucide="alert-triangle" class="w-4 h-4 mr-1.5"></i> Não Realizado</span>';
                    }

                    rows.push(`
                    <tr class="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td class="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                            <button onclick="Dashboard.openColabDetails('${contract.id}', '${utils.escapeHtml(projeto.nome).replace(/'/g, "\\'")}', '${utils.escapeHtml(colaborador.nome).replace(/'/g, "\\'")}')" 
                                    class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline text-left">
                                ${colaborador.nome}
                            </button>
                        </td>
                        <td class="px-6 py-4 text-xs uppercase tracking-wide">${contract.empresa}</td>
                        <td class="px-6 py-4 text-xs">${projeto.nome}</td>
                        <td class="px-6 py-4 text-xs">${colaborador.ano || '-'}</td>
                        <td class="px-6 py-4 text-xs">${colaborador.funcao || '-'}</td>
                        <td class="px-6 py-4">${statusHtml}</td>
                    </tr>`);
                });
            });
        });

        if (rows.length === 0) {
            dom.trainingEmployeesList.innerHTML = `
                <tr>
                    <td colspan="6" class="px-6 py-8 text-center text-gray-500">
                        Nenhum registro encontrado para este filtro.
                    </td>
                </tr>`;
        } else {
            dom.trainingEmployeesList.innerHTML = rows.join('');
        }
        
        lucide.createIcons({ nodes: dom.trainingEmployeesList.querySelectorAll('[data-lucide]') });
    }

    function isFiltersEmpty() {
        return dom.searchInput.value === '' && 
               dom.filterContratoStatus.value === '' && 
               dom.filterCoordenador.value === '' &&
               dom.filterAno.value === '';
    }

    function handleDeleteClick(id) {
        state.contractToDeleteId = id;
        dom.deleteModal.classList.remove('hidden');
    }

    function confirmDelete() {
        if (state.contractToDeleteId) {
            const newData = state.activeContractsData.filter(c => String(c.id) !== String(state.contractToDeleteId));
            saveData(newData);
            dom.deleteModal.classList.add('hidden');
            state.contractToDeleteId = null;
        }
    }

    function updateSummaryCards() {
        let totalGeral = 0, ativos = 0, inativos = 0, pendentes = 0, realizados = 0;

        state.currentFilteredData.forEach(contract => {
            contract.projetos.forEach(projeto => {
                if (!projeto.colaboradores) return;
                
                projeto.colaboradores.forEach(colaborador => {
                    totalGeral++;
                    
                    if (colaborador.situacao === 'D') {
                        inativos++;
                    } else {
                        ativos++;
                        if (colaborador.status === 'Realizado') {
                            realizados++;
                        } else {
                            pendentes++;
                        }
                    }
                });
            });
        });

        utils.animateValue(dom.totalGeralAD, parseInt(dom.totalGeralAD.innerText) || 0, totalGeral, 500);
        utils.animateValue(dom.totalAtivos, parseInt(dom.totalAtivos.innerText) || 0, ativos, 500);
        utils.animateValue(dom.totalInativos, parseInt(dom.totalInativos.innerText) || 0, inativos, 500);
        utils.animateValue(dom.totalPendentes, parseInt(dom.totalPendentes.innerText) || 0, pendentes, 500);
        utils.animateValue(dom.totalRealizados, parseInt(dom.totalRealizados.innerText) || 0, realizados, 500);
        
        dom.contractCount.textContent = `Visualizando: ${state.currentFilteredData.length} Empresas`;
    }

    function populateFilters() {
        const empresas = new Set();
        const projetos = new Set();
        const anos = new Set();

        state.activeContractsData.forEach(contract => {
            empresas.add(contract.empresa);
            
            contract.projetos.forEach(projeto => {
                projetos.add(projeto.nome);
                
                projeto.colaboradores.forEach(colaborador => {
                    if (colaborador.ano && colaborador.ano.trim() !== '' && colaborador.ano !== 'N/D') {
                        anos.add(colaborador.ano);
                    }
                });
            });
        });

        const empresasSorted = [...empresas].sort();
        const projetosSorted = [...projetos].sort();
        const anosSorted = [...anos].sort().reverse();

        const currentEmpresa = dom.filterContratoStatus.value;
        const currentProjeto = dom.filterCoordenador.value;
        const currentAno = dom.filterAno.value;

        // Empresas
        dom.filterContratoStatus.innerHTML = '<option value="">Todas Empresas</option>';
        empresasSorted.forEach(empresa => {
            dom.filterContratoStatus.innerHTML += `<option value="${empresa}">${empresa}</option>`;
        });

        // Projetos
        dom.filterCoordenador.innerHTML = '<option value="">Todos Projetos</option>';
        projetosSorted.forEach(projeto => {
            dom.filterCoordenador.innerHTML += `<option value="${projeto}">${projeto}</option>`;
        });

        // Anos
        dom.filterAno.innerHTML = '<option value="">Todos Anos</option>';
        anosSorted.forEach(ano => {
            dom.filterAno.innerHTML += `<option value="${ano}">${ano}</option>`;
        });

        // Restaurar seleções
        if (empresasSorted.includes(currentEmpresa)) dom.filterContratoStatus.value = currentEmpresa;
        if (projetosSorted.includes(currentProjeto)) dom.filterCoordenador.value = currentProjeto;
        if (anosSorted.includes(currentAno)) dom.filterAno.value = currentAno;
    }

    function applyFiltersAndSearch() {
        const term = dom.searchInput.value.toLowerCase();
        const empresaFilter = dom.filterContratoStatus.value;
        const projetoFilter = dom.filterCoordenador.value;
        const anoFilter = dom.filterAno.value;

        state.currentFilteredData = state.activeContractsData.map(contract => {
            let filteredProjetos = contract.projetos;
            
            if (projetoFilter) {
                filteredProjetos = filteredProjetos.filter(projeto => projeto.nome === projetoFilter);
            }

            filteredProjetos = filteredProjetos.map(projeto => {
                let filteredColabs = projeto.colaboradores;

                if (anoFilter) {
                    filteredColabs = filteredColabs.filter(colaborador => colaborador.ano === anoFilter);
                }

                if (term) {
                    const matchEmpresa = contract.empresa.toLowerCase().includes(term);
                    const matchProject = projeto.nome.toLowerCase().includes(term);
                    
                    if (!matchEmpresa && !matchProject) {
                        filteredColabs = filteredColabs.filter(colaborador => 
                            colaborador.nome.toLowerCase().includes(term)
                        );
                    }
                }

                return { ...projeto, colaboradores: filteredColabs };
            }).filter(projeto => projeto.colaboradores.length > 0);

            return { ...contract, projetos: filteredProjetos };
        }).filter(contract => contract.projetos.length > 0);

        state.currentFilteredData = state.currentFilteredData.filter(contract => {
            if (empresaFilter && contract.empresa !== empresaFilter) return false;
            
            if (!term) return true;
            
            const matchesEmpresaName = contract.empresa.toLowerCase().includes(term);
            const hasMatchingProject = contract.projetos.some(projeto => {
                const matchesProjName = projeto.nome.toLowerCase().includes(term);
                return matchesProjName || projeto.colaboradores.length > 0;
            });
            
            return matchesEmpresaName || hasMatchingProject;
        });

        renderContracts(state.currentFilteredData);
        updateCharts();
    }

    function updateCharts() {
        // Coletar dados
        let pendentes = 0, realizados = 0, atrasados = 0;
        let projectVolumes = {};
        let functionCounts = {}; 
        let statusCounts = { 'A': 0, 'D': 0 }; 
        let yearStats = {};

        state.currentFilteredData.forEach(contract => {
            contract.projetos.forEach(projeto => {
                if (!projectVolumes[projeto.nome]) projectVolumes[projeto.nome] = 0;
                projectVolumes[projeto.nome] += projeto.colaboradores.length;

                projeto.colaboradores.forEach(colaborador => {
                    if (colaborador.situacao !== 'D') {
                        if (colaborador.status === 'Realizado') realizados++;
                        else if (colaborador.status === 'Atrasado') atrasados++;
                        else pendentes++;
                    }

                    const func = colaborador.funcao || 'Não Informado';
                    if (!functionCounts[func]) functionCounts[func] = 0;
                    functionCounts[func]++;

                    if (colaborador.situacao === 'D') statusCounts['D']++;
                    else statusCounts['A']++;
                    
                    if (colaborador.situacao !== 'D') {
                        const y = colaborador.ano && colaborador.ano !== 'N/D' ? colaborador.ano : 'N/D';
                        if (!yearStats[y]) yearStats[y] = { total: 0, done: 0 };
                        yearStats[y].total++;
                        if (colaborador.status === 'Realizado') yearStats[y].done++;
                    }
                });
            });
        });

        const pluginsList = typeof ChartDataLabels !== 'undefined' ? [ChartDataLabels] : [];

        // Destruir gráficos existentes
        if (state.machineStatusChart) state.machineStatusChart.destroy();
        if (state.contractStatusChart) state.contractStatusChart.destroy();
        if (state.functionChart) state.functionChart.destroy();
        if (state.situationChart) state.situationChart.destroy();
        if (state.yearComplianceChart) state.yearComplianceChart.destroy();

        // Gráfico 1: Status Treinamento
        const ctx1 = dom.machineChart.getContext('2d');
        state.machineStatusChart = new Chart(ctx1, {
            type: 'doughnut',
            data: {
                labels: ['Realizado', 'Atrasado', 'Não Realizado'],
                datasets: [{
                    data: [realizados, atrasados, pendentes],
                    backgroundColor: [
                        CONFIG.DEFAULT_CHART_COLORS.realized,
                        CONFIG.DEFAULT_CHART_COLORS.delayed,
                        CONFIG.DEFAULT_CHART_COLORS.pending
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                onClick: (e, elements) => {
                    if (elements[0]) {
                        const i = elements[0].index;
                        const label = state.machineStatusChart.data.labels[i];
                        handleChartDrillDown('status', label);
                    }
                },
                plugins: {
                    legend: { 
                        position: 'bottom', 
                        labels: { color: utils.getChartTextColor() } 
                    },
                    datalabels: {
                        color: '#fff',
                        font: { weight: 'bold' },
                        formatter: (value, ctx) => {
                            if (value === 0) return '';
                            let sum = 0;
                            let dataArr = ctx.chart.data.datasets[0].data;
                            dataArr.map(data => { sum += data; });
                            return (value * 100 / sum).toFixed(1) + "%";
                        }
                    }
                }
            },
            plugins: pluginsList
        });

        // Gráfico 2: Volume por Projeto
        const sortedProjects = Object.entries(projectVolumes)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 8);
        
        const ctx2 = dom.contractChart.getContext('2d');
        state.contractStatusChart = new Chart(ctx2, {
            type: 'bar',
            data: {
                labels: sortedProjects.map(([name]) => name.length > 15 ? name.substring(0,15)+'...' : name),
                fullLabels: sortedProjects.map(([name]) => name),
                datasets: [{
                    label: 'Colaboradores',
                    data: sortedProjects.map(([,count]) => count),
                    backgroundColor: CONFIG.DEFAULT_CHART_COLORS.project,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                onClick: (e, elements) => {
                    if (elements[0]) {
                        const i = elements[0].index;
                        const label = state.contractStatusChart.data.fullLabels[i];
                        handleChartDrillDown('project', label);
                    }
                },
                scales: {
                    x: { 
                        grid: { display: false }, 
                        ticks: { color: utils.getChartTextColor() } 
                    },
                    y: { 
                        grid: { display: false }, 
                        ticks: { color: utils.getChartTextColor() } 
                    }
                },
                plugins: {
                    legend: { display: false },
                    datalabels: {
                        anchor: 'end',
                        align: 'end',
                        color: utils.getChartTextColor(),
                        formatter: Math.round
                    }
                }
            },
            plugins: pluginsList
        });

        // Gráfico 3: Top Funções
        const sortedFunctions = Object.entries(functionCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5);
        
        const ctx3 = dom.functionChart.getContext('2d');
        state.functionChart = new Chart(ctx3, {
            type: 'bar',
            data: {
                labels: sortedFunctions.map(([name]) => name.length > 15 ? name.substring(0,15)+'...' : name),
                fullLabels: sortedFunctions.map(([name]) => name),
                datasets: [{
                    label: 'Qtd',
                    data: sortedFunctions.map(([,count]) => count),
                    backgroundColor: CONFIG.DEFAULT_CHART_COLORS.function,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                onClick: (e, elements) => {
                    if (elements[0]) {
                        const i = elements[0].index;
                        const label = state.functionChart.data.fullLabels[i];
                        handleChartDrillDown('function', label);
                    }
                },
                scales: {
                    x: { 
                        grid: { display: false }, 
                        ticks: { color: utils.getChartTextColor() } 
                    },
                    y: { 
                        grid: { display: false }, 
                        ticks: { color: utils.getChartTextColor() } 
                    }
                },
                plugins: {
                    legend: { display: false },
                    datalabels: {
                        anchor: 'end',
                        align: 'end',
                        color: utils.getChartTextColor(),
                        formatter: Math.round
                    }
                }
            },
            plugins: pluginsList
        });

        // Gráfico 4: Situação
        const ctx4 = dom.situationChart.getContext('2d');
        state.situationChart = new Chart(ctx4, {
            type: 'doughnut',
            data: {
                labels: ['Ativos', 'Inativos'],
                datasets: [{
                    data: [statusCounts['A'], statusCounts['D']],
                    backgroundColor: [
                        CONFIG.DEFAULT_CHART_COLORS.active,
                        CONFIG.DEFAULT_CHART_COLORS.inactive
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '60%',
                onClick: (e, elements) => {
                    if (elements[0]) {
                        const i = elements[0].index;
                        const label = state.situationChart.data.labels[i];
                        const val = label === 'Ativos' ? 'A' : 'D';
                        handleChartDrillDown('situation', val);
                    }
                },
                plugins: {
                    legend: { 
                        position: 'bottom', 
                        labels: { color: utils.getChartTextColor() } 
                    },
                    datalabels: {
                        color: '#fff',
                        font: { weight: 'bold' },
                        formatter: (value, ctx) => {
                            if (value === 0) return '';
                            let sum = 0;
                            let dataArr = ctx.chart.data.datasets[0].data;
                            dataArr.map(data => { sum += data; });
                            return (value * 100 / sum).toFixed(1) + "%";
                        }
                    }
                }
            },
            plugins: pluginsList
        });

        // Gráfico 5: Aderência por Ano
        const sortedYears = Object.keys(yearStats).sort((a,b) => {
            if (a === 'N/D') return 1;
            if (b === 'N/D') return -1;
            return a - b;
        });
        
        const percentageData = sortedYears.map(year => {
            const stat = yearStats[year];
            return stat.total === 0 ? 0 : Math.round((stat.done / stat.total) * 100);
        });

        const ctx5 = dom.yearComplianceChart.getContext('2d');
        state.yearComplianceChart = new Chart(ctx5, {
            type: 'bar',
            data: {
                labels: sortedYears,
                datasets: [{
                    label: '% Realizado',
                    data: percentageData,
                    backgroundColor: percentageData.map(val => 
                        val >= 90 ? CONFIG.DEFAULT_CHART_COLORS.realized : 
                        val >= 70 ? CONFIG.DEFAULT_CHART_COLORS.pending : 
                        CONFIG.DEFAULT_CHART_COLORS.delayed
                    ),
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                onClick: (e, elements) => {
                    if (elements[0]) {
                        const i = elements[0].index;
                        const label = state.yearComplianceChart.data.labels[i];
                        handleChartDrillDown('year', label);
                    }
                },
                scales: {
                    x: { 
                        grid: { display: false }, 
                        ticks: { color: utils.getChartTextColor() } 
                    },
                    y: { 
                        grid: { 
                            color: document.documentElement.classList.contains('dark') ? 
                                '#374151' : '#e5e7eb' 
                        }, 
                        ticks: { 
                            color: utils.getChartTextColor(), 
                            callback: (val) => val + '%' 
                        },
                        min: 0,
                        max: 100
                    }
                },
                plugins: {
                    legend: { display: false },
                    datalabels: {
                        anchor: 'end',
                        align: 'end',
                        color: utils.getChartTextColor(),
                        formatter: (val) => val + '%'
                    }
                }
            },
            plugins: pluginsList
        });
    }

    function processCSV(csvText) {
        try {
            const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== '');
            if (lines.length < 2) {
                alert('Arquivo CSV vazio ou inválido');
                return;
            }

            const separator = lines[0].includes(';') ? ';' : ',';
            const headers = lines[0].split(separator).map(h => utils.cleanText(h).toUpperCase());
            
            // Mapeamento de índices
            const indices = {
                empresa: headers.findIndex(h => h.includes('EMPRESA')),
                projeto: headers.findIndex(h => h.includes('PROJETO')),
                nome: headers.findIndex(h => h.includes('COLABORADOR') || h.includes('NOME')),
                situacao: headers.findIndex(h => h.includes('SITUAÇÃO') || h.includes('SITUACAO')),
                funcao: headers.findIndex(h => h.includes('FUNÇÃO') || h.includes('FUNCAO') || h.includes('CARGO')),
                data: headers.findIndex(h => h.includes('DATA') && !h.includes('NASCIMENTO') && !h.includes('REALIZA') && !h.includes('DISPARA')),
                treino: headers.findIndex(h => (h.includes('STATUS') || h.includes('SITUACAO')) && h.includes('TREINAMENTO')),
                treinoDisparado: headers.findIndex(h => (h.includes('TREINAMENTO') || h.includes('TREINO')) && h.includes('DISPARADO')),
                treinoRealizado: headers.findIndex(h => (h.includes('TREINAMENTO') || h.includes('TREINO')) && h.includes('REALIZA') && h.includes('DATA'))
            };

            if (indices.treino === -1) {
                indices.treino = headers.findIndex(h => h.includes('TREINAMENTO') && !h.includes('DATA') && !h.includes('DISPARADO') && !h.includes('VENCIMENTO'));
            }

            if (indices.treinoRealizado === -1) {
                indices.treinoRealizado = headers.findIndex(h => (h.includes('TREINAMENTO') || h.includes('TREINO')) && (h.includes('REALIZADO') || h.includes('REALIZAÇÃO') || h.includes('DATA')));
            }

            const indicesReciclagem = [];
            headers.forEach((h, index) => {
                if (h.includes('RECICLAGEM') || h.includes('RECICLA')) {
                    indicesReciclagem.push({ index: index, name: h });
                }
            });

            const rows = lines.slice(1).map(line => line.split(separator).map(c => utils.cleanText(c)));

            const today = new Date();
            today.setHours(0,0,0,0);
            const sixMonthsAgo = new Date(today);
            sixMonthsAgo.setMonth(today.getMonth() - 6);

            let newContractsMap = new Map();

            rows.forEach(row => {
                if (row.length < 3) return;
                
                if (row.length > 5) row[5] = ''; // Limpar coluna F
                
                const empresaName = row[indices.empresa] || 'Sem Empresa';
                const projetoName = row[indices.projeto] || 'Geral';
                const colabNome = row[indices.nome];
                
                if (!colabNome) return; // Ignorar linhas sem nome
                
                const colabFuncao = row[indices.funcao] || '';
                const rawSituacao = row[indices.situacao] || 'A';
                const colabSituacao = rawSituacao.trim().toUpperCase().charAt(0);

                let rawData = indices.data > -1 ? row[indices.data] : '';
                let colabAno = 'N/D';
                
                if (rawData) {
                    if (rawData.includes('/')) {
                        const parts = rawData.split('/');
                        if (parts.length === 3) colabAno = parts[2].trim();
                    } else if (rawData.includes('-')) {
                        const parts = rawData.split('-');
                        if (parts.length === 3) colabAno = parts[0].trim();
                    } else if (rawData.length === 4) {
                        colabAno = rawData.trim();
                    }
                    colabAno = colabAno.substring(0, 4);
                }

                let validDates = [];
                if (indices.treinoRealizado > -1) {
                    validDates.push(utils.parseBrDate(row[indices.treinoRealizado]));
                } else if (indices.data > -1) {
                    validDates.push(utils.parseBrDate(row[indices.data]));
                }

                headers.forEach((h, i) => {
                    if (h.includes('DATA') && (h.includes('RECICLA') || h.includes('REALIZA')) && 
                        !h.includes('DISPARA') && !h.includes('VENCIMENTO') && !h.includes('NASCIMENTO') && !h.includes('ADMISSÃO')) {
                        validDates.push(utils.parseBrDate(row[i]));
                    }
                });

                let mostRecentDate = null;
                validDates.forEach(d => {
                    if (d) {
                        if (!mostRecentDate || d > mostRecentDate) {
                            mostRecentDate = d;
                        }
                    }
                });

                let colabStatus = 'Não Realizado';
                if (mostRecentDate) {
                    if (mostRecentDate < sixMonthsAgo) {
                        colabStatus = 'Atrasado'; 
                    } else {
                        colabStatus = 'Realizado';
                    }
                }

                const disparadoVal = indices.treinoDisparado > -1 ? row[indices.treinoDisparado] : '-';
                const realizadoVal = indices.treinoRealizado > -1 ? row[indices.treinoRealizado] : '-';
                const reciclagensVals = indicesReciclagem.map(rec => ({
                    coluna: rec.name,
                    valor: row[rec.index] || '-'
                }));

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

                projeto.colaboradores.push({
                    nome: colabNome,
                    funcao: colabFuncao,
                    situacao: colabSituacao,
                    status: colabStatus,
                    ano: colabAno,
                    detalhes: {
                        disparado: disparadoVal,
                        realizado: realizadoVal,
                        reciclagens: reciclagensVals
                    }
                });
            });

            const importedData = Array.from(newContractsMap.values());
            
            if (importedData.length === 0) {
                alert('Nenhum dado válido encontrado no arquivo CSV.');
                return;
            }
            
            if (confirm(`Foram encontrados ${importedData.length} contratos/empresas com ${importedData.reduce((acc, c) => acc + c.projetos.reduce((acc2, p) => acc2 + p.colaboradores.length, 0), 0)} colaboradores. Deseja substituir os dados atuais?`)) {
                saveData(importedData);
                alert('Dados importados com sucesso!');
            }
            
        } catch (error) {
            console.error('Erro ao processar CSV:', error);
            alert('Erro ao processar o arquivo CSV. Verifique o formato e tente novamente.');
        }
    }

    // Setup de event listeners
    function setupEventListeners() {
        // Filtros e busca
        dom.searchInput.addEventListener('input', applyFiltersAndSearch);
        dom.filterCoordenador.addEventListener('change', applyFiltersAndSearch);
        dom.filterContratoStatus.addEventListener('change', applyFiltersAndSearch);
        dom.filterAno.addEventListener('change', applyFiltersAndSearch);
        
        dom.clearFiltersBtn.addEventListener('click', () => {
            dom.searchInput.value = '';
            dom.filterCoordenador.value = '';
            dom.filterContratoStatus.value = '';
            dom.filterAno.value = '';
            applyFiltersAndSearch();
        });

        // Modais
        dom.closeProjectModalBtn.addEventListener('click', () => dom.projectDetailsModal.classList.add('hidden'));
        dom.closeTrainingModalBtn.addEventListener('click', () => dom.trainingDetailsModal.classList.add('hidden'));
        dom.closeColabModalBtn.addEventListener('click', () => dom.colabDetailsModal.classList.add('hidden'));
        
        dom.projectDetailsModal.addEventListener('click', (e) => {
            if (e.target === dom.projectDetailsModal) dom.projectDetailsModal.classList.add('hidden');
        });
        
        dom.trainingDetailsModal.addEventListener('click', (e) => {
            if (e.target === dom.trainingDetailsModal) dom.trainingDetailsModal.classList.add('hidden');
        });
        
        dom.colabDetailsModal.addEventListener('click', (e) => {
            if (e.target === dom.colabDetailsModal) dom.colabDetailsModal.classList.add('hidden');
        });

        // Exclusão
        dom.cancelDeleteBtn.addEventListener('click', () => dom.deleteModal.classList.add('hidden'));
        dom.confirmDeleteBtn.addEventListener('click', confirmDelete);

        // Limpar dados
        dom.clearDataBtn.addEventListener('click', () => {
            if (confirm('Tem certeza que deseja apagar TODOS os dados? Esta ação não pode ser desfeita.')) {
                saveData([]);
            }
        });

        // Importação CSV
        dom.importCsvBtn.addEventListener('click', () => dom.csvInput.click());
        dom.csvInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                processCSV(event.target.result);
                dom.csvInput.value = '';
            };
            reader.onerror = () => {
                alert('Erro ao ler o arquivo. Verifique se o arquivo está acessível.');
                dom.csvInput.value = '';
            };
            reader.readAsText(file, 'ISO-8859-1');
        });

        // Tema
        dom.themeToggle.addEventListener('click', () => {
            document.documentElement.classList.toggle('dark');
            const isDark = document.documentElement.classList.contains('dark');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            updateCharts();
        });

        // Busca no modal de projeto
        dom.projectSearchInput.addEventListener('keyup', (e) => {
            const val = e.target.value.toLowerCase();
            const rows = dom.projectEmployeesList.querySelectorAll('tr');
            rows.forEach(row => {
                const nameCell = row.cells[0];
                if (nameCell) {
                    const name = nameCell.textContent.toLowerCase();
                    if (name.includes(val)) {
                        row.style.display = '';
                    } else {
                        row.style.display = 'none';
                    }
                }
            });
        });
    }

    // Inicialização
    function init() {
        console.log('Dashboard inicializando...');
        
        if (!dom.main) {
            console.error('Elementos DOM não encontrados. Verifique o HTML.');
            return;
        }
        
        setupEventListeners();
        loadData();
        
        console.log('Dashboard inicializado com sucesso!');
    }

    // API pública
    return {
        init,
        openTrainingModal,
        setTrainingFilter,
        openColabDetails,
        
        // Para debug
        getState: () => ({ ...state }),
        getDom: () => ({ ...dom })
    };
})();

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    Dashboard.init();
});
