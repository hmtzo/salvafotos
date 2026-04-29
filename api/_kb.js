// =====================================================================
// SINDICOMPANY OS — Knowledge Base (curada, editável)
// =====================================================================
// Cada entrada tem:
//   tags     → palavras-chave pra match (lowercase)
//   title    → título da peça de conhecimento
//   content  → texto que será injetado no contexto da Sindi
//
// Como adicionar conhecimento da Sindicompany:
// 1. Adicione um novo objeto neste array
// 2. Use tags relevantes em lowercase
// 3. Mantenha content em ~500-2000 caracteres pra não estourar contexto
// =====================================================================

export const KNOWLEDGE_BASE = [
  // ==================== JURÍDICO ====================
  {
    id: 'kb-quorum',
    tags: ['quórum', 'quorum', 'assembleia', 'votação', 'voto', 'aprovação', 'convenção'],
    title: 'Quóruns de Assembleia — Código Civil',
    content: `**QUÓRUNS PADRÃO (Código Civil arts. 1.350-1.357 e Lei 4.591/64):**

- **Maioria simples** (presentes votantes): aprovação de contas, eleição de síndico, deliberações ordinárias
- **Maioria absoluta** (50%+1 do total de condôminos): pequenas reformas, autorização de despesas extraordinárias até certo valor
- **2/3 dos condôminos** (66,67%): obras úteis em áreas comuns, alteração de fachada (CC art. 1.341, II)
- **3/4 dos condôminos** (75%): alteração da convenção e do regimento interno (CC art. 1.351)
- **Unanimidade**: alteração de finalidade do edifício, mudança de destinação (CC art. 1.351 §único)
- **Especial 2/3 presentes**: destituição de síndico em assembleia especialmente convocada (Lei 4.591/64 art. 22 §5º)

**ATENÇÃO**: a convenção do condomínio pode estabelecer quóruns mais rigorosos (mas não menos). Sempre consultar a convenção específica antes de orientar.`
  },

  {
    id: 'kb-multa',
    tags: ['multa', 'penalidade', 'sanção', 'advertência', 'descumprimento', 'regimento', 'regulamento'],
    title: 'Aplicação de Multa — Devido Processo',
    content: `**APLICAÇÃO DE MULTA AO CONDÔMINO (CC art. 1.336 §2º + 1.337):**

Limite legal:
- Descumprimento de dever (silêncio, regimento, etc): **até 5x a taxa condominial mensal** (art. 1.336 §2º)
- Comportamento antissocial reiterado: **até 10x a taxa condominial mensal**, mediante deliberação de 3/4 dos demais condôminos (art. 1.337 §único)

Devido processo obrigatório:
1. **Advertência prévia por escrito** (notificação) — exceto em casos de urgência
2. **Direito de defesa** (prazo razoável, mínimo 7-15 dias na convenção)
3. **Decisão fundamentada** do síndico ou conselho
4. **Notificação da multa** com fundamento legal e prazo de pagamento
5. **Possibilidade de recurso à assembleia**

**Risco crítico**: multa aplicada sem devido processo é nula. Síndico responde pessoalmente por dano moral e devolução em dobro.`
  },

  {
    id: 'kb-inadimplencia',
    tags: ['inadimplência', 'inadimplencia', 'inadimplente', 'cobrança', 'cobranca', 'taxa', 'atraso', 'condômino'],
    title: 'Cobrança de Inadimplência',
    content: `**FLUXO PADRÃO DE COBRANÇA:**

1. **Boleto não pago vence** → juros 1%/mês + multa 2% (art. 1.336 §1º) + correção (índice da convenção, geralmente IGP-M/IPCA)
2. **D+5 a D+15**: cobrança amigável (carta, WhatsApp, e-mail) — sem ameaça, sem exposição pública
3. **D+30**: notificação extrajudicial registrada em cartório (cria prova pra ação)
4. **D+45-60**: protesto em cartório (Lei 9.492/97 — taxa condominial é título executivo extrajudicial após CPC art. 784, X)
5. **D+90**: ação de cobrança / execução

**ATENÇÃO LGPD**: NUNCA expor nome ou unidade do inadimplente em mural, grupo de WhatsApp, ata pública. Listas só em ata reservada ou comunicação direta ao próprio devedor.

**CC art. 1.336 §1º**: condômino inadimplente não pode votar em assembleia (alguns tribunais flexibilizam — sempre escalonar para advogado).`
  },

  {
    id: 'kb-lgpd',
    tags: ['lgpd', 'dados pessoais', 'privacidade', 'morador', 'cpf', 'câmera', 'cameras', 'cftv'],
    title: 'LGPD em Condomínios',
    content: `**LGPD (Lei 13.709/2018) APLICADA:**

Bases legais permitidas para condomínio:
- **Cumprimento de obrigação legal** (LGPD art. 7º, II) — ex: identificar visitantes
- **Legítimo interesse** (art. 7º, IX) — ex: CFTV, controle de acesso
- **Consentimento** (art. 7º, I) — ex: lista de aniversariantes, grupo de WhatsApp

Riscos comuns que viram multa:
- Expor nome de inadimplente em ata pública/mural
- Lista de moradores divulgada sem consentimento
- CFTV sem aviso visível (placas obrigatórias)
- Áudio em câmera (geralmente proibido — escalonar)
- Compartilhar dados em grupo de WhatsApp aberto a moradores

Obrigações:
- **DPO** (Encarregado): obrigatório se há tratamento intenso (CFTV + biometria + portaria 24h = sim)
- **Política de privacidade** disponível
- **Resposta a titular** em 15 dias (art. 19)
- **Comunicação de incidente** à ANPD em prazo razoável (art. 48)

Multa ANPD: até **2% do faturamento, limitado a R$ 50 milhões por infração**.`
  },

  // ==================== ENGENHARIA ====================
  {
    id: 'kb-nbr16280',
    tags: ['nbr 16280', 'nbr16280', 'reforma', 'obra', 'unidade', 'arquiteto', 'engenheiro', 'art', 'rrt'],
    title: 'NBR 16.280 — Reformas em Edificações',
    content: `**NBR 16.280:2014 — REFORMAS EM EDIFICAÇÕES (obrigatória):**

Toda reforma na unidade que afete sistemas estruturais, hidráulicos, elétricos, de gás, fachada ou áreas comuns exige:

1. **Plano de Reforma** assinado por profissional habilitado (engenheiro civil ou arquiteto com CREA/CAU ativo)
2. **ART** (CREA) ou **RRT** (CAU) recolhida antes do início
3. **Comunicação formal ao síndico** com antecedência mínima (geralmente 5-15 dias úteis na convenção)
4. **Documentação completa**: plano, projetos, ART/RRT, cronograma, identificação dos prestadores
5. **Aprovação do síndico** (não pode negar arbitrariamente, mas pode condicionar a ajustes técnicos)
6. **Acompanhamento** durante a obra
7. **Termo de encerramento** ao fim, atestando que a obra está conforme o plano

**Síndico que autoriza obra sem NBR 16.280** responde solidariamente em caso de acidente ou dano estrutural.

**Reformas sem alteração de sistema** (pintura interna, troca de piso sem afetar laje): geralmente não exigem ART/RRT, mas convém comunicar.`
  },

  {
    id: 'kb-avcb',
    tags: ['avcb', 'corpo de bombeiros', 'incêndio', 'incendio', 'bombeiros', 'segurança contra incêndio'],
    title: 'AVCB / CLCB — Bombeiros',
    content: `**AVCB (Auto de Vistoria do Corpo de Bombeiros) — SP / outros estados similares:**

Obrigatório para todo edifício. Validade: **3 anos** (renovação antecipada recomendada — 90 dias antes do vencimento).

Documentação típica para renovação:
- IPTU
- Habite-se
- Projeto técnico aprovado anterior
- Manutenção em dia: extintores (validade 1 ano + teste hidrostático 5 anos), hidrantes, alarme, iluminação de emergência, sprinklers
- Treinamento da brigada de incêndio (NBR 14.276)
- Lista de funcionários da brigada

Riscos de operar sem AVCB:
- Multa do CB
- Seguro do prédio recusado em sinistro
- Síndico responde criminalmente em caso de incêndio com vítimas (CP art. 250 — incêndio culposo)

**CLCB (Certificado de Licença do Corpo de Bombeiros)**: para edifícios menores ou de menor risco.

**Escalonar sempre**: contratação de empresa especializada em SCI (Sistema de Combate a Incêndio) com responsável técnico.`
  },

  {
    id: 'kb-elevador',
    tags: ['elevador', 'manutenção elevador', 'cadem', 'rget', 'preso', 'parado'],
    title: 'Manutenção de Elevadores',
    content: `**MANUTENÇÃO DE ELEVADORES:**

Normas aplicáveis:
- **NBR NM 207** (segurança em elevadores)
- **NBR 16.083** (manutenção)
- **CADEM/RGE** (varia por município — em SP: Cadastro de Equipamentos Mecânicos da Prefeitura, vistoria anual)

Obrigações:
- Contrato de manutenção mensal com empresa habilitada
- Livro de ocorrências da cabine
- Vistoria periódica (geralmente anual) com laudo
- Modernização quando necessário (laudo do RT)

**EM CASO DE PASSAGEIRO PRESO:**
1. Acalmar via interfone (orientar a NÃO tentar abrir a porta)
2. Acionar empresa de manutenção (24h obrigatório no contrato)
3. Acionar Bombeiros (193) se: idoso/criança/gestante, mais de 30 min, ou pessoa em pânico
4. NUNCA tentar resgate sem técnico — risco de queda livre
5. Após resgate: registrar ocorrência, identificar causa, comunicar manutenção pra inspeção
6. Se reincidente: avaliar suspensão do uso até reparo`
  },

  // ==================== OPERACIONAL ====================
  {
    id: 'kb-falta-agua',
    tags: ['falta de água', 'falta dagua', 'falta agua', 'água', 'agua', 'cisterna', 'caixa dagua', 'sabesp', 'reservatório'],
    title: 'Protocolo Falta de Água',
    content: `**PROTOCOLO PADRÃO — FALTA D'ÁGUA:**

1. **Identificar a causa** (em ordem de probabilidade):
   - Bomba parada → técnico + check elétrico
   - Reservatório vazio → companhia de saneamento (Sabesp 195) + caminhão pipa
   - Vazamento na rede → buscar visualmente nos pavimentos / chamar encanador
   - Manutenção programada da concessionária → confirmar no site

2. **Comunicar moradores** em até 30min via:
   - Grupo oficial / aplicativo do condomínio
   - Cartaz na portaria
   - Comunicado escrito (modelo padrão)

3. **Se prolongado (>4h)**:
   - Solicitar caminhão pipa (orçar 2-3 fornecedores)
   - Avisar restaurante/lojas térreas se houver
   - Considerar abertura de banheiro reserva no térreo

4. **Pós-evento**:
   - Registrar ocorrência em livro
   - Calcular custo, levar à próxima prestação de contas
   - Avaliar instalação de reservatório de emergência (melhoria estrutural)

**Risco**: falta de água por mais de 24h sem providências = responsabilidade do síndico por omissão.`
  },

  {
    id: 'kb-vazamento',
    tags: ['vazamento', 'infiltração', 'infiltracao', 'água caindo', 'apartamento', 'teto'],
    title: 'Protocolo de Vazamento',
    content: `**PROTOCOLO — VAZAMENTO ENTRE UNIDADES:**

1. **Atendimento imediato**:
   - Localizar a unidade origem (geralmente acima)
   - Solicitar fechamento do registro de água
   - Documentar com fotos/vídeo (importante pra responsabilização)

2. **Identificação de responsabilidade**:
   - Vazamento em **tubulação interna da unidade**: dono da unidade origem paga
   - Vazamento em **prumada / tubulação coletiva**: condomínio paga (taxa + reparo)
   - Vazamento em **laje**: depende — geralmente responsabilidade compartilhada ou do que comprovou inércia

3. **Laudo técnico** (obrigatório se discussão jurídica):
   - Engenheiro independente (não o que fará o reparo)
   - Custo geralmente do reclamante, ressarcido se confirmado

4. **Reparo**:
   - Hidráulico habilitado
   - Comunicação ao morador da unidade afetada (vai precisar acesso)
   - Estimativa de tempo + impacto

5. **Comunicação formal** entre as partes (modelo de notificação amigável → judicial se inércia).

**Escalonar para advogado** se: recusa da unidade origem, valor alto (>R$ 10k), ou risco estrutural.`
  },

  {
    id: 'kb-barulho',
    tags: ['barulho', 'perturbação', 'silêncio', 'silencio', 'festa', 'incômodo', 'incomodo'],
    title: 'Protocolo Barulho / Perturbação',
    content: `**PROTOCOLO — RECLAMAÇÃO DE BARULHO:**

Horário de silêncio (padrão NBR 10.151 + Lei do Silêncio municipal):
- **22h às 7h** (dias úteis)
- **22h às 9h** (sábados/domingos/feriados)
- **Limite diurno**: 50-65 dB(A) residencial
- **Limite noturno**: 45-50 dB(A) residencial

Fluxo:
1. **Reclamação registrada** (formulário, livro, app — sempre por escrito)
2. **Tentativa amigável** (síndico/zelador comunica de forma cordial)
3. **Advertência por escrito** (1ª ocorrência)
4. **Multa** (em caso de reincidência, conforme convenção, 1-5x taxa)
5. **Notificação extrajudicial** se persistir
6. **Polícia Militar (190)** em caso de festa/show com barulho excessivo flagrante
7. **Ação judicial** (obrigação de não fazer + dano moral) em caso extremo

**EVITE**:
- Confronto direto (não bata na porta sozinho)
- Multa sem advertência prévia (nula)
- Exposição pública do morador

Modelo de comunicação amigável e modelo de advertência: gerar via comando "GERAR PROTOCOLO".`
  },

  {
    id: 'kb-assembleia',
    tags: ['assembleia', 'convocação', 'convocacao', 'pauta', 'edital', 'ata'],
    title: 'Convocação e Realização de Assembleia',
    content: `**ASSEMBLEIA — PROCEDIMENTO PADRÃO:**

Ordinária (AGO): 1x/ano (geralmente entre março-abril). Pauta obrigatória:
- Aprovação de contas do ano anterior
- Previsão orçamentária do próximo ano
- Eleição de síndico/conselho (se vencido mandato)

Extraordinária (AGE): a qualquer tempo, com pauta específica.

**EDITAL DE CONVOCAÇÃO** (obrigatório):
- Antecedência mínima: **8 dias** (pode ser maior na convenção)
- Conteúdo: data, horário (1ª e 2ª chamada), local, pauta detalhada
- Distribuição: **escrita e protocolada** (ata, mural, e-mail confirmado)
- Pauta deve ser **específica** — assuntos não pautados não podem ser deliberados (princípio da finalidade)

Realização:
1. Conferir lista de presença + procurações (validade obrigatória)
2. Identificar inadimplentes (não votam — exceto na AGO de aprovação de contas, em alguns tribunais)
3. Verificar quórum por item (varia conforme assunto)
4. Eleger presidente da mesa + secretário
5. Discussão → votação → registro
6. Ata redigida em até 8 dias, assinada pelos presentes
7. Distribuição da ata aos condôminos (registro em cartório opcional, mas recomendado se houver decisão financeira relevante)

**Vícios comuns que anulam**:
- Convocação com prazo insuficiente
- Pauta vaga ("assuntos diversos")
- Inadimplente votando em deliberação financeira
- Ata com decisão fora da pauta
- Procuração genérica`
  },

  // ==================== FINANCEIRO ====================
  {
    id: 'kb-rateio',
    tags: ['rateio', 'fração ideal', 'fracao ideal', 'taxa', 'cota', 'condominial'],
    title: 'Rateio e Fração Ideal',
    content: `**RATEIO DAS DESPESAS CONDOMINIAIS:**

Regra geral: **fração ideal** registrada na convenção (CC art. 1.336, I).

Exceções permitidas pela convenção:
- Despesas de uso individualizado (água, gás se houver medidor): pelo consumo
- Despesas de áreas específicas (salão de festas reformado, vaga rotativa): proporcional ao uso
- Fundo de obras: pode ser por unidade (1/N) ou fração ideal

**TIPOS DE DESPESA:**
- **Ordinária**: manutenção rotineira, salários, água, luz comum, IPTU comum, conservação. Locatário paga (Lei 8.245/91 art. 23, XII)
- **Extraordinária**: obras, reformas estruturais, fundo de reserva extraordinário. Proprietário paga (art. 22, X)

**FUNDO DE RESERVA**:
- Geralmente 5-10% do orçamento mensal
- Uso restrito a obras emergenciais ou previstas em assembleia
- Não pode ser usado pra despesa ordinária sem aprovação

**INADIMPLÊNCIA NO RATEIO**:
- Juros 1%/mês (art. 1.336 §1º)
- Multa 2%
- Correção pelo índice da convenção

Erro comum: cobrar despesa extraordinária do inquilino em vez do proprietário → ação de repetição contra o condomínio.`
  },

  // ==================== SINDICOMPANY MÉTODO ====================
  {
    id: 'kb-metodo-sindicompany',
    tags: ['sindicompany', 'método', 'metodo', 'padrão', 'padrao', 'empresa', 'cliente'],
    title: 'Método Sindicompany — Princípios',
    content: `**MÉTODO SINDICOMPANY — princípios operacionais:**

1. **Procedimento antes de improviso**: toda decisão recorrente deve ter POP. Se não tem, criamos um.
2. **Documente tudo**: ofício escrito, ata registrada, foto/vídeo de ocorrência. Memória oral não vale em juízo.
3. **Escalonamento previsível**: síndico → backoffice → jurídico → diretoria. Sem pular etapas, sem segurar problema.
4. **Comunicação preventiva**: morador informado é morador menos reclamão. Comunicado escrito antes da reclamação.
5. **Risco antes de custo**: nunca cortar manutenção crítica de segurança pra economizar (incêndio, estrutural, elétrico).
6. **Conformidade > opinião**: lei e norma vencem preferência pessoal de morador ou síndico.
7. **Auditoria contínua**: revisar processos a cada 3-6 meses; identificar gargalos antes de virar crise.
8. **Proteger empresa e condomínio simultaneamente**: nunca tomar decisão que beneficie um e exponha o outro.

**Decisões frequentes pré-aprovadas** (não precisam de assembleia):
- Manutenção preventiva contratual (elevador, bombas, gerador, AVCB)
- Reparo emergencial até R$ X (ver convenção; padrão Sindicompany: até 2x taxa mensal)
- Substituição de prestador problemático em até 30 dias

**Sempre exigem assembleia**:
- Obras estruturais
- Aumento de taxa fora do orçamento aprovado
- Contratação de prestador de longo prazo (>12 meses)
- Mudança de prestador essencial (segurança, limpeza)`
  },
];

