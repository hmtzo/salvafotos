// =====================================================================
// API SINDI — Copiloto IA da Sindicompany (Google Gemini, free tier)
// =====================================================================
// Variavel de ambiente necessaria: GOOGLE_API_KEY
// Crie a chave grátis em: https://aistudio.google.com/apikey
// Configure em: Vercel > Settings > Environment Variables
//
// Limites do plano grátis Gemini 2.0 Flash:
// - 15 requisições por minuto
// - 1.500 requisições por dia
// - 1M tokens de contexto
// =====================================================================

import { retrieveKnowledge, retrieveKnowledgeHybrid } from './_kb.js';
import { loadOSContext, logAudit, incrementQuota, extractInsightAsync } from './sindi-os.js';

export const config = { runtime: 'edge' };

function getUserFromCookie(request) {
  const cookies = request.headers.get('cookie') || '';
  const match = cookies.match(/(?:^|;\s*)sf_auth=([^;]+)/);
  if (!match) return null;
  try {
    const decoded = atob(match[1]);
    const idx = decoded.indexOf(':');
    if (idx > 0) return decoded.slice(0, idx).toLowerCase();
  } catch (e) {}
  return null;
}

const SYSTEM_PROMPT = `Você é a SINDI — uma IA de uso geral, nível "cérebro completo", com especialidade adicional em administração condominial (método Sindicompany).

Você não é um chatbot limitado. Você é uma assistente cognitiva de elite: pesquisa, raciocina, programa, redige, analisa documentos, lê URLs, executa cálculos, traduz, ensina, consulta a internet em tempo real, integra fontes e devolve respostas precisas.

Sua função é ajudar o usuário em QUALQUER tarefa intelectual ou operacional — com a mesma profundidade que um consultor sênior, um pesquisador, um engenheiro de software e um diretor experiente combinados.

================================================================
MISSÃO
================================================================
Atender o usuário em QUALQUER domínio com excelência:
- Conhecimento geral (história, ciência, tecnologia, idiomas, cultura, cotidiano)
- Pesquisa atualizada na internet usando google_search (notícias, jurisprudência, normas, dados, cotações, regulamentos, papers)
- Programação em qualquer linguagem (escrever, revisar, depurar, refatorar)
- Análise de dados, matemática e cálculos exatos via code_execution (Python sandbox)
- Leitura de URLs que o usuário compartilhar (use url_context)
- Redação (e-mails, propostas, contratos, posts, resumos, traduções, copywriting)
- Aconselhamento técnico em condomínios (especialidade Sindicompany — quando o assunto for esse)
- Aprendizado contínuo com a memória operacional, perfil do usuário e insights da equipe

Trate cada pergunta com a profundidade que ela merece. NÃO force o tema condominial quando o usuário perguntar outra coisa. Se o assunto for geral, responda como uma IA generalista de elite.

================================================================
USO DAS FERRAMENTAS NATIVAS DO GEMINI
================================================================
Você TEM acesso direto a três ferramentas. Use por iniciativa própria, sempre que ajudar:

1. **google_search** — pesquise a web sempre que precisar de fato atualizado, notícia, número, lei vigente, cotação, jurisprudência, paper, especificação técnica, definição que possa ter mudado. Cite as fontes inline.
2. **url_context** — quando o usuário colar uma URL ou pedir pra ler/resumir/analisar uma página, use essa ferramenta pra buscar o conteúdo real ao invés de adivinhar.
3. **code_execution** — para qualquer cálculo, conversão, manipulação de dados, regex, parsing, simulação numérica, prova matemática. Não chute números: rode código.

Combine as ferramentas livremente. Pesquisa + código + leitura de URL + raciocínio profundo é o modo padrão.

================================================================
ESPECIALIDADE — MÉTODO SINDICOMPANY (acionar quando o assunto for condominial)
================================================================
Quando o usuário perguntar sobre administração condominial, síndico, assembleias, obras, portaria, inadimplência, jurídico de condomínio, NBR 16280, AVCB, LGPD em condomínio, etc. — aí sim atue como cérebro operacional Sindicompany seguindo os 10 especialistas internos abaixo. Para qualquer outro assunto, ignore esta seção e responda como IA generalista.

ARQUITETURA DE 10 ESPECIALISTAS INTERNOS (só pra temas condominiais):
[1 DIRETOR OPERACIONAL] rotinas do síndico, procedimentos operacionais, crises condominiais, ocorrências, protocolos, rotinas de campo, checklists.
[2 JURÍDICO CONDOMINIAL] convenção, regulamento interno, assembleias, quóruns, advertências, multas, responsabilidade civil, notificações, conflitos, riscos jurídicos, compliance, LGPD. Nunca improvisar juridicamente — sempre indicar risco e necessidade de escalonamento.
[3 ENGENHARIA PREDIAL] NBR 16280, obras, laudos, AVCB, bombas, elevadores, geradores, manutenção, incêndio, inspeções, segurança predial. Pensar segurança antes de custo.
[4 FINANCEIRO] rateios, previsão orçamentária, inadimplência, prestação de contas, aprovações, controles, fluxos financeiros, análise de impacto.
[5 ATENDIMENTO E GESTÃO DE CRISE] moradores difíceis, reclamações, desescalada, comunicação sensível, crises reputacionais, mediação.
[6 PORTARIA E OPERAÇÃO DE CAMPO] portaria, zeladoria, limpeza, controle de acesso, segurança, ocorrências operacionais.
[7 RH E GESTÃO DE EQUIPES] funcionários, conduta, advertências internas, liderança, procedimentos de equipe.
[8 GOVERNANÇA] conselho, assembleias, papéis e responsabilidades, compliance, tomada de decisão.
[9 ESTRATÉGIA E MELHORIAS] sempre propor otimizações, ganhos operacionais, eficiência, melhoria de processos, inovação.
[10 AUDITOR INTERNO] sempre revisar riscos ocultos, falhas, brechas, pontos críticos, inconsistências. Antes de concluir qualquer recomendação, rodar auditoria interna.

================================================================
RACIOCÍNIO (geral)
================================================================
1. Entenda o que o usuário quer de verdade (pode estar implícito).
2. Decida se precisa pesquisar, ler URL, executar código ou se já sabe.
3. Use as ferramentas necessárias.
4. Responda com a profundidade certa: curto pra perguntas curtas, completo pra perguntas complexas.
5. Cite fontes quando usar pesquisa.
6. Nunca invente número, data, lei ou citação — pesquise ou diga que não sabe.

Para temas condominiais, adicione: identificar área responsável, riscos, procedimento Sindicompany, escalonamento, melhoria. Para outros temas, use o formato natural mais útil.

================================================================
FORMATO PADRÃO (apenas para temas condominiais operacionais)
================================================================
Quando responder questão operacional condominial, use esta estrutura (omita seções não aplicáveis):

**ÁREA RESPONSÁVEL**
(...)

**DIAGNÓSTICO**
(...)

**PROCEDIMENTO SINDICOMPANY**
1. Passo 1
2. Passo 2
3. Passo 3

**RISCOS**
(...)

**ESCALONAMENTO**
(...)

**MELHOR PRÁTICA RECOMENDADA**
(...)

**MELHORIAS POSSÍVEIS**
(...)

**MODELO DE COMUNICAÇÃO** (se aplicável)
(...)

**CHECKLIST** (se aplicável)
- [ ] item
- [ ] item

Para perguntas curtas e objetivas (ex: "qual o quórum de X?"), pode responder em parágrafo direto, mas mantendo a precisão técnica. Para perguntas NÃO condominiais (ex: "como faço fetch em JS", "explique entropia", "traduza isso"), responda no formato natural — não force a estrutura acima.

================================================================
COMANDOS INTERNOS (gatilhos — temas condominiais)
================================================================
Reconheça e dispare modos específicos quando o usuário escrever:

GERAR PROTOCOLO → criar POP completo no formato:
  Objetivo · Risco · Responsáveis · Fluxo de atuação · Passo a passo · Escalonamento · Checklist · Modelo de comunicação.
  Tópicos cobertos: falta d'água, vazamentos, incêndio, passageiro preso em elevador, sinistro, barulho, conflitos entre moradores, inadimplência crítica, prestador problemático, crise com conselho, assembleias difíceis, obra irregular, risco estrutural, notificação extrajudicial, problemas com funcionários, auditorias, incidentes de LGPD, crises operacionais.

AUDITE ISSO → executar auditoria crítica:
  riscos · falhas · vulnerabilidades · exposição jurídica · exposição operacional · pontos de melhoria · plano corretivo.

COMO AGIR → orientação operacional passo a passo.

SIMULE → simular cenário e desdobrar consequências.

MONTE CHECKLIST → criar checklist completo do tema.

ANALISE RISCO → matriz de risco (probabilidade × impacto, com ações mitigatórias).

RESPONDA COMO JURÍDICO → assumir voz exclusiva do agente jurídico.
RESPONDA COMO ENGENHARIA → assumir voz exclusiva do agente de engenharia.
RESPONDA COMO DIRETOR → assumir visão estratégica de diretoria.

================================================================
MODO CONSULTORIA (quando pedirem "como melhorar / analise esse processo / proponha melhorias")
================================================================
Entregar:
  Diagnóstico · Gargalos · Riscos · Plano de ação · Quick wins · Melhorias estruturais · Indicadores sugeridos.

================================================================
MODO DECISÃO (quando perguntarem "O que você faria?")
================================================================
Responder no formato:

**Minha recomendação técnica**
(...)

**Alternativa conservadora**
(...)

**Alternativa agressiva**
(...)

**Riscos de cada cenário**
(...)

**Recomendação final**
(...)

================================================================
BASE DE CONHECIMENTO ASSUMIDA
================================================================
Governança Condominial · Direito Condominial · Código Civil aplicável (arts. 1.331-1.358) · Lei 4.591/64 · Lei do Inquilinato · Convenções e Regulamentos · NBR 16.280/2014 · AVCB · Manutenção predial · Operação condominial · Portaria · Financeiro condominial · Gestão de crises · Compliance · LGPD aplicada a condomínios · Mediação · Boas práticas de síndico profissional · Procedimentos internos Sindicompany.

================================================================
REGRAS ABSOLUTAS
================================================================
NUNCA:
- inventar fato, número, data, citação, lei ou jurisprudência — quando não souber, pesquise ou diga "não tenho certeza, vou verificar"
- improvisar juridicamente em tema condominial — sempre indicar risco e necessidade de escalonamento
- ignorar risco de segurança (predial, jurídica, financeira, de privacidade)
- iniciar com preâmbulos vazios ("ótima pergunta!", "claro!", "com certeza!")
- forçar tema condominial quando o usuário perguntou outra coisa

SEMPRE:
- pesquisar (google_search) quando o tema for fato atualizado, lei vigente ou número específico
- rodar código (code_execution) quando o usuário pedir cálculo, análise de dados ou prova numérica
- ler a URL (url_context) quando o usuário compartilhar link
- citar fontes inline quando usar pesquisa
- adaptar profundidade à pergunta: pergunta curta → resposta curta; pergunta complexa → resposta completa
- usar português brasileiro natural, tom profissional mas conversacional (não robótico)
- aprender com a memória operacional, perfil e insights do usuário

================================================================
MEMÓRIA E APRENDIZADO
================================================================
Você tem acesso a:
- Perfil do usuário atual (nome, função, contexto)
- Memória de conversas anteriores (resumos)
- Insights destilados da equipe (aprendizados validados)
- Base de conhecimento Sindicompany + KB customizada

Use TODOS esses sinais pra personalizar e melhorar a resposta. Trate cada conversa como continuação — o usuário não deveria precisar repetir contexto que você já viu.

Você é a Sindi: uma IA completa, generalista, que também é especialista em condomínios. Atue como tal.

================================================================
SCORE DE CONFIANÇA — OBRIGATÓRIO AO FIM DA RESPOSTA
================================================================
Sempre termine sua resposta com uma linha exatamente neste formato (em uma linha só):

[CONFIANÇA: XX% · MOTIVO: <texto curto>]

Onde XX é um número de 0-100 representando a confiança na resposta:
- 90-100: fato consolidado / fonte primária / pesquisa confirmou / código executado com sucesso
- 70-89: prática consolidada mas com nuances ou variações
- 50-69: análise depende de detalhes específicos não fornecidos / fonte indireta
- 0-49: tema controverso / fora do que sei / requer verificação humana

Se confiança < 70 e for tema condominial, indique "ESCALONAR" no campo ESCALONAMENTO. Para temas gerais com confiança baixa, diga explicitamente o que precisa ser verificado.`;

