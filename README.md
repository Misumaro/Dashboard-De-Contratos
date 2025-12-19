# 📊 Dashboard de Contratos – Visão Real

![GitHub repo size](https://img.shields.io/github/repo-size/seu-usuario/dashboard-contratos)
![GitHub last commit](https://img.shields.io/github/last-commit/seu-usuario/dashboard-contratos)
![GitHub issues](https://img.shields.io/github/issues/seu-usuario/dashboard-contratos)
![GitHub stars](https://img.shields.io/github/stars/seu-usuario/dashboard-contratos?style=social)
![GitHub forks](https://img.shields.io/github/forks/seu-usuario/dashboard-contratos?style=social)
![License](https://img.shields.io/badge/license-MIT-green)

Sistema web para **controle e visualização de contratos, projetos, colaboradores e status de treinamentos**, desenvolvido com **HTML, CSS e JavaScript**, focado em **gestão operacional, clareza visual e análise em tempo real**.

---

## 🚀 Demonstração

🔗 **GitHub Pages:**
[https://seu-usuario.github.io/dashboard-contratos/](https://seu-usuario.github.io/dashboard-contratos/)

*(Ative o GitHub Pages nas configurações do repositório)*

---

## 🧠 Visão Geral do Sistema

O **Dashboard de Contratos – Visão Real** permite importar dados via **CSV**, armazená-los localmente no navegador e exibi-los de forma **interativa e visual**, facilitando o acompanhamento de:

* Empresas
* Projetos
* Colaboradores
* Situação (Ativo / Desligado)
* Status de treinamentos (Realizado / Pendente)

Tudo isso em um **painel único**, responsivo e com **modo claro/escuro**.

---

## ✨ Funcionalidades

* 📥 **Importação de dados via CSV** (detecção automática de separador)
* 💾 **Persistência local** com `localStorage`
* 🔎 **Busca global** por empresa, projeto ou colaborador
* 🎯 **Filtros dinâmicos** por projeto e empresa
* 📊 **Indicadores de resumo**:

  * Total de colaboradores
  * Ativos e desligados
  * Treinamentos pendentes e realizados
* 📈 **Gráficos interativos**:

  * Gráfico de pizza (status de treinamento – apenas ativos)
  * Gráfico de barras (volume de colaboradores por projeto)
* 🧩 **Detalhamento por projeto** em modal
* 📋 **Listagem detalhada de treinamentos** com filtros
* 🌗 **Modo claro e escuro** com preferência salva
* 🧹 **Limpeza total dos dados** com confirmação
* 📱 **Layout totalmente responsivo**

---

## 🛠️ Tecnologias Utilizadas

| Tecnologia                | Descrição                      |
| ------------------------- | ------------------------------ |
| HTML5                     | Estrutura do dashboard         |
| CSS3                      | Estilos customizados e layout  |
| JavaScript (Vanilla)      | Lógica de negócio e interações |
| Tailwind CSS (CDN)        | Utilitários de estilização     |
| Chart.js                  | Gráficos interativos           |
| chartjs-plugin-datalabels | Exibição de percentuais        |
| Lucide Icons              | Ícones SVG                     |
| LocalStorage              | Persistência de dados          |

---

## 📁 Estrutura do Projeto

```bash
DASHBOARD-CONTRATOS/
│
├── index.html          # Estrutura principal do sistema
│
├── css/
│   └── main.css        # Estilos e customizações
│
├── js/
│   └── app.js          # Lógica do dashboard e processamento do CSV
│
└── README.md
```

---

## 📄 Formato Esperado do CSV

O sistema aceita arquivos `.csv` ou `.txt` contendo, no mínimo, colunas semelhantes a:

* Empresa
* Projeto
* Colaborador / Nome
* Situação (A ou D)
* Função
* Status de Treinamento

> O sistema identifica automaticamente o separador (`;` ou `,`) e ignora linhas inválidas.

---

## 🔐 Armazenamento de Dados

* Os dados são salvos **exclusivamente no navegador do usuário**
* Nenhuma informação é enviada para servidores externos
* Ideal para uso interno, protótipos e dashboards locais

---

## 📌 Possíveis Evoluções

* Integração com backend (API / Banco de Dados)
* Exportação de relatórios
* Autenticação de usuários
* Controle de permissões
* Versionamento de importações

---

## 📜 Licença

Este projeto está sob a licença **MIT**.
Sinta-se livre para usar, modificar e distribuir.

---

👨‍💻 Desenvolvido por **Marlon Ferreira**
Front-end Developer
