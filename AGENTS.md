# Instruções de IA do Ambulatório IA

Este arquivo contém regras críticas para o processamento de dados clínicos, manutenção da lógica do sistema e governança do projeto.

## 0. Identidade do Criador e Administrador Mestre
- **Criador & Responsável pelo Projeto:** **Marco Duarte** (`marco.agduarte22@gmail.com`). 
- **Marco** é o idealizador, gestor e criador deste aplicativo. Ele não deve ser confundido com nomes fictícios ou temporários.
- **Profissionais Clínicos do Ambulatório IA:**
  1. **Dr. Carlos Morato** (Neurologia & Medicina Integrativa - CRM/SP 145.892)
  2. **Dra. Lucy Morata** (Odontologia Biológica & Saúde Integrativa - CRO/SP 98.412)
  3. **Marco Duarte** (Gestor Mestre & Administrador do Ambulatório IA)

## 1. Cálculo de Idade Preciso
Sempre que o sistema precisar calcular a idade de um paciente com base na data de nascimento (DOB):
- **Regra:** Não subtraia apenas os anos. Verifique se o dia e mês atuais já passaram o dia e mês de nascimento.
- **Lógica:** `Idade = Ano Atual - Ano de Nascimento`. Se `(Mês Atual < Mês de Nascimento)` OU `(Mês Atual == Mês de Nascimento E Dia Atual < Dia de Nascimento)`, então `Idade = Idade - 1`.
- **Exemplo:** Nascimento 08/05/1966 e Data Atual 12/04/2026. 2026 - 1966 = 60. Como 12/04 é antes de 08/05, a idade correta é **59 anos**.

## 2. Mapeamento de Checklist Integrativo
Para o modo de exame integrativo, a IA deve mapear termos clínicos para as chaves exatas do schema:
- **Suplementos:** colina, hidroxi_triptofano, fenilalanina, melatonina, ac_alfa_lipoico, semente_uva, coenzima_q10, astragalus, dhea, epa_dha, mix_pro, coriandrum, propolis, propco, mix_d9, ginger, acido_caprilico, bitter_mellon, arnica, myosothis, hip_perfuratum, neurexan, floral_bach, acido_folico, vit_b3_b6, pregne, heteropterys, arcalion, vinpocetina, fosfatidilserina, fosfatidilcolina, dmae.
- **Vitaminas/Minerais:** vit_d3, ca_mg_zn, vit_k2, selenio, manganes, cu, cromo, lugol, silimarina, quercetina, saw_palmetto, pygeum, tribulus, litio, cardiopeptase, betaina, taurina.
- **Patógenos:** candida, c_trachomatis, b_burgdorferi, c_pneumoniae, mycobact_tbc, mycobact_avium, hsv_type_1, hsv_type_2, zoster_virus, cmv_5.

## 4. Visualização de Histórico e Modos Clínicos
Ao trabalhar com os modos `standard`, `neurological`, e `integrative`, a regra de ouro para exibição de componentes e rótulos no Histórico ou Dashboard é sempre verificar o modo atrelado aos dados, e NUNCA testar o objeto verificando apenas `Object.keys(obj).length > 0`. Sempre use a função do utilitário `hasMeaningfulData(obj)`.

- **hasMeaningfulData**: Usado para não tratar como "conteúdo válido" objetos com chaves que têm valores vazios. 
- **Modo Neurológico**: Ao abrir um prontuário do histórico, o modo será `neurological` **SE** `record.especialidade` contiver `neuro` ou `record.exame_neurologico && hasMeaningfulData(record.exame_neurologico)`.
- **Modo Integrativo**: Da mesma forma, será `integrative` **SE** `record.especialidade` contiver `integrativa` ou `record.checklist_integrativo && hasMeaningfulData(record.checklist_integrativo)`.
- **Mapeamento Corporal (BodyMap)**: Deve estar visível no modo `standard` caso haja focos de dores ou queixas ativas. 

**IMPORTANTE (NUNCA QUEBRE)**: Nunca verifique existencia de dados apenas por chaves (Exemplo ERRADO: `Object.keys(record.exame_neurologico).length > 0`). Sempre use a helper `hasMeaningfulData(record.exame_neurologico)`. E ao carregar do banco, dê prioridade checando se a especialidade corresponde a 'neuro' ou 'integrativa' para abrir no form adequado.

