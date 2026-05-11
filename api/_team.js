// =====================================================================
// TEAM — fonte única da equipe Sindicompany
// =====================================================================
// Importado por todas as APIs/tools que precisam saber quem é quem.
// Cobre os 24 emails que aparecem no middleware + ADMIN_USERS + emails
// pessoais de admin (hmtzo@icloud.com).
//
// Estrutura: TEAM = [{ email, name, role, area, active, isAdmin }]
//   - active: aparece na lista padrão de chat / equipe
//   - área: pra agrupamento (Atendimento, Operacional, etc)
// =====================================================================

export const TEAM = [
  // === Pessoas (com perfil completo) ===
  { email: 'juliana@sindicompany.com.br',           name: 'Juliana',           role: 'CEO',                          area: 'Diretoria',   active: true },
  { email: 'luciane@sindicompany.com.br',           name: 'Luciane',           role: 'Agilista',                     area: 'Diretoria',   active: true, isAdmin: true },
  { email: 'luciane.barco@sindicompany.com.br',     name: 'Luciane Barco',     role: 'Diretoria',                    area: 'Diretoria',   active: true, isAdmin: true },
  { email: 'raquel@sindicompany.com.br',            name: 'Raquel Moura',      role: 'Head de Pessoas e Cultura',    area: 'RH',          active: true },
  { email: 'mkt@sindicompany.com.br',               name: 'Heitor',            role: 'Head de Tecnologia',           area: 'Marketing',   active: true, isAdmin: true },
  { email: 'junior@sindicompany.com.br',            name: 'Rommel Júnior',     role: 'Coordenador de Atendimento',   area: 'Atendimento', active: true },
  { email: 'felipe.fernandes@sindicompany.com.br',  name: 'Felipe Fernandes',  role: 'Analista Financeiro',          area: 'Financeiro',  active: true },
  { email: 'comercial@sindicompany.com.br',         name: 'Hellen',            role: 'Comercial',                    area: 'Comercial',   active: true },
  { email: 'orcamentos@sindicompany.com.br',        name: 'Eduardo Ribeiro',   role: 'Orçamentos',                   area: 'Orçamentos',  active: true },
  { email: 'orcamento@sindicompany.com.br',         name: 'equipe Orçamentos', role: 'Caixa de área',                area: 'Orçamentos',  active: true },
  { email: 'engenharia@sindicompany.com.br',        name: 'Vitor Porto',       role: 'Engenharia',                   area: 'Engenharia',  active: true },
  { email: 'engenharia1@sindicompany.com.br',       name: 'Vitor Porto',       role: 'Engenharia · canal 1',         area: 'Engenharia',  active: true },
  { email: 'engenharia2@sindicompany.com.br',       name: 'Vitor Porto',       role: 'Engenharia · canal 2',         area: 'Engenharia',  active: false },
  { email: 'amanda@sindicompany.com.br',            name: 'Amanda Queiroz',    role: 'Atendimento',                  area: 'Atendimento', active: true },
  { email: 'isabella@sindicompany.com.br',          name: 'Isabella Nascimento', role: 'Atendimento',                area: 'Atendimento', active: true },
  { email: 'marcia@sindicompany.com.br',            name: 'Márcia',            role: 'Atendimento',                  area: 'Atendimento', active: true },
  { email: 'rose@sindicompany.com.br',              name: 'Rose Brandão',      role: 'Atendimento',                  area: 'Atendimento', active: true },
  { email: 'atendimento@sindicompany.com.br',       name: 'equipe SAC',        role: 'Caixa SAC',                    area: 'Atendimento', active: true },
  { email: 'atendimento2@sindicompany.com.br',      name: 'Henrique Nogueira', role: 'Atendimento',                  area: 'Atendimento', active: true },
  { email: 'corina@sindicompany.com.br',            name: 'Corina Abreu',      role: 'Gestão',                       area: 'Gestão',      active: true },
  { email: 'diego@sindicompany.com.br',             name: 'Diego Leite',       role: 'Operacional',                  area: 'Operacional', active: true },
  { email: 'eduardo@sindicompany.com.br',           name: 'Eduardo',           role: 'Operacional',                  area: 'Operacional', active: true },
  { email: 'marcio@sindicompany.com.br',            name: 'Marcio Reis',       role: 'Operacional',                  area: 'Operacional', active: true },
  { email: 'miriam@sindicompany.com.br',            name: 'Miriam Diamantino', role: 'Gestão',                       area: 'Gestão',      active: true },
  { email: 'operacional@sindicompany.com.br',       name: 'equipe Operacional',role: 'Caixa de área',                area: 'Operacional', active: true },
  { email: 'operacional2@sindicompany.com.br',      name: 'Bruno',             role: 'Operacional',                  area: 'Operacional', active: true },
  { email: 'operacional3@sindicompany.com.br',      name: 'Silvanio',          role: 'Operacional',                  area: 'Operacional', active: true },
  { email: 'arquitetura@sindicompany.com.br',       name: 'equipe Arquitetura',role: 'Caixa de área',                area: 'Arquitetura', active: true },
  { email: 'contasapagar@sindicompany.com.br',      name: 'equipe Contas a Pagar', role: 'Caixa de área',            area: 'Financeiro',  active: true },
  { email: 'jornal@sindicompany.com.br',            name: 'equipe Mídias',     role: 'Mídias / Jornal',              area: 'Marketing',   active: true },
  // === Admin pessoal (não passa pelo middleware padrão) ===
  { email: 'hmtzo@icloud.com',                      name: 'Heitor',            role: 'Admin',                        area: 'Tecnologia',  active: true, isAdmin: true },
];

export const TEAM_EMAILS = TEAM.filter(t => t.active && t.email.endsWith('@sindicompany.com.br')).map(t => t.email);
export const ALL_USERS = TEAM.map(t => t.email);
export const TEAM_BY_EMAIL = Object.fromEntries(TEAM.map(t => [t.email, t]));
export const ADMIN_EMAILS = TEAM.filter(t => t.isAdmin).map(t => t.email);

export function teamMember(email) {
  return TEAM_BY_EMAIL[String(email || '').toLowerCase()] || null;
}

export function teamName(email) {
  return teamMember(email)?.name || String(email || '').split('@')[0];
}

export function teamRole(email) {
  return teamMember(email)?.role || null;
}