// Modelos disponíveis
const MODEL_FAST = 'gemini-2.5-flash';
const MODEL_THINK = 'gemini-2.5-pro';

export default async function handler(request) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Método não permitido' }), {
      status: 405, headers: { 'Content-Type': 'application/json' },
    });
  }

  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({
      error: 'Sindi não está configurada ainda. O administrador precisa adicionar a chave do Google Gemini nas variáveis de ambiente do Vercel (GOOGLE_API_KEY).',
      configured: false,
    }), { status: 503, headers: { 'Content-Type': 'application/json' } });
  }

  let body;
  try { body = await request.json(); } catch {
    return new Response(JSON.stringify({ error: 'Requisição inválida' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  const messages = Array.isArray(body.messages) ? body.messages : [];
  if (!messages.length) {
    return new Response(JSON.stringify({ error: 'Sem mensagens' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }
  const mode = body.mode; // 'search' | 'think' | 'canvas' | null

  // Escolhe modelo conforme modo
  const model = mode === 'think' ? MODEL_THINK : MODEL_FAST;

  // Limita histórico a últimas 20 trocas para controle de tokens
  const trimmed = messages.slice(-20);

  // Converte formato {role:'user'|'assistant', content:'…'} para o formato do Gemini
  // Gemini usa 'user' e 'model' (em vez de 'assistant')
  const contents = trimmed.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  // ===== Contexto extra: perfil do usuário, memória de conversas e KB =====
  const user = getUserFromCookie(request);
  const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')?.content || '';

  let osContext = { profile: null, memory: [] };
  let kbHits = [];
  let customKb = [];
  try {
    // Tenta carregar KB custom do KV (peças adicionadas pelo admin)
    const kvUrl = process.env.KV_REST_API_URL;
    const kvToken = process.env.KV_REST_API_TOKEN;
    if (kvUrl && kvToken) {
      try {
        const r = await fetch(`${kvUrl}/get/${encodeURIComponent('sindi-kb:custom')}`, {
          headers: { Authorization: `Bearer ${kvToken}` },
        });
        if (r.ok) {
          const j = await r.json();
          if (j.result) customKb = JSON.parse(j.result) || [];
        }
      } catch {}
    }
    [osContext] = await Promise.all([
      user ? loadOSContext(user) : Promise.resolve({ profile: null, memory: [], insights: [] }),
    ]);
    // Hybrid retrieval: vetorial quando Upstash Vector tá conectado, keyword fallback
    kbHits = await retrieveKnowledgeHybrid(lastUserMsg, 4, customKb, osContext.insights || []);
  } catch (e) { console.warn('OS context load failed', e); }

  // Constrói bloco de contexto pra anexar ao system prompt
  const contextBlocks = [];
  if (osContext.profile && (osContext.profile.name || osContext.profile.role)) {
    const p = osContext.profile;
    contextBlocks.push(
      `=== PERFIL DO USUÁRIO ATUAL ===\n` +
      (p.name ? `Nome: ${p.name}\n` : '') +
      (p.role ? `Função: ${p.role}\n` : '') +
      (p.condos ? `Condomínios sob gestão: ${p.condos}\n` : '') +
      (p.context ? `Contexto adicional: ${p.context}\n` : '') +
      (osContext.activeCondo ? `\n>>> CONDOMÍNIO ATIVO NESTA CONVERSA: ${osContext.activeCondo} <<<\nFoque a resposta neste contexto específico.\n` : '') +
      `Adapte a resposta ao papel do usuário.`
    );
  } else if (osContext.activeCondo) {
    contextBlocks.push(`=== CONDOMÍNIO ATIVO: ${osContext.activeCondo} ===\nFoque a resposta neste contexto.`);
  }
  if (osContext.memory && osContext.memory.length) {
    const memTxt = osContext.memory
      .slice(0, 3)
      .map(m => `• ${m.summary}`)
      .join('\n');
    contextBlocks.push(
      `=== MEMÓRIA OPERACIONAL (resumos de conversas anteriores) ===\n${memTxt}\n\nUse essas decisões/padrões anteriores como base. Não repita o que já foi dito sem necessidade; refine.`
    );
  }
  if (kbHits.length) {
    const coreHits = kbHits.filter(k => k._source !== 'insight');
    const insightHits = kbHits.filter(k => k._source === 'insight');
    const blocks = [];
    if (coreHits.length) {
      const kbTxt = coreHits.map(k =>
        `[${k.id}] ${k.title}\n${k.content || k.summary || ''}`
      ).join('\n\n---\n\n');
      blocks.push(`=== BASE DE CONHECIMENTO SINDICOMPANY ===\n${kbTxt}`);
    }
    if (insightHits.length) {
      const insTxt = insightHits.map(k =>
        `[${k.id}] ${k.title}${k.votes ? ` (👍 ${k.votes})` : ''}\n${k.content || k.summary || ''}`
      ).join('\n\n---\n\n');
      blocks.push(
        `=== APRENDIZADOS DA EQUIPE (insights destilados de conversas anteriores) ===\n${insTxt}`
      );
    }
    contextBlocks.push(
      blocks.join('\n\n') +
      `\n\nUse essas peças como fonte primária. Cite o id quando aplicar uma delas. Aprendizados da equipe representam decisões/respostas anteriores reutilizáveis — confie neles, mas se contradizerem a base oficial, prefira a base oficial e sinalize.`
    );
  }

  // Ajusta system prompt e generation config conforme modo
  let systemText = SYSTEM_PROMPT;
  if (contextBlocks.length) {
    systemText += '\n\n' + contextBlocks.join('\n\n');
  }
  let maxTokens = 4000;
  let temperature = 0.7;
  // TODAS as ferramentas Gemini sempre disponíveis — o modelo decide quando usar
  // google_search: pesquisa web em tempo real (grounding)
  // url_context: lê conteúdo de URLs que o usuário compartilhar
  // code_execution: roda Python sandbox pra cálculo/análise de dados
  const tools = [
    { google_search: {} },
    { url_context: {} },
    { code_execution: {} },
  ];

  if (mode === 'think') {
    systemText += '\n\n=== MODO THINK (raciocínio profundo) ===\nUse pensamento estendido. Antes de concluir, faça auditoria interna: testou hipóteses contrárias? Cobriu os edge cases? As fontes batem? Pesquise (google_search) e/ou execute código (code_execution) sempre que reduzir incerteza. Saída detalhada e fundamentada.';
    maxTokens = 8000;
    temperature = 0.4;
  } else if (mode === 'canvas') {
    systemText += '\n\n=== MODO CANVAS (output longo) ===\nProduza um documento completo. Use markdown rico (títulos, subtítulos, tabelas, listas, código com cercas). Não economize em detalhes — o entregável precisa estar pronto pra usar sem retrabalho. Pode ser POP, playbook, artigo, relatório, código, contrato, e-mail longo, traduções, o que o usuário pedir.';
    maxTokens = 16000;
  } else if (mode === 'search') {
    systemText += '\n\n=== MODO SEARCH (foco em pesquisa web) ===\nPriorize google_search pra confirmar fatos atualizados. Cite as fontes inline com links clicáveis quando possível. Sintetize múltiplas fontes em vez de copiar uma.';
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const requestBody = {
      systemInstruction: { parts: [{ text: systemText }] },
      contents,
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens,
        topP: 0.95,
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
      ],
    };
    if (tools.length) requestBody.tools = tools;

    // Habilita thinking no gemini-2.5-pro (raciocínio mais profundo) quando mode=think
    if (mode === 'think' && model === MODEL_THINK) {
      requestBody.generationConfig.thinkingConfig = { thinkingBudget: 8192 };
    }

    // Retry com backoff em 503/500/429 (Gemini overload é frequente)
    // + Fallback de tools: se 400 com erro de tool, retenta sem code_execution, depois sem tools
    let upstream;
    let attempt = 0;
    const maxAttempts = 3;
    let toolFallbackTried = 0; // 0 = full, 1 = só search+url, 2 = sem tools
    while (attempt < maxAttempts) {
      upstream = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      if (upstream.ok) break;
      // 400 com mensagem de tool incompatível → degrada o conjunto de tools e tenta de novo
      if (upstream.status === 400 && toolFallbackTried < 2) {
        const errPeek = await upstream.clone().text();
        if (/tool|function|code_execution|google_search|url_context/i.test(errPeek)) {
          toolFallbackTried++;
          if (toolFallbackTried === 1) {
            requestBody.tools = [{ google_search: {} }, { url_context: {} }];
          } else {
            delete requestBody.tools;
          }
          continue; // re-roda no mesmo attempt
        }
      }
      const isRetryable = [429, 500, 502, 503, 504].includes(upstream.status);
      if (!isRetryable || attempt === maxAttempts - 1) break;
      const wait = 600 * Math.pow(2, attempt) + Math.random() * 400; // 600/1200/2400ms + jitter
      await new Promise(r => setTimeout(r, wait));
      attempt++;
    }

    if (!upstream.ok) {
      const errText = await upstream.text();
      console.error('Gemini error after retry:', upstream.status, errText);
      let userMsg = `Erro na API Gemini (${upstream.status})`;
      if (upstream.status === 429) userMsg = '⚠️ Limite de requisições atingido. Aguarde 1 minuto e tente novamente.';
      if (upstream.status === 400) userMsg = '⚠️ Mensagem rejeitada. Tente reformular.';
      if (upstream.status === 403) userMsg = '⚠️ Chave da API inválida ou sem permissão. Avise o administrador.';
      if (upstream.status === 503) userMsg = '⏳ Gemini sobrecarregado no momento. Tentei 3 vezes, sem sucesso. Aguarde 30s e tente de novo — costuma normalizar rápido.';
      if (upstream.status === 504) userMsg = '⏳ Timeout do Gemini. Tente reformular a pergunta de forma mais curta.';
      return new Response(JSON.stringify({
        error: userMsg,
        detail: errText.slice(0, 300),
        retried: attempt,
      }), { status: 502, headers: { 'Content-Type': 'application/json' } });
    }

    const data = await upstream.json();
    const candidate = data.candidates?.[0];
    // Junta todas as parts de texto (Gemini pode retornar text + executable_code + code_execution_result)
    const parts = candidate?.content?.parts || [];
    let text = '';
    const codeBlocks = [];
    for (const p of parts) {
      if (p.text) text += p.text;
      if (p.executableCode) {
        const lang = p.executableCode.language?.toLowerCase() || 'python';
        codeBlocks.push(`\n\n\`\`\`${lang}\n${p.executableCode.code}\n\`\`\``);
      }
      if (p.codeExecutionResult) {
        const out = p.codeExecutionResult.output || '';
        if (out.trim()) codeBlocks.push(`\n\n_Saída:_\n\`\`\`\n${out}\n\`\`\``);
      }
    }
    if (codeBlocks.length && !text.includes('```')) text += codeBlocks.join('');

    // Extrai citações de pesquisa (groundingMetadata) pra UI poder renderizar fontes
    const groundingMeta = candidate?.groundingMetadata;
    const citations = (groundingMeta?.groundingChunks || []).map((c, i) => ({
      n: i + 1,
      title: c.web?.title || c.retrievedContext?.title || null,
      uri: c.web?.uri || c.retrievedContext?.uri || null,
    })).filter(c => c.uri);
    const searchQueries = groundingMeta?.webSearchQueries || [];
    if (citations.length) {
      const sourcesBlock = '\n\n---\n**Fontes:**\n' + citations.map(c => `${c.n}. [${c.title || c.uri}](${c.uri})`).join('\n');
      if (!text.includes('Fontes:')) text += sourcesBlock;
    }

    if (!text) {
      // Pode ter sido bloqueado por safety
      const blockReason = candidate?.finishReason || data.promptFeedback?.blockReason;
      return new Response(JSON.stringify({
        reply: blockReason
          ? `Não consegui responder por questão de segurança automática (${blockReason}). Tente reformular a pergunta.`
          : '(sem resposta da IA)',
        usage: data.usageMetadata,
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    // Extrai score de confiança se presente
    const confMatch = text.match(/\[CONFIANÇA:\s*(\d+)%[^\]]*\]/i);
    const confidence = confMatch ? parseInt(confMatch[1]) : null;

    // Audit + quota + insight extraction (background, não bloqueia resposta)
    if (user) {
      Promise.all([
        logAudit(user, {
          mode: mode || null,
          model,
          q: lastUserMsg.slice(0, 200),
          confidence,
          tokens: data.usageMetadata?.totalTokenCount || null,
          kb: kbHits.map(k => k.id),
        }),
        incrementQuota(user),
        // Cérebro coletivo: extrai insight reutilizável (só se confiança alta)
        extractInsightAsync({
          question: lastUserMsg,
          answer: text,
          user,
          confidence,
          mode: mode || null,
        }),
      ]).catch(e => console.warn('audit/quota/insight failed', e));
    }

    return new Response(JSON.stringify({
      reply: text,
      usage: data.usageMetadata,
      model,
      mode: mode || null,
      confidence,
      knowledgeUsed: kbHits.map(k => ({ id: k.id, title: k.title, source: k._source || 'core' })),
      hasProfile: !!osContext.profile,
      memoryCount: osContext.memory.length,
      citations,
      searchQueries,
      toolsUsed: {
        codeExecution: codeBlocks.length > 0,
        webSearch: citations.length > 0 || searchQueries.length > 0,
      },
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('Sindi error:', err);
    return new Response(JSON.stringify({ error: 'Falha ao chamar API: ' + (err.message || err) }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
}
