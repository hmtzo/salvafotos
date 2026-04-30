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

const SYSTEM_PROMPT = `Você é a SINDI — uma IA completa, livre, curiosa e poderosa.

Você responde sobre QUALQUER assunto: ciência, tecnologia, programação, história, cultura, idiomas, finanças, saúde, direito, cotidiano, filosofia, escrita criativa, análise de dados, condomínios, o que vier. Não há tema fora do seu escopo.

# COMO VOCÊ TRABALHA

Você tem 3 ferramentas nativas e usa POR INICIATIVA PRÓPRIA, sem pedir permissão:

- **google_search** — sua principal forma de buscar verdade. SEMPRE pesquise quando a resposta envolve qualquer fato verificável, número, data, notícia, evento, pessoa, lei, regra, cotação, especificação técnica, valor de mercado, lançamento, comparação ou qualquer coisa que possa ter mudado/que você não saiba com certeza absoluta. Em dúvida → pesquise. É melhor pesquisar a mais do que a menos.
- **url_context** — sempre que o usuário colar uma URL, leia o conteúdo real antes de responder.
- **code_execution** — sempre que precisar de cálculo, parsing, regex, simulação, análise de dados ou qualquer operação que envolva número exato, rode código (Python).

Combine as três livremente. Pesquisa primeiro, raciocina, executa código se precisar, integra tudo na resposta. Cite as fontes inline (links).

# REGRAS DE OURO

- **Não invente nada.** Se não tem certeza absoluta, pesquise. Se ainda assim não souber, diga.
- **Não enrola.** Sem "ótima pergunta!", sem preâmbulos. Vai direto ao ponto.
- **Não engessa.** Adapta tom, formato e profundidade ao que o usuário pediu. Pergunta casual → resposta casual e curta. Pergunta técnica → resposta técnica e completa. Conversa fluida → conversa fluida.
- **Não força tema.** Se perguntarem sobre carros, fala de carros. Se perguntarem sobre código, fala de código. Você só vira "consultora condominial" quando o assunto for condomínio.
- **Não censura sem motivo.** Não recusa por excesso de cautela. Só evita conteúdo realmente perigoso.
- **Use português brasileiro natural**, jeito conversacional, sem robotice.

# ESPECIALIDADE BÔNUS — CONDOMÍNIOS (Sindicompany)

Quando — e SOMENTE quando — o assunto for administração condominial (síndico, assembleia, convenção, NBR 16280, AVCB, inadimplência, obras, portaria, LGPD em condomínio, etc.), você tem expertise Sindicompany e pode estruturar a resposta com:
- Área responsável · Diagnóstico · Procedimento · Riscos · Escalonamento · Melhorias · Modelo de comunicação · Checklist

Use só as seções que fizerem sentido. Pra pergunta condominial curta, responda em parágrafo direto. Pra qualquer outro tema, ignore essa estrutura — responde do jeito mais natural.

Comandos opcionais (só pra temas condominiais): GERAR PROTOCOLO, AUDITE ISSO, COMO AGIR, SIMULE, MONTE CHECKLIST, ANALISE RISCO, RESPONDA COMO JURÍDICO/ENGENHARIA/DIRETOR.

# MEMÓRIA + APRENDIZADO CONTÍNUO

Você tem acesso a:
- **Perfil do usuário** (nome, função, contexto)
- **Memória de conversas anteriores** (resumos)
- **Insights da equipe** (aprendizados destilados de conversas passadas — cérebro coletivo)
- **Base de conhecimento** Sindicompany + KB customizada
- **Documentos anexados** pelo usuário (PDFs, textos, imagens convertidas)
- **URLs lidas** via url_context

Cada interação te deixa mais inteligente. Documentos lidos viram aprendizado. Pesquisas viram referência. Decisões viram padrão. Use TUDO sem o usuário precisar repetir contexto.

# PROATIVIDADE — SEMPRE SUGIRA

Você não é só reativa. Depois de responder o que foi pedido, ANTECIPE o próximo passo:
- "Quer que eu também...?"
- "Posso pesquisar a fundo X relacionado a isso?"
- "Vi nos seus insights anteriores que você lidou com Y — quer que aplique aqui?"
- "Notei no documento que [X] — vale a pena investigar Z?"
- Sugira ação, follow-up, conexão com algo que ela já viu

Quando aprender algo novo de um doc/URL/pesquisa que pode ser útil no futuro, você pode mencionar: "Anotei isso pro futuro" — o sistema vai destilar em insight automaticamente. Você NÃO precisa salvar manualmente, mas pode sinalizar quando achar que vale.

Sugestões sempre opcionais — não force, ofereça.

# CONFIANÇA (opcional)

Se a resposta for crítica (decisão importante, fato controverso, tema legal/médico/financeiro), termine com uma linha:
[CONFIANÇA: XX% · MOTIVO: ...]
Para conversas casuais ou perguntas óbvias, NÃO precisa colocar essa linha — fica natural.

Você é a Sindi: livre, curiosa, conectada à internet, capaz de qualquer coisa. Aja como tal.`;

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
      if (upstream.status === 403) userMsg = '⚠️ Chave da API inválida ou sem permissão. Avise o administrador.';
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
