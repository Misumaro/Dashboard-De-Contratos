document.addEventListener('DOMContentLoaded', () => {
    const dom = { 
        main: document.getElementById('main-content'),
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
        currentDateDisplay: document.getElementById('currentDateDisplay'),
        filterCoordenador: document.getElementById('filterCoordenador'), 
        filterContratoStatus: document.getElementById('filterContratoStatus'),
        importCsvBtn: document.getElementById('import-csv-btn'),
        csvInput: document.getElementById('csvInput'),
    };

    let machineStatusChart, contractStatusChart;
    let currentFilteredData = [], activeContractsData = [];
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
    }

    function renderUI() {
        populateFilters(); 
        updateSummaryCards(); 
        applyFiltersAndSearch();
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
                </div>
                <div>
                    <h3 class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Projetos (${c.projetos.length})</h3>
                    <ul class="space-y-2 text-sm max-h-56 overflow-y-auto pr-1 custom-scrollbar">`;

            if (c.projetos.length === 0) {
                html += `<li class="text-xs text-gray-400 italic p-2 text-center bg-gray-50 dark:bg-gray-800/50 rounded-lg">Sem projetos cadastrados.</li>`;
            }

            c.projetos.forEach((proj, idx) => {
                const qtd = (proj.colaboradores || []).length;
                const pendentes = (proj.colaboradores || []).filter(col => col.status === 'Não Realizado').length;
                
                const statusColor = pendentes > 0 ? 'text-yellow-700 bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800' : 'text-green-700 bg-green-50 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800';
                const statusText = pendentes > 0 ? `${pendentes} Pend.` : '100% OK';
                
                const desligados = (proj.colaboradores || []).filter(col => col.situacao === 'D').length;
                let badge = `<span class="text-[10px] font-semibold px-2 py-0.5 rounded border ${statusColor}">${statusText}</span>`;
                
                if(desligados === qtd && qtd > 0) {
                    badge = `<span class="text-[10px] font-semibold px-2 py-0.5 rounded border text-red-700 bg-red-50 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">Inativo</span>`;
                }

                html += `<li class="flex justify-between items-center p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer project-item group transition-colors border border-transparent hover:border-gray-100 dark:hover:border-gray-700" data-contract-id="${c.id}" data-project-idx="${idx}">
                                                <span class="flex items-center w-2/3 truncate">
                                                    <div class="p-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-md mr-2.5 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 transition-colors"><i data-lucide="folder" class="w-3.5 h-3.5"></i></div>
                                                    <span class="truncate-text font-medium text-gray-700 dark:text-gray-300" title="${proj.nome}">${proj.nome}</span>
                                                    <span class="ml-2 text-xs text-gray-400">(${qtd})</span>
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
        
        dom.contractsGrid.querySelectorAll('.project-item').forEach(item => {
            item.addEventListener('click', () => handleProjectClick(item.dataset.contractId, item.dataset.projectIdx));
        });
        
        // Exibe os botões de controle diretamente
        dom.clearDataBtn.style.display = 'inline-flex';
    }

    function handleProjectClick(contractId, projectIdx) {
        const contract = activeContractsData.find(c => String(c.id) === String(contractId));
        if (!contract || !contract.projetos[projectIdx]) return;

        const projeto = contract.projetos[projectIdx];
        
        dom.projectModalTitle.textContent = projeto.nome;
        dom.projectModalSubtitle.textContent = `${contract.empresa} - ${projeto.colaboradores.length} Colaboradores`;
        dom.projectEmployeesList.innerHTML = '';

        projeto.colaboradores.forEach(col => {
            const tr = document.createElement('tr');
            tr.className = "bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors";
            
            let statusClass = "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300";
            if (col.status === 'Realizado') statusClass = "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
            else if (col.status === 'Não Realizado') statusClass = "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
            
            if (col.situacao === 'D') statusClass = "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";

            tr.innerHTML = `
                <td class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">${col.id}</td>
                <td class="px-6 py-4 truncate max-w-xs text-gray-500 dark:text-gray-400" title="${col.comentario}">${col.comentario || '-'}</td>
                <td class="px-6 py-4"><span class="px-2.5 py-0.5 rounded text-xs font-medium ${col.situacao === 'D' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'}">${col.situacao === 'D' ? 'Desligado' : 'Ativo'}</span></td>
                <td class="px-6 py-4"><span class="${statusClass} text-xs font-semibold px-2.5 py-0.5 rounded border border-transparent">${col.situacao === 'D' ? '-' : col.status}</span></td>
            `;
            dom.projectEmployeesList.appendChild(tr);
        });

        dom.projectDetailsModal.classList.remove('hidden');
    }

    function openTrainingModal(initialFilter) {
        currentTrainingFilter = initialFilter || 'all';
        renderTrainingList();
        dom.trainingDetailsModal.classList.remove('hidden');
    }

    function renderTrainingList() {
        dom.trainingEmployeesList.innerHTML = '';
        
        const btns = {
            'all': document.getElementById('btn-filter-all'),
            'Realizado': document.getElementById('btn-filter-realizado'),
            'Pendente': document.getElementById('btn-filter-pendente')
        };
        
        Object.values(btns).forEach(b => b.className = "px-4 py-2 text-sm rounded-lg font-medium transition-all shadow-sm bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600");
        
        if(currentTrainingFilter === 'all') btns['all'].className = "px-4 py-2 text-sm rounded-lg font-bold transition-all shadow-sm bg-blue-600 text-white border border-blue-600";
        else if(currentTrainingFilter === 'Realizado') btns['Realizado'].className = "px-4 py-2 text-sm rounded-lg font-bold transition-all shadow-sm bg-teal-600 text-white border border-teal-600";
        else if(currentTrainingFilter === 'Pendente') btns['Pendente'].className = "px-4 py-2 text-sm rounded-lg font-bold transition-all shadow-sm bg-yellow-500 text-white border border-yellow-500";

        let allActive = [];
        currentFilteredData.forEach(c => {
            c.projetos.forEach(p => {
                p.colaboradores.forEach(col => {
                    if(col.situacao === 'A') {
                        allActive.push({ ...col, empresa: c.empresa, projeto: p.nome });
                    }
                });
            });
        });

        const displayList = allActive.filter(col => {
            if(currentTrainingFilter === 'all') return true;
            let st = (col.status || "").toLowerCase();
            const isRealizado = st.includes('realizado') && !st.includes('não');
            if(currentTrainingFilter === 'Realizado') return isRealizado;
            if(currentTrainingFilter === 'Pendente') return !isRealizado;
            return true;
        });

        displayList.forEach(col => {
            const tr = document.createElement('tr');
            tr.className = "bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors";
            
            let statusLabel = "Pendente";
            let statusClass = "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
            let st = (col.status || "").toLowerCase();
            if (st.includes('realizado') && !st.includes('não')) {
                statusLabel = "Realizado";
                statusClass = "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400";
            }

            tr.innerHTML = `
                <td class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">${col.id}</td>
                <td class="px-6 py-4 text-gray-500 dark:text-gray-400">${col.empresa}</td>
                <td class="px-6 py-4 text-gray-500 dark:text-gray-400">${col.projeto}</td>
                <td class="px-6 py-4 truncate max-w-xs text-gray-500 dark:text-gray-400" title="${col.comentario}">${col.comentario || '-'}</td>
                <td class="px-6 py-4"><span class="${statusClass} text-xs font-semibold px-2.5 py-0.5 rounded border border-transparent">${statusLabel}</span></td>
            `;
            dom.trainingEmployeesList.appendChild(tr);
        });
    }

    document.getElementById('btn-filter-all').addEventListener('click', () => { currentTrainingFilter = 'all'; renderTrainingList(); });
    document.getElementById('btn-filter-realizado').addEventListener('click', () => { currentTrainingFilter = 'Realizado'; renderTrainingList(); });
    document.getElementById('btn-filter-pendente').addEventListener('click', () => { currentTrainingFilter = 'Pendente'; renderTrainingList(); });
    dom.closeTrainingModalBtn.addEventListener('click', () => dom.trainingDetailsModal.classList.add('hidden'));


    function renderCharts(contracts) {
        const textColor = getChartTextColor();
        
        // Contagens para o Gráfico de Pizza (APENAS ATIVOS)
        let counts = { 
            'Realizado': 0, 
            'Pendente': 0
        };
        
        contracts.forEach(c => {
            c.projetos.forEach(p => {
                p.colaboradores.forEach(col => {
                    // Considera apenas quem NÃO é 'D' (ou seja, ativos)
                    if(col.situacao !== 'D') {
                        let st = (col.status || "").toLowerCase();
                        if(st.includes('realizado') && !st.includes('não')) {
                            counts['Realizado']++;
                        } else {
                            counts['Pendente']++;
                        }
                    }
                });
            });
        });

        if (machineStatusChart) machineStatusChart.destroy();
        machineStatusChart = new Chart(dom.machineChart, { 
            type: 'doughnut', 
            plugins: [ChartDataLabels], 
            data: { 
                labels: Object.keys(counts), 
                datasets: [{ 
                    data: Object.values(counts), 
                    backgroundColor: ['#0d9488', '#F59E0B'], // Teal, Amarelo
                    borderColor: document.documentElement.classList.contains('dark') ? '#1a202c' : '#ffffff', 
                    borderWidth: 2 
                }] 
            }, 
            options: { 
                responsive: true, 
                maintainAspectRatio: false,
                plugins: { 
                    legend: { position: 'bottom', labels: { color: textColor, boxWidth: 10, font: {size: 10} } }, 
                    // Porcentagem
                    datalabels: { 
                        color: '#FFF', 
                        font: { weight: 'bold', size: 12 }, 
                        formatter: (value, ctx) => {
                            let sum = 0;
                            let dataArr = ctx.chart.data.datasets[0].data;
                            dataArr.map(data => {
                                sum += data;
                            });
                            if (sum === 0) return "";
                            let percentage = (value*100 / sum).toFixed(0)+"%";
                            return percentage;
                        }
                    } 
                },
                cutout: '55%',
                onClick: (e, elements, chart) => {
                    if (elements && elements.length > 0) {
                        const index = elements[0].index;
                        const label = chart.data.labels[index]; // 'Realizado' or 'Pendente'
                        openTrainingModal(label);
                    }
                }
            } 
        });
        
        let allProjects = [];
        contracts.forEach(c => {
            c.projetos.forEach(p => {
                allProjects.push({ name: p.nome, count: p.colaboradores.length, empresa: c.empresa });
            });
        });
        
        allProjects.sort((a,b) => b.count - a.count);
        const topProjects = allProjects.slice(0, 10);

        if (contractStatusChart) contractStatusChart.destroy();
        contractStatusChart = new Chart(dom.contractChart, { type: 'bar', 
            data: { 
                labels: topProjects.map(p => p.name), 
                datasets: [{ 
                    label: 'Colaboradores', 
                    data: topProjects.map(p => p.count), 
                    backgroundColor: '#3B82F6', 
                    borderRadius: 4,
                    barThickness: 20
                }] 
            }, 
            options: { 
                indexAxis: 'y', 
                responsive: true, 
                maintainAspectRatio: false,
                plugins: { legend: { display: false }, datalabels: { color: textColor, anchor: 'end', align: 'end', font: {weight: 'bold'} } }, 
                scales: { 
                    x: { beginAtZero: true, ticks: { color: textColor }, grid: { color: textColor + '22' } }, 
                    y: { ticks: { color: textColor, font: {size: 11} }, grid: { display: false } } 
                }
            } 
        });
    }

    function updateSummaryCards() {
        let countA = 0;
        let countD = 0;
        let countPendentes = 0;
        let countRealizados = 0;

        activeContractsData.forEach(c => {
            c.projetos.forEach(p => {
                p.colaboradores.forEach(col => {
                    if (col.situacao === 'A') {
                        countA++;
                        let st = (col.status || "").toLowerCase();
                        if (st.includes('realizado') && !st.includes('não')) {
                            countRealizados++;
                        } else {
                                countPendentes++;
                        }
                    } else if (col.situacao === 'D') {
                        countD++;
                    }
                });
            });
        });
        
        const totalGeral = countA + countD;

        dom.totalGeralAD.textContent = totalGeral;
        dom.totalAtivos.textContent = countA;
        dom.totalInativos.textContent = countD;
        dom.totalPendentes.textContent = countPendentes;
        dom.totalRealizados.textContent = countRealizados;
    }

    function populateFilters() {
        const getUniqueProjects = () => {
            let projs = new Set();
            activeContractsData.forEach(c => c.projetos.forEach(p => projs.add(p.nome)));
            return [...projs].sort();
        };
        const getUniqueCompanies = () => [...new Set(activeContractsData.map(c => c.empresa))].sort();

        const populateSelect = (element, options, label) => {
            const currentValue = element.value;
            element.innerHTML = `<option value="">${label}</option>`;
            options.forEach(o => {
                element.add(new Option(o.toUpperCase(), o));
            });
            element.value = currentValue;
        }
        
        populateSelect(dom.filterCoordenador, getUniqueProjects(), "Filtrar Projeto");
        populateSelect(dom.filterContratoStatus, getUniqueCompanies(), "Filtrar Empresa");
    }
    
    function applyFiltersAndSearch() {
        const searchTerm = dom.searchInput.value.toLowerCase();
        const filters = { 
            projeto: dom.filterCoordenador.value, 
            empresa: dom.filterContratoStatus.value
        };
        
        let filtered = activeContractsData.map(ct => {
            if (filters.empresa && ct.empresa !== filters.empresa) return null;

            const matchingProjects = ct.projetos.filter(p => {
                    const matchName = !searchTerm || 
                                                                        p.nome.toLowerCase().includes(searchTerm) || 
                                                                        ct.empresa.toLowerCase().includes(searchTerm) ||
                                                                        (p.colaboradores || []).some(col => col.id.toLowerCase().includes(searchTerm));
                                                                        
                    const matchProjFilter = !filters.projeto || p.nome === filters.projeto;
                    return matchName && matchProjFilter;
            });

            if (matchingProjects.length > 0 || (!searchTerm && !filters.projeto)) {
                    return { ...ct, projetos: matchingProjects };
            }
            return null;
        }).filter(Boolean);

        const desiredOrder = ["GUSTO", "SOLIDEZ", "PVAX", "MD", "MD/GUSTO", "INDEFINIDO", "PJ"];
        filtered.sort((a, b) => {
            const idxA = desiredOrder.indexOf(a.empresa);
            const idxB = desiredOrder.indexOf(b.empresa);
            if (idxA !== -1 && idxB !== -1) return idxA - idxB;
            if (idxA !== -1) return -1;
            if (idxB !== -1) return 1;
            return 0;
        });
        
        currentFilteredData = filtered;
        renderContracts(currentFilteredData);
        renderCharts(currentFilteredData);
        dom.contractCount.textContent = `${currentFilteredData.length} empresas listadas.`;
        
        updateSummaryCardsFiltered(currentFilteredData);
    }
    
    function updateSummaryCardsFiltered(filteredData) {
        let countA = 0;
        let countD = 0;
        let countPendentes = 0;
        let countRealizados = 0;

        filteredData.forEach(c => {
            c.projetos.forEach(p => {
                p.colaboradores.forEach(col => {
                    if (col.situacao === 'A') {
                        countA++;
                        let st = (col.status || "").toLowerCase();
                        if (st.includes('realizado') && !st.includes('não')) {
                            countRealizados++;
                        } else {
                                countPendentes++;
                        }
                    } else if (col.situacao === 'D') {
                        countD++;
                    }
                });
            });
        });
        
        const totalGeral = countA + countD;

        dom.totalGeralAD.textContent = totalGeral;
        dom.totalAtivos.textContent = countA;
        dom.totalInativos.textContent = countD;
        dom.totalPendentes.textContent = countPendentes;
        dom.totalRealizados.textContent = countRealizados;
    }

    function setupModals() {
        dom.closeProjectModalBtn.addEventListener('click', () => dom.projectDetailsModal.classList.add('hidden'));

        dom.clearDataBtn.addEventListener('click', () => {
            if(confirm("ATENÇÃO: Você tem certeza que deseja APAGAR TODOS os dados?\n\nIsso removerá todas as empresas e colaboradores listados para que você possa importar uma nova planilha do zero.\n\nEsta ação não pode ser desfeita.")) {
                activeContractsData = [];
                saveData(activeContractsData);
                renderUI();
                alert("Todos os dados foram removidos com sucesso.");
            }
        });

        dom.importCsvBtn.addEventListener('click', () => dom.csvInput.click());
        dom.csvInput.addEventListener('change', handleCSVUpload);
    }

    function handleCSVUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(e) {
            processCSV(e.target.result);
        };
        reader.readAsText(file, 'ISO-8859-1'); 
        event.target.value = '';
    }

    function processCSV(text) {
        const lines = text.split('\n');
        if (lines.length < 2) {
            alert("Arquivo vazio ou inválido.");
            return;
        }

        let headerLine = "";
        let startIndex = 0;
        
        for(let i=0; i < Math.min(lines.length, 20); i++) {
            const l = lines[i].toLowerCase();
            if(l.includes("empresa") && (l.includes("colaborador") || l.includes("nome"))) {
                headerLine = lines[i];
                startIndex = i + 1;
                break;
            }
        }
        
        if (!headerLine) {
            headerLine = lines[0]; 
            startIndex = 1;
        }

        const countComma = (headerLine.match(/,/g) || []).length;
        const countSemi = (headerLine.match(/;/g) || []).length;
        const separator = countSemi >= countComma ? ';' : ',';
        
        console.log(`Separador detectado: '${separator}' na linha: ${headerLine}`);

        const empresasMap = {}; 
        let count = 0;

        const headers = headerLine.split(separator).map(h => h.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/"/g, ''));
        
        const idxEmpresa = headers.findIndex(h => h === 'empresa');
        const idxProjeto = headers.findIndex(h => h === 'projeto');
        const idxColaborador = headers.findIndex(h => h.includes('colaborador') || h.includes('nome'));
        const idxSituacao = headers.findIndex(h => h.includes('situacao'));
        let idxFuncao = headers.findIndex(h => h.includes('funcao'));
        if(idxFuncao === -1 && headers.length >= 5) idxFuncao = 4;

        const idxStatus = headers.findIndex(h => h.includes('status') && h.includes('treinamento'));

        const useFixedIndices = (idxEmpresa === -1 || idxColaborador === -1);
        
        for (let i = startIndex; i < lines.length; i++) {
            let row = lines[i].split(separator);
            if(row.length < 3) continue;

            const clean = (str) => str ? str.replace(/^"|"$/g, '').trim() : '';
            
            let empresa, projeto, colaborador, situacao, funcao, statusTreinoRaw;

            if (useFixedIndices) {
                let offset = 0;
                if(row[0].trim() === '' && row.length > 5) offset = 1; 
                
                empresa = clean(row[0 + offset]);
                projeto = clean(row[1 + offset]);
                colaborador = clean(row[2 + offset]);
                situacao = clean(row[3 + offset]).toUpperCase();
                funcao = clean(row[4 + offset]);
                statusTreinoRaw = clean(row[6 + offset]); 
            } else {
                empresa = clean(row[idxEmpresa]);
                projeto = idxProjeto > -1 ? clean(row[idxProjeto]) : "Geral";
                colaborador = clean(row[idxColaborador]);
                situacao = idxSituacao > -1 ? clean(row[idxSituacao]).toUpperCase() : "A";
                funcao = idxFuncao > -1 ? clean(row[idxFuncao]) : "";
                statusTreinoRaw = idxStatus > -1 ? clean(row[idxStatus]) : "";
            }

            if (!empresa || !colaborador || empresa.toLowerCase() === 'empresa') continue;

            if (!projeto) projeto = "Geral";
            if (situacao !== 'D' && situacao !== 'A') situacao = 'A'; 

            let statusFinal = 'Não Realizado';
            if (statusTreinoRaw && statusTreinoRaw.toLowerCase().includes('realizado') && !statusTreinoRaw.toLowerCase().includes('não')) {
                statusFinal = 'Realizado';
            }

            if (!empresasMap[empresa]) {
                empresasMap[empresa] = {
                    id: Date.now() + i,
                    empresa: empresa,
                    localizacao: "Vários",
                    coordenador: "GERAL",
                    statusContrato: "ATIVO",
                    dataVencimento: null,
                    projetosMap: {} 
                };
            }

            if (!empresasMap[empresa].projetosMap[projeto]) {
                empresasMap[empresa].projetosMap[projeto] = [];
            }

            empresasMap[empresa].projetosMap[projeto].push({
                id: colaborador,
                status: statusFinal,
                comentario: funcao,
                situacao: situacao 
            });
            count++;
        }

        if (count === 0) {
            alert("Nenhum dado encontrado. Verifique o CSV.");
            return;
        }

        const newData = Object.values(empresasMap).map(e => {
            const projetosArray = Object.keys(e.projetosMap).map(pName => ({
                nome: pName,
                colaboradores: e.projetosMap[pName]
            }));
            delete e.projetosMap;
            return { ...e, projetos: projetosArray };
        });

        activeContractsData = newData;
        saveData(activeContractsData);
        renderUI();
        alert(`Importação concluída: ${count} colaboradores.`);
    }

    function init() {
        Chart.register(ChartDataLabels);
        lucide.createIcons();
        
        const savedTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        document.documentElement.classList.toggle('dark', savedTheme === 'dark');
        
        setupModals();

        document.getElementById('theme-toggle').addEventListener('click', () => {
            const isDark = document.documentElement.classList.toggle('dark');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            renderCharts(currentFilteredData);
        });
        
        const allFilters = [dom.filterCoordenador, dom.filterContratoStatus];
        allFilters.forEach(f => f.addEventListener('change', applyFiltersAndSearch));
        dom.searchInput.addEventListener('input', applyFiltersAndSearch);
        
        document.getElementById('clearFiltersBtn').addEventListener('click', () => {
            dom.searchInput.value = '';
            allFilters.forEach(f => { f.selectedIndex = 0 });
            applyFiltersAndSearch();
        });
        
        loadData();
    }

    init();
});