// =====================================================================
// Recuperação por keyword (simples, sem embeddings)
// =====================================================================
// Retorna até `limit` peças mais relevantes pra query.
// `customPieces` é opcional — quando fornecido, é mesclado com o array
// hardcoded pra busca (peças custom adicionadas pelo admin via UI).
export function retrieveKnowledge(query, limit = 3, customPieces = [], sharedInsights = []) {
  if (!query || typeof query !== 'string') return [];
  const normalize = s => String(s || '').toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '');
  const qNorm = normalize(query);

  // Marca origem pra identificar nas respostas
  const tagged = [
    ...KNOWLEDGE_BASE.map(k => ({ ...k, _source: 'core' })),
    ...(customPieces || []).map(k => ({ ...k, _source: 'custom' })),
    ...(sharedInsights || []).map(k => ({ ...k, _source: 'insight' })),
  ];

  const scored = tagged.map(kb => {
    let score = 0;
    const tags = Array.isArray(kb.tags) ? kb.tags : [];
    for (const tag of tags) {
      const tagNorm = normalize(tag);
      if (tagNorm && qNorm.includes(tagNorm)) score += 2;
    }
    const titleWords = normalize(kb.title || '').split(/\s+/).filter(w => w.length > 3);
    for (const w of titleWords) {
      if (qNorm.includes(w)) score += 1;
    }
    // Boost por votos positivos (insights da equipe)
    if (kb._source === 'insight' && typeof kb.votes === 'number') {
      score += Math.max(0, Math.min(3, kb.votes));
    }
    return { kb, score };
  });
  return scored
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(x => x.kb);
}
