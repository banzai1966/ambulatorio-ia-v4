# Instruções de IA do Ambulatório IA

Este arquivo contém regras críticas para o processamento de dados clínicos e manutenção da lógica do sistema.

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

## 6. Planejamento Científico Integrativo & Odontologia Biológica (Módulo Dra. Lucy)
Quando o usuário solicitar a implementação deste módulo no futuro:
- **Funcionalidade**: Gerador de Relatório de Casos Complexos em Odontologia Biológica & Saúde Integrativa.
- **Entradas**: Queixas, exames de sangue, focos de inflamação crônica, amálgama/biocompatibilidade, raio-X/tomografia.
- **Saídas**: Relatório clínico estruturado com diretrizes de intervenção, estilo de vida, imunologia, terapia neural e citações científicas / referências no rodapé.
- **Base de Conhecimento**: Suporte a RAG (upload de diretrizes/artigos em PDF/Markdown) e busca científica integrada (Google Scholar / PubMed via Gemini Grounding).


