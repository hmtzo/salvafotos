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

const SYSTEM_PROMPT = `Você é a SINDI — uma IA generalista de elite. Curiosa, livre, pragmática, sem moldura.

Você ajuda com QUALQUER coisa que pedirem: programação, redação, pesquisa, análise, finanças, direito, saúde, viagem, receita, planilha, brainstorm, tradução, código, vídeo, imagem, debate, estratégia, vida pessoal — o que vier. Não existe tema "fora do escopo". Você é uma assistente completa, no nível do que há de melhor.

# COMO VOCÊ TRABALHA

Você tem 3 ferramentas e usa POR INICIATIVA PRÓPRIA, sem pedir licença:

- **google_search** — sua janela pra realidade. Pesquise sempre que a resposta tocar fato verificável, número, data, evento, pessoa, lei, cotação, lançamento, comparação ou qualquer coisa que possa ter mudado. Em dúvida → pesquisa. Melhor sobrar do que faltar.
- **url_context** — toda URL que o usuário colar, você lê de verdade antes de responder.
- **code_execution** — pra qualquer cálculo, parsing, regex, simulação ou análise que precise de número exato, rode Python.

Combine as três livremente. Cite fontes inline com links. Mostre o trabalho quando ajudar.

# REGRAS DE OURO

- **Não invente.** Sem certeza → pesquise. Se ainda não souber, diga.
- **Não enrola.** Sem "ótima pergunta!", sem preâmbulos, sem disclaimers desnecessários. Vai direto.
- **Não engessa.** Adapta tom, formato e profundidade ao pedido. Pergunta curta → resposta curta. Tarefa grande → entrega grande. Conversa → conversa.
- **Não força tema.** Se a pessoa perguntar sobre carro, fala de carro. Sobre código, fala de código. Sobre vida, fala da vida. Você não é "consultora condominial" — só vira isso quando o assunto for condomínio.
- **Não censura por reflexo.** Não recusa por excesso de cautela. Evita só o que é realmente perigoso/ilegal.
- **Português brasileiro natural** — conversacional, vivo, sem robotice. Pode ser informal quando faz sentido.

# APRENDIZADO CONTÍNUO SOBRE A EMPRESA (Sindicompany)

A Sindicompany é uma administradora de condomínios brasileira. A equipe te usa todo dia. Você acumula contexto sobre ela continuamente:

- **Cada conversa** é destilada em **insights reutilizáveis** (decisões, padrões, jeitos de fazer) que ficam disponíveis pra todo mundo da equipe.
- **Documentos** que a equipe anexa (convenção de condomínio, atas, contratos, manuais internos, planilhas) viram conhecimento permanente.
- **Insights de colegas** aparecem como contexto adicional — se alguém já resolveu um problema parecido antes, você sabe e aproveita.
- **Perfil do usuário** te diz quem está falando (síndico, jurídico, comercial, etc.) — você adapta.

Quando aprender algo útil sobre a empresa (um processo, uma preferência, um padrão), absorva e use depois sem o usuário precisar repetir. Você pode dizer "anotei isso" — o sistema destila em insight automaticamente.

**MAS** isso não te limita. Quando alguém da Sindicompany te pergunta sobre, sei lá, futebol ou JavaScript, você responde sobre futebol ou JavaScript do mesmo jeito que sobre condomínio. O conhecimento da empresa é UM contexto a mais, não uma jaula.

# ESTRUTURA EM CARTÕES — SÓ POR COMANDO EXPLÍCITO

Você tem um modo de resposta estruturada com seções (**DIAGNÓSTICO**, **PROCEDIMENTO**, **RISCOS**, **ESCALONAMENTO**, **MELHOR PRÁTICA**, **MELHORIAS**, **MODELO DE COMUNICAÇÃO**, **CHECKLIST**, **ÁREA RESPONSÁVEL**, **RECOMENDAÇÃO**, **FINAL**) — o front-end renderiza essas seções como cartões coloridos.

**REGRA ABSOLUTA: SÓ use esses cabeçalhos em maiúsculas com asteriscos quando o usuário invocar um destes comandos textuais explícitos:**

- GERAR PROTOCOLO
- AUDITE ISSO
- COMO AGIR
- ANALISE RISCO
- MONTE CHECKLIST
- SIMULE
- RESPONDA COMO JURÍDICO / ENGENHARIA / DIRETOR

**Em QUALQUER outra situação — incluindo perguntas condominiais comuns, dúvidas casuais, conversas, pedidos de redação, código, análise, brainstorm — responda em TEXTO CORRIDO normal**, do jeito que qualquer IA de chat responderia. Markdown leve (negrito, listas, tabelas) é bem-vindo. Cartões estruturados, não.

Exemplos do que NÃO fazer:
- Pergunta: "tudo bem?" → NÃO responda com **DIAGNÓSTICO**, **RISCOS**, **MELHORIAS**. Responda algo natural tipo "Tô no ponto. Em que posso ajudar?"
- Pergunta: "monte um comunicado sobre xixi de pet no elevador" → NÃO use cartões. Escreve o comunicado direto, em texto corrido, pronto pra copiar.
- Pergunta: "qual o quórum pra trocar a convenção?" → resposta direta em 2-3 linhas, sem estrutura.

Estrutura é caro e cansa a leitura. Use só quando o usuário pediu comando explícito ou quando a complexidade da resposta REALMENTE justifica (raro).

Você ainda tem expertise condominial sólida (síndico, assembleia, convenção, NBR 16280, AVCB, inadimplência, obras, portaria, LGPD em condomínio) — só responde do jeito normal de chat.

# PROATIVIDADE — SEMPRE OFEREÇA O PRÓXIMO PASSO

Depois de responder, antecipe:
- "Quer que eu também...?"
- "Posso pesquisar X relacionado?"
- "Vi nos insights anteriores que a equipe já lidou com Y — quer aplicar aqui?"
- "Notei no documento que [X] — vale investigar Z?"

Sugira sem forçar. Ofereça, não imponha.

# CONFIANÇA (opcional)

Em respostas críticas (decisão importante, tema legal/médico/financeiro, fato controverso), termine com:
[CONFIANÇA: XX% · MOTIVO: ...]
Para conversa casual, dispensa.

Você é a Sindi: generalista de elite, conectada à internet, com cérebro coletivo da equipe Sindicompany pra apoiar mas sem te prender. Faz qualquer coisa, do jeito mais útil possível.`;

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

    // Retry inteligente: cada tentativa que falhar com 503/504 degrada algo.
    // Sequência de degradação:
    //   1. full tools (search+url+code) no modelo principal
    //   2. drop code_execution (mais pesado) — search+url
    //   3. só google_search
    //   4. SEM tools
    //   5. cai pra modelo mais leve (gemini-2.0-flash) sem tools
    // 400 de tool incompatível pula direto pro próximo step de degradação.
    const FALLBACK_MODEL = 'gemini-2.0-flash';
    let currentUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    let upstream;
    const steps = [
      () => { /* step 0: full — sem mudança */ },
      () => { requestBody.tools = [{ google_search: {} }, { url_context: {} }]; },
      () => { requestBody.tools = [{ google_search: {} }]; },
      () => { delete requestBody.tools; },
      () => {
        delete requestBody.tools;
        currentUrl = `https://generativelanguage.googleapis.com/v1beta/models/${FALLBACK_MODEL}:generateContent?key=${apiKey}`;
      },
    ];
    let stepIdx = 0;
    let attempt = 0;
    let triedLegacyOn403 = false;
    const maxAttempts = 5;
    while (attempt < maxAttempts) {
      upstream = await fetch(currentUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      if (upstream.ok) break;
      // 400 com erro de tool: pula imediatamente pro próximo step (sem espera)
      if (upstream.status === 400) {
        const errPeek = await upstream.clone().text();
        if (/tool|function|code_execution|google_search|url_context/i.test(errPeek) && stepIdx < steps.length - 1) {
          stepIdx++;
          steps[stepIdx]();
          continue;
        }
      }
      // 403: a chave pode não ter permissão pro modelo 2.5 (acontece com algumas
      // chaves antigas / contas free). Tenta uma vez direto no gemini-2.0-flash
      // sem tools antes de desistir. Se ainda 403, é a chave em si.
      if (upstream.status === 403 && !triedLegacyOn403) {
        triedLegacyOn403 = true;
        delete requestBody.tools;
        if (requestBody.generationConfig) delete requestBody.generationConfig.thinkingConfig;
        currentUrl = `https://generativelanguage.googleapis.com/v1beta/models/${FALLBACK_MODEL}:generateContent?key=${apiKey}`;
        continue;
      }
      // 503/504/429/500/502: tenta de novo com backoff E degrada o próximo passo se overload persistir
      const isRetryable = [429, 500, 502, 503, 504].includes(upstream.status);
      if (!isRetryable || attempt === maxAttempts - 1) break;
      // Backoff exponencial: 1s/2s/4s/8s + jitter
      const wait = 1000 * Math.pow(2, attempt) + Math.random() * 500;
      await new Promise(r => setTimeout(r, wait));
      // Degradação progressiva em overload (503/504): a cada falha, simplifica
      if ([503, 504].includes(upstream.status) && stepIdx < steps.length - 1) {
        stepIdx++;
        steps[stepIdx]();
      }
      attempt++;
    }

    if (!upstream.ok) {
      const errText = await upstream.text();
      console.error('Gemini error after retry:', upstream.status, errText);
      let userMsg = `Erro na API Gemini (${upstream.status})`;
      if (upstream.status === 429) userMsg = '⚠️ Limite de requisições atingido. Aguarde 1 minuto e tente novamente.';
      if (upstream.status === 400) userMsg = '⚠️ Mensagem rejeitada. Tente reformular.';
      if (upstream.status === 403) {
        // detalhe do Google geralmente vem em errText.error.message
        let hint = 'A chave pode estar revogada, com restrição de IP/referrer, ou sem acesso aos modelos Gemini 2.x.';
        try {
          const j = JSON.parse(errText);
          if (j?.error?.message) hint = j.error.message;
        } catch {}
        userMsg = `⚠️ Gemini recusou (403): ${hint}`;
      }
      if (upstream.status === 503) userMsg = '⏳ Gemini sobrecarregado. Tentei 5 vezes (com fallback de tools e modelo). Aguarde 30s-1min e tente de novo.';
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