## 5. Blindagem e Preservação dos Módulos Anatômicos e Neurológicos
Estes módulos e fluxos estão 100% validados e NUNCA devem ser regredidos, simplificados ou removidos:
- **Interação Híbrida (Manual + IA/Voz):** Todos os componentes (Boneco Wexler, Mapa de Dermátomos C2-S5, BodyMap 360°, Tabela de Força Muscular, Pares Cranianos e MEEM) SUPORTAM interação manual direta (clique de mouse / toque na tela) E preenchimento automático por voz/IA. O clique no boneco de Wexler cicla as notas (0 -> 1+ -> 2+ -> 3+ -> 4+), o clique nos dermátomos alterna o estado (hipoestesia, parestesia, etc.) e o clique no BodyMap 360 insere pontos de dor.
- **Estrutura de Wexler:** O boneco contém 8 pontos principais de reflexo: Bíceps D/E, Estilorradial D/E, Patelar D/E e Aquileu D/E, com viewBox expandida para não cortar rótulos.
- **Deep Merge & Sincronização:** Toda carga de prontuário e salvamento deve manter `rec.exame_neurologico`, `rec.checklist_integrativo` e `rec.mapeamento_corporal` preservados com sincronização bidirecional entre `dados_especialidade` e a raiz do registro, sem sobrescrever campos não citados.

## 6. Blindagem e Preservação da Odontologia Biológica (Dra. Lucy)
O módulo de Odontologia Biológica e Saúde Integrativa (Dra. Lucy) está 100% implementado, validado e BLINDADO contra regressões:
- **Estrutura de Dados Preservada:**
  * `dados_especialidade.odontograma`: Objeto mapeando dentes FDI (11 a 48) com `{ id, status, notes, biologicalPlan, neuralTherapy, tomografia }`. Status aceitos: `amalgam`, `zirconia_implant`, `titanium_implant`, `endodontic`, `cavitation_nico`, `missing`, `caries`, `ceramic_crown`, `healthy`.
  * **Protocolo SMART (IAOMT):** `amalgama_ativo`, `amalgama_elementos`, `smart_dique_nitrilo`, `smart_oxigenio_nasal`, `smart_exaustor_vapor`, `smart_irrigacao_alta`, `smart_carvao_chlorella`, `smart_quelacao_vitc`.
  * **Implantes Cerâmicos Metal-Free:** `implante_zirconia_ativo`, `implante_elementos`, `implante_prf_ienxerto`, `implante_tipo_sistema`.
  * **Cavitações Ósseas NICO/FDOK:** `focos_cavitacao_ativo`, `focos_descricao`, `focos_tomografia_cbct`.
  * **Terapia Neural & Ozônio Odontológico:** `terapia_neural_ativo`, `terapia_neural_locais`, `ozonioterapia_ativo`, `ozonio_modalidades`, `atm_bruxismo_ativo`.
  * **Suplementação Sistêmica Pré/Pós-Cirúrgica:** `suplemento_vit_d3_k2`, `suplemento_vit_c`, `suplemento_zinco_mg`, `suplemento_arnica_homeo`, `suplemento_coenzima_q10`, `observacoes_odonto_biologica`.
- **Interação Híbrida & Odontograma:** O odontograma anatômico (FDI 11 a 48) permite clique manual interativo para cada dente, seleção de condições clínicas, laudo CBCT e correlação dente-órgão-meridiano, além de preenchimento automático por voz e IA.
- **Regra de Sanitização:** NUNCA aplicar filtros de remoção de caracteres alfanuméricos ou substituições numéricas brutas sobre `dados_especialidade` ou `odontograma`.

## 7. Isolamento Total dos Pilares Clínicos (Dr. Carlos e Dra. Lucy)
O sistema possui especialidades clínicas principais que NUNCA devem interferir umas nas outras:
1. **Neurologia & Medicina Integrativa (Dr. Carlos):** `exame_neurologico` (Wexler 8 pontos, Dermátomos C2-S5, Força Muscular, Nervos Cranianos, MEEM), `checklist_integrativo` (40+ suplementos, fitoterápicos, minerais, patógenos) e `mapeamento_corporal` (BodyMap 360°).
2. **Odontologia Biológica (Dra. Lucy):** `dados_especialidade` (Odontograma Anatômico 32 dentes, SMART, Zircônia, NICO, Ozônio, Terapia Neural).

**Princípio de Não-Regressão (Coração Clínico Intocável):**
- Ao implementar melhorias em módulos periféricos (financeiro, faturamento, WhatsApp, layout, relatórios, agenda), os fluxos clínicos NUNCA devem ser alterados, simplificados ou desconfigurados.
- Ao carregar ou alternar pacientes e especialidades, usar sempre *deep merge* seguro para garantir que os dados de uma especialidade não apaguem ou contaminem os da outra.


