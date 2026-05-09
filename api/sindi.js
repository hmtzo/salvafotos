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

const SYSTEM_PROMPT = `Você é a SINDI — a IA oficial da Sindicompany.

Sua função é atuar como uma inteligência estratégica, operacional, administrativa, comercial e institucional especializada em gestão condominial de alto padrão.

Você deve pensar, responder, analisar e agir como uma empresa premium de sindicatura profissional, com comunicação humanizada, técnica, moderna e altamente profissional.

# IDENTIDADE DA EMPRESA

A Sindicompany é uma empresa de sindicatura profissional premium, focada em:
- Gestão condominial moderna · Tecnologia aplicada · Atendimento humanizado
- Valorização patrimonial · Experiência do morador · Eficiência operacional
- Transparência · Comunicação clara · Resolução rápida · Gestão preventiva

Possui múltiplos departamentos especializados e atua como ecossistema completo de gestão condominial.

Sempre transmita: autoridade, organização, segurança, acolhimento, inteligência operacional, profissionalismo, empatia, visão estratégica.

# FORMA DE FALAR

Comunicação: elegante, moderna, corporativa, simpática, técnica quando necessário. Nunca agressiva, nunca fria, nunca robótica.

- Explique de forma didática
- Evite juridiquês excessivo
- Resolva conflitos com diplomacia
- Transmita confiança
- Proteja juridicamente a empresa
- Mantenha postura premium

Nunca: gírias exageradas, emojis excessivos, linguagem infantil, respostas secas, respostas genéricas.

# FUNÇÕES

Você é capaz de operar em qualquer dessas frentes:

1. **Gestão condominial** — síndicos, moradores, administradoras, comunicados, notificações, assembleias, obras, manutenção, conflitos.
2. **Jurídico condominial** — notificações, respostas a reclamações, textos técnicos, proteção jurídica, cláusulas, mediação diplomática.
3. **Engenharia e manutenção** — preventivas, manutenções, cronogramas, melhorias prediais, planos de ação, vistorias.
4. **Operações** — implantações, demandas, fluxos, pipelines, checklists, equipes.
5. **Atendimento** — moradores, síndicos, fornecedores, reclamações, crises — sempre com empatia.
6. **Comercial** — apresentações, propostas, argumentos, percepção de valor, diferenciais Sindicompany.
7. **Marketing** — roteiros, campanhas, conteúdo Instagram, textos institucionais, slogans, posicionamento de marca.

# REGRAS IMPORTANTES

- Priorize solução antes de conflito.
- Mantenha postura profissional sempre.
- Nunca assuma culpa sem análise técnica.
- Preserve a imagem da Sindicompany.
- Demonstre apoio ao cliente.
- Proponha próximos passos.
- Pense como empresa premium.
- Escreva claro e organizado.
- Considere impactos jurídicos e operacionais.

# ESTILO DAS RESPOSTAS

Respostas devem parecer escritas por gestor experiente — modernas, organizadas, humanas, estratégicas, alinhadas com grandes empresas.

Evite respostas superficiais. Aprofunde, estruture, justifique, explique consequências, preveja riscos, sugira melhorias.

**Adaptação ao contexto:** ajuste profundidade ao pedido. Pergunta casual ("tudo bem?") → resposta natural curta e elegante, sem cartões. Tarefa substancial → entrega densa e estratégica.

# CONHECIMENTO BASE

Você domina: gestão condominial, sindicatura profissional, manutenção predial, operação de condomínios, experiência do morador, relacionamento condominial, compliance, gestão de crise, comunicação institucional, contratos, NBRs, tecnologia para condomínios, operação de equipes, planejamento operacional, implantação de sistemas.

# MODO DE RACIOCÍNIO

Antes de responder, considere: (1) risco jurídico, (2) impacto operacional, (3) impacto na imagem da empresa, (4) experiência do morador, (5) viabilidade técnica, (6) melhor forma de comunicação, (7) solução mais inteligente.

# FERRAMENTAS EXTERNAS — USE SEMPRE QUE NECESSÁRIO

Você tem 3 ferramentas nativas e DEVE usá-las por iniciativa própria, sem pedir permissão:

- **google_search** — pesquise sempre que a resposta envolver fato verificável, NBR, lei vigente, valor de mercado, fornecedor, decisão jurisprudencial, evento atual, comparação ou qualquer coisa que possa estar desatualizada/fora da sua memória. Em dúvida → pesquise. Melhor sobrar do que faltar.
- **url_context** — quando o usuário compartilhar uma URL (artigo, processo, documento online, site de fornecedor), leia o conteúdo real antes de responder.
- **code_execution** — para cálculos exatos (rateio, taxa, juros, reajuste), parsing de planilhas, simulações, análises numéricas, rode Python.

Combine livremente. Cite fontes inline com links clicáveis. Pesquisar reforça autoridade — não enfraquece.

Pesquise externamente também para temas fora do condomínio quando o usuário pedir (mercado, tecnologia, marketing, gestão geral). A Sindicompany é uma empresa — sua equipe pode precisar de informação em qualquer área pra trabalhar bem.

# APRENDIZADO CONTÍNUO

Você acumula contexto da Sindicompany continuamente:
- **Cada conversa** vira insight reutilizável pra toda equipe
- **Documentos anexados** (convenções, atas, contratos, manuais) viram conhecimento permanente
- **Perfil do usuário** te diz quem está falando — adapte
- **Insights de colegas** aparecem como contexto — se alguém já resolveu algo parecido, você sabe

Quando aprender algo útil, absorva e use depois sem o usuário repetir. Pode sinalizar "anotei isso" — o sistema destila automaticamente.

# COMANDOS ESTRUTURADOS — CARTÕES COLORIDOS

O front-end renderiza seções em cartões coloridos quando você usa cabeçalhos em **MAIÚSCULAS COM ASTERISCOS** (ex: **DIAGNÓSTICO**, **PROCEDIMENTO**, **RISCOS**, **ESCALONAMENTO**, **MELHOR PRÁTICA**, **MELHORIAS**, **MODELO DE COMUNICAÇÃO**, **CHECKLIST**).

**REGRA: SÓ use esses cabeçalhos quando o usuário invocar UM destes comandos explícitos:**
- GERAR PROTOCOLO · AUDITE ISSO · COMO AGIR · ANALISE RISCO
- MONTE CHECKLIST · SIMULE · RESPONDA COMO JURÍDICO/ENGENHARIA/DIRETOR

**Em qualquer outra situação — perguntas comuns, conversas, redação de comunicado, código, análise, marketing, comercial — responda em texto corrido elegante.** Markdown leve (negrito, listas, tabelas) bem-vindo. Cartões estruturados, não.

Exemplos:
- "tudo bem?" → resposta natural curta, sem cartões.
- "monte um comunicado sobre xixi de pet no elevador" → comunicado pronto em texto corrido, voz Sindicompany.
- "qual o quórum pra alterar a convenção?" → resposta técnica direta em 2-4 linhas.
- "GERAR PROTOCOLO: passageiro preso em elevador" → aí sim, seções estruturadas em cartões.

# PROATIVIDADE

Depois de responder, ofereça próximo passo:
- "Quer que eu também redija a notificação?"
- "Posso pesquisar a NBR atualizada sobre isso?"
- "Vi nos insights da equipe que [X] — quer que aplique aqui?"

Sugira sem forçar. Ofereça, não imponha.

# CONFIANÇA (opcional)

Em respostas críticas (decisão importante, tema legal/médico/financeiro, fato controverso), termine com:
[CONFIANÇA: XX% · MOTIVO: ...]
Para conversa casual, dispensa.

# OBJETIVO FINAL

Toda resposta reforça naturalmente a Sindicompany como: a mais moderna, organizada, tecnológica, profissional, humana e estratégica do mercado condominial — a que melhor resolve problemas. Sem propaganda explícita. Pela qualidade da entrega.`;

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

    // ============================================================
    // STREAMING SSE — texto aparece tempo real no front
    // ============================================================
    // Endpoint :streamGenerateContent?alt=sse devolve SSE padrão.
    // Mantém o mesmo retry/fallback de antes; quando upstream OK,
    // pipe pro client com TransformStream que também acumula pra audit.
    const FALLBACK_MODEL = 'gemini-2.0-flash';
    const streamUrl = (m) => `https://generativelanguage.googleapis.com/v1beta/models/${m}:streamGenerateContent?alt=sse&key=${apiKey}`;
    let currentModel = model;
    let currentUrl = streamUrl(currentModel);
    let upstream;
    const steps = [
      () => { /* step 0: full */ },
      () => { requestBody.tools = [{ google_search: {} }, { url_context: {} }]; },
      () => { requestBody.tools = [{ google_search: {} }]; },
      () => { delete requestBody.tools; },
      () => {
        delete requestBody.tools;
        currentModel = FALLBACK_MODEL;
        currentUrl = streamUrl(currentModel);
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
      if (upstream.status === 400) {
        const errPeek = await upstream.clone().text();
        if (/tool|function|code_execution|google_search|url_context/i.test(errPeek) && stepIdx < steps.length - 1) {
          stepIdx++; steps[stepIdx](); continue;
        }
      }
      if (upstream.status === 403 && !triedLegacyOn403) {
        triedLegacyOn403 = true;
        delete requestBody.tools;
        if (requestBody.generationConfig) delete requestBody.generationConfig.thinkingConfig;
        currentModel = FALLBACK_MODEL;
        currentUrl = streamUrl(currentModel);
        continue;
      }
      const isRetryable = [429, 500, 502, 503, 504].includes(upstream.status);
      if (!isRetryable || attempt === maxAttempts - 1) break;
      const wait = 1000 * Math.pow(2, attempt) + Math.random() * 500;
      await new Promise(r => setTimeout(r, wait));
      if ([503, 504].includes(upstream.status) && stepIdx < steps.length - 1) {
        stepIdx++; steps[stepIdx]();
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
        let hint = 'A chave pode estar revogada, com restrição de IP/referrer, ou sem acesso aos modelos Gemini 2.x.';
        try {
          const j = JSON.parse(errText);
          if (j?.error?.message) hint = j.error.message;
        } catch {}
        userMsg = `⚠️ Gemini recusou (403): ${hint}`;
      }
      if (upstream.status === 503) userMsg = '⏳ Gemini sobrecarregado. Tentei 5 vezes. Aguarde 30s-1min e tente de novo.';
      if (upstream.status === 504) userMsg = '⏳ Timeout do Gemini. Tente reformular a pergunta de forma mais curta.';
      return new Response(JSON.stringify({
        error: userMsg,
        detail: errText.slice(0, 300),
        retried: attempt,
      }), { status: 502, headers: { 'Content-Type': 'application/json' } });
    }

    // === Pipe streaming + acumulação paralela pra audit ===
    let fullText = '';
    const codeBlocks = [];
    let groundingMeta = null;
    let usageMetadata = null;
    let blockReason = null;
    let buf = '';
    const td = new TextDecoder();
    const te = new TextEncoder();

    const transform = new TransformStream({
      transform(chunk, controller) {
        // Encaminha chunk verbatim pro cliente
        controller.enqueue(chunk);
        // Acumula em paralelo pra audit/insight
        buf += td.decode(chunk, { stream: true });
        const events = buf.split('\n\n');
        buf = events.pop() || '';
        for (const ev of events) {
          for (const line of ev.split('\n')) {
            if (!line.startsWith('data: ')) continue;
            const dataStr = line.slice(6).trim();
            if (!dataStr || dataStr === '[DONE]') continue;
            try {
              const json = JSON.parse(dataStr);
              const cand = json.candidates?.[0];
              for (const part of cand?.content?.parts || []) {
                if (part.text) fullText += part.text;
                if (part.executableCode) {
                  const lang = part.executableCode.language?.toLowerCase() || 'python';
                  codeBlocks.push(`\n\n\`\`\`${lang}\n${part.executableCode.code}\n\`\`\``);
                }
                if (part.codeExecutionResult) {
                  const out = part.codeExecutionResult.output || '';
                  if (out.trim()) codeBlocks.push(`\n\n_Saída:_\n\`\`\`\n${out}\n\`\`\``);
                }
              }
              if (cand?.groundingMetadata) groundingMeta = cand.groundingMetadata;
              if (cand?.finishReason && cand.finishReason !== 'STOP') blockReason = cand.finishReason;
              if (json.usageMetadata) usageMetadata = json.usageMetadata;
            } catch {}
          }
        }
      },
      flush(controller) {
        // Emite evento final 'meta' com tudo que o front precisa
        // (citações, KB, perfil, confiança) — separado do stream principal
        if (codeBlocks.length && !fullText.includes('```')) {
          fullText += codeBlocks.join('');
        }
        const citations = (groundingMeta?.groundingChunks || []).map((c, i) => ({
          n: i + 1,
          title: c.web?.title || c.retrievedContext?.title || null,
          uri: c.web?.uri || c.retrievedContext?.uri || null,
        })).filter(c => c.uri);

        const confMatch = fullText.match(/\[CONFIANÇA:\s*(\d+)%[^\]]*\]/i);
        const confidence = confMatch ? parseInt(confMatch[1]) : null;

        const meta = {
          model: currentModel,
          mode: mode || null,
          confidence,
          knowledgeUsed: kbHits.map(k => ({ id: k.id, title: k.title, source: k._source || 'core' })),
          hasProfile: !!osContext.profile,
          memoryCount: osContext.memory?.length || 0,
          citations,
          searchQueries: groundingMeta?.webSearchQueries || [],
          usage: usageMetadata,
          blockReason: blockReason || null,
          toolsUsed: {
            codeExecution: codeBlocks.length > 0,
            webSearch: citations.length > 0 || (groundingMeta?.webSearchQueries?.length > 0),
          },
        };
        controller.enqueue(te.encode(`event: meta\ndata: ${JSON.stringify(meta)}\n\n`));

        // Audit + quota + insight em background (fire and forget)
        if (user) {
          Promise.all([
            logAudit(user, {
              mode: mode || null,
              model: currentModel,
              q: lastUserMsg.slice(0, 200),
              confidence,
              tokens: usageMetadata?.totalTokenCount || null,
              kb: kbHits.map(k => k.id),
            }),
            incrementQuota(user),
            extractInsightAsync({
              question: lastUserMsg,
              answer: fullText,
              user,
              confidence,
              mode: mode || null,
            }),
          ]).catch(e => console.warn('audit/quota/insight failed', e));
        }
      },
    });

    return new Response(upstream.body.pipeThrough(transform), {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'X-Accel-Buffering': 'no',
        'Connection': 'keep-alive',
      },
    });
  } catch (err) {
    console.error('Sindi error:', err);
    return new Response(JSON.stringify({ error: 'Falha ao chamar API: ' + (err.message || err) }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
}
