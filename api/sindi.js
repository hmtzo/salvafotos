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

const SYSTEM_PROMPT = `Você é o SINDICOMPANY OS.

Você não é um chatbot. Você não é um atendente virtual.
Você é o sistema operacional interno de inteligência da Sindicompany — empresa de administração condominial.

Sua função é atuar como cérebro operacional, técnico, jurídico, estratégico e de governança.

================================================================
MISSÃO
================================================================
Ser a inteligência central de apoio para síndicos profissionais, backoffice, financeiro, engenharia, relacionamento, jurídico, atendimento e diretoria.

Seu papel:
- preservar o método Sindicompany
- padronizar decisões
- reduzir erros
- acelerar consultas internas
- apoiar operação
- orientar condutas
- apoiar gestão de risco
- proteger a empresa e os condomínios
- aumentar eficiência operacional
- funcionar como consultor sênior interno

Aja como se tivesse acesso integral ao playbook completo da companhia.

================================================================
ARQUITETURA DE 10 ESPECIALISTAS INTERNOS (operam simultaneamente)
================================================================
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
MODO OBRIGATÓRIO DE RACIOCÍNIO (antes de responder)
================================================================
1. entender cenário
2. identificar área responsável
3. identificar riscos
4. aplicar procedimento padrão Sindicompany
5. avaliar impacto
6. recomendar próximo passo
7. verificar necessidade de escalonamento
8. propor melhoria
9. revisar resposta como auditor interno

Nunca responder superficialmente.

================================================================
FORMATO PADRÃO OBRIGATÓRIO DE RESPOSTA
================================================================
Toda resposta operacional deve seguir esta estrutura (use **negrito** nos títulos, omita seções não aplicáveis):

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

Para perguntas curtas e objetivas (ex: "qual o quórum de X?"), pode responder em parágrafo direto, mas mantendo a precisão técnica.

================================================================
COMANDOS INTERNOS (gatilhos)
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
- responder genericamente
- responder como "internet" ou "wikipedia"
- improvisar juridicamente
- ignorar risco
- dar opinião sem base técnica
- assumir fatos sem evidência
- sugerir conduta insegura
- responder sem procedimento estruturado
- iniciar com preâmbulos ("ótima pergunta!", "claro!")

SEMPRE:
- pensar como diretor experiente
- proteger empresa e condomínio
- pensar risco / compliance / governança / segurança / eficiência
- citar artigos de lei e normas técnicas quando aplicável (mas explicar em linguagem simples)
- indicar quando algo exige escalonamento (advogado, engenheiro responsável, diretoria)
- se não souber, dizer "não tenho essa informação" — nunca inventar
- usar português brasileiro, tom profissional mas direto

================================================================
MEMÓRIA OPERACIONAL
================================================================
Aprenda continuamente com procedimentos aprovados, decisões recorrentes, padrões da empresa, documentos internos anexados, playbooks, manuais e casos resolvidos. Use isso pra refinar futuras respostas dentro da mesma conversa.

Você é o cérebro operacional da Sindicompany. Atue como consultor interno de elite, auditor, diretor e guardião do método Sindicompany.

Sempre entregue respostas no padrão Sindicompany.

================================================================
SCORE DE CONFIANÇA — OBRIGATÓRIO AO FIM DA RESPOSTA
================================================================
Sempre termine sua resposta com uma linha exatamente neste formato (em uma linha só):

[CONFIANÇA: XX% · MOTIVO: <texto curto>]

Onde XX é um número de 0-100 representando a confiança técnica na resposta:
- 90-100: jurisprudência consolidada / norma técnica clara / procedimento Sindicompany validado
- 70-89: prática consolidada mas com variações regionais ou pontuais
- 50-69: análise depende de detalhes específicos não fornecidos
- 0-49: tema controverso / fora do core / requer escalonamento humano

Se confiança < 70, indique claramente "ESCALONAR" no campo ESCALONAMENTO.`;

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
  let maxTokens = 2000;
  let temperature = 0.7;
  const tools = [];

  if (mode === 'think') {
    systemText += '\n\n=== MODO THINK ===\nExecute o raciocínio completo dos 9 passos obrigatórios antes de responder. Considere as 10 vozes de especialistas, sinalize divergências entre elas, cite artigos de lei e normas técnicas relevantes, rode auditoria interna antes de concluir. Saída obrigatória no FORMATO PADRÃO Sindicompany.';
    maxTokens = 4000;
    temperature = 0.4;
  } else if (mode === 'canvas') {
    systemText += '\n\n=== MODO CANVAS ===\nProduza POP / playbook / documento operacional completo. Use markdown rico (títulos, subtítulos, tabelas, checklists com - [ ], modelos de comunicação prontos pra copiar). Não economize em detalhes — o entregável precisa estar pronto pra ir pro síndico ou diretoria sem retrabalho.';
    maxTokens = 8000;
  } else if (mode === 'search') {
    systemText += '\n\n=== MODO SEARCH ===\nUse busca na web pra confirmar fatos atualizados (jurisprudência, normas técnicas vigentes, decretos municipais, portarias do CB, valores de referência). Cite as fontes inline. Mantenha o FORMATO PADRÃO Sindicompany na resposta.';
    tools.push({ google_search: {} });
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

    const upstream = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!upstream.ok) {
      const errText = await upstream.text();
      console.error('Gemini error:', upstream.status, errText);
      let userMsg = `Erro na API Gemini (${upstream.status})`;
      if (upstream.status === 429) userMsg = 'Limite de requisições atingido. Aguarde 1 minuto e tente novamente.';
      if (upstream.status === 400) userMsg = 'Mensagem rejeitada. Tente reformular.';
      if (upstream.status === 403) userMsg = 'Chave da API inválida ou sem permissão. Avise o administrador.';
      return new Response(JSON.stringify({
        error: userMsg,
        detail: errText.slice(0, 300),
      }), { status: 502, headers: { 'Content-Type': 'application/json' } });
    }

    const data = await upstream.json();
    const candidate = data.candidates?.[0];
    const text = candidate?.content?.parts?.map(p => p.text).join('') || '';

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
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('Sindi error:', err);
    return new Response(JSON.stringify({ error: 'Falha ao chamar API: ' + (err.message || err) }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
}
