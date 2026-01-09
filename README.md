# Patrimonium - Sistema de Controle de Ressarcimento

Este sistema foi desenvolvido para a gestão estratégica de ressarcimentos de impostos, focado na jornada do crédito tributário desde o mapeamento inicial até a efetiva entrada de honorários na conta da Patrimonium.

## 🚀 Visão Geral do Sistema

O sistema é dividido em quatro módulos principais:
1.  **Dashboard (Data Storytelling):** Visualização analítica do desempenho financeiro e fluxo de caixa.
2.  **Lançamento Manual:** Interface para registro individual de novos pedidos de ressarcimento.
3.  **Controle de Baixas:** Gestão de recebimentos (via conta corrente) ou compensações tributárias.
4.  **Importação Inteligente:** Sincronização em massa via arquivos CSV para Empresas, Pedidos e Recebidos.

---

## 📊 Documentação do Dashboard (Memória de Cálculo)

O Dashboard utiliza técnicas de *Data Storytelling* para separar o sucesso do cliente do resultado financeiro da Patrimonium. Abaixo, detalhamos as fórmulas utilizadas:

### 1. KPIs Globais (Indicadores Chave)

*   **Total de Créditos Mapeados:** 
    *   *Cálculo:* `Σ (Valor de todos os Processos)`
    *   *Significado:* O volume total de impostos identificados que podem ser recuperados.
*   **Total Recuperado (Cliente):** 
    *   *Cálculo:* `Σ (Valor de todas as Baixas realizadas)`
    *   *Significado:* Dinheiro que efetivamente voltou para o caixa do cliente.
*   **Taxa de Sucesso (%):** 
    *   *Cálculo:* `(Total Recuperado / Total Mapeado) * 100`
    *   *Significado:* Eficiência da operação de recuperação.

### 2. Visão Patrimonium (Honorários de 10%)

O sistema calcula os honorários de forma dinâmica, respeitando o percentual definido no contrato de cada cliente (padrão 10%).

*   **Honorários Totais (Potencial):** 
    *   *Cálculo:* `Σ (Processo.valor * (Processo.percentual_honorarios / 100))`
    *   *Significado:* O valor total que a Patrimonium receberá se 100% dos créditos forem recuperados.
*   **Honorários Já Recebidos (Realizado):** 
    *   *Cálculo:* `Σ (Baixa.valor * (Processo_Pai.percentual_honorarios / 100))`
    *   *Significado:* Dinheiro já faturado pela Patrimonium com base no que o cliente já recebeu.
*   **Honorários a Receber (Pendente):** 
    *   *Cálculo:* `Honorários Totais - Honorários Já Recebidos`
    *   *Significado:* O fluxo de caixa futuro garantido por processos em andamento.

---

## 📂 Guia de Importação de Dados (CSV)

Para que o cruzamento de dados ocorra, o sistema utiliza o **CNPJ** como chave única de ligação.

### 1. Arquivo de Empresas
*   **Objetivo:** Cadastrar o cliente e sua regra de honorários.
*   **Campos essenciais:** `EMPRESA`, `CNPJ`, `% HONORARIOS`.

### 2. Arquivo de Pedidos (Projeção)
*   **Objetivo:** Lançar os saldos que o cliente tem a receber por período.
*   **Campos essenciais:** `CNPJ`, colunas no formato `[N]º TRIM-[ANO]` (Ex: `1º TRIM-2023`).

### 3. Arquivo de Ressarcimentos (Realizado)
*   **Objetivo:** Dar baixa nos pedidos que foram pagos pela RFB.
*   **Campos essenciais:** `CNPJ`, colunas de trimestre idênticas ao arquivo de Pedidos.
*   **Lógica:** O sistema localiza o processo aberto para aquele CNPJ e Período e abate o valor, calculando simultaneamente o honorário realizado.

---

## 🛠 Tecnologias Utilizadas

*   **React + TypeScript:** Interface robusta e tipagem segura.
*   **Tailwind CSS:** Design corporativo Dark Mode (Patrimonium Style).
*   **Recharts:** Biblioteca de visualização de dados para os gráficos de área, pizza e barras.
*   **Lucide React:** Iconografia moderna.
*   **LocalStorage API:** Persistência de dados em modo Mock para demonstração.

---

## 📝 Notas de Versão
*   **V1.2:** Implementação de 3 zonas de upload específicas para evitar conflitos de mapeamento.
*   **V1.5:** Refatoração do Dashboard para focar na "História do Dinheiro" (Mapeado -> Recuperado -> Honorário).
