# Design System Base: Avisus

## Visão Geral
Este guia reflete a versão atual do protótipo, já com os ajustes aplicados em interface, tema, componentes e comportamento.

Objetivo visual da marca Avisus:
- rapidez (detecção de oportunidades em tempo real)
- confiança (dados claros para decisão)
- modernidade (produto digital com linguagem limpa)

---

## 1. Identidade de Marca

### 1.1 Paleta Base (derivada da logo)
As cores principais foram atualizadas para seguir a logo oficial.

| Token | Hex | Uso principal |
| :-- | :-- | :-- |
| `--brand-navy` | `#1B2E63` | ação primária, links ativos, ênfase institucional |
| `--brand-navy-deep` | `#14254F` | texto forte, contraste em superfícies claras |
| `--brand-teal` | `#1D8F95` | informação, estado neutro positivo, destaque secundário |
| `--brand-lime` | `#B7DB47` | sucesso, ganhos, qualidade alta |
| `--brand-purple` | `#7B42C9` | destaque analítico, variação visual controlada |

### 1.2 Mapeamento Semântico
| Semântica | Token |
| :-- | :-- |
| Acento principal | `--accent: var(--brand-navy)` |
| Acento secundário | `--accent-light: var(--brand-teal)` |
| Acento escuro | `--accent-dark: var(--brand-navy-deep)` |
| Sucesso | `--success: var(--brand-lime)` |
| Aviso | `--warning: var(--brand-purple)` |
| Erro | `--danger: #D94B64` |
| Informação | `--info: var(--brand-teal)` |

### 1.3 Neutros (Light)
| Token | Valor |
| :-- | :-- |
| `--bg` | `#F4F7FB` |
| `--card` | `#FFFFFF` |
| `--border` | `#CCD5E3` |
| `--text-1` | `#152243` |
| `--text-2` | `#3A4B70` |
| `--text-3` | `#6C7A97` |

### 1.4 Neutros (Dark)
| Token | Valor |
| :-- | :-- |
| `--bg` | `#0C142A` |
| `--card` | `#111D34` |
| `--border` | `rgba(107,130,174,0.34)` |
| `--text-1` | `#E0E8FA` |
| `--text-2` | `#C2CFEA` |
| `--text-3` | `#90A3C7` |

---

## 2. Tipografia

### 2.1 Fonte Oficial
- Fonte principal: **Montserrat**
- Aplicação atual:
  - `--font-display: 'Montserrat', sans-serif`
  - `--font-body: 'Montserrat', sans-serif`
  - `--font-mono: 'Montserrat', sans-serif` (no protótipo)

### 2.2 Escala recomendada
| Hierarquia | Tamanho | Peso |
| :-- | :-- | :-- |
| H1 | 40px | 700 |
| H2 | 32px | 600 |
| H3 | 24px | 600 |
| H4 | 20px | 500 |
| Corpo | 16px | 400 |
| Corpo pequeno | 14px | 400 |
| Caption | 12px | 400 |
| Botão | 14-16px | 600-700 |

---

## 3. Iconografia

- Padrão adotado: **ícones SVG outline** (estilo consistente com produto de dados).
- Implementação centralizada no componente `AppIcon`.
- Regra: evitar emoji como ícone funcional.
- Uso: navegação, métricas, filtros, alertas, estados de item, ações e badges.

---

## 4. Componentes e Padrões Aplicados

### 4.1 Cards de Resumo (Dashboard)
- Seção "Resumo em tempo real" sem gradientes.
- Cards com cor semântica sólida por KPI.
- Etiquetas de tendência com contraste reforçado (especialmente "acima da meta").

### 4.2 Filtros Inteligentes
- Card colapsável (expandir/recolher).
- Botão de expandir na última posição da barra de ações.
- Chips de marketplace com logo.
- Estado fechado para dar destaque aos produtos.

### 4.3 Histórico de Preços
- Card colapsável.
- Resumo compacto quando fechado.
- Gráfico detalhado somente expandido.

### 4.4 Interesses
- Estrutura modernizada com:
  - cards de status (Ativos, Limite atual, Cobertura) com cor semântica
  - validação de duplicidade
  - feedback de limite do plano
  - lista com ativos priorizados
  - microinterações de hover e entrada em cascata

### 4.5 Alertas
- Cards de status no topo (Novos, Limite diário, Cobertura).
- Cores semânticas iguais ao padrão da seção Interesses.
- Filtro "Somente não compradas".

### 4.6 Card de Produto
- Sem gradiente estrutural no card.
- Logo do marketplace no selo superior.
- CTA com cor sólida e hierarquia clara.
- Estado "Comprada" destacado com feedback visual.

---

## 5. Imagens e Carregamento

- Imagens de produto são locais (`public/assets/products`).
- Logos de marketplaces em `public/assets/marketplaces`.
- Efeito de carregamento com **image skeleton + shimmer** nos cards de produto.

---

## 6. Diretrizes de UI/UX (estado atual)

- Priorizar legibilidade: remover excessos visuais que competem com dados.
- Reduzir ruído: sem gradientes em cards de conteúdo principal.
- Usar cor para hierarquia e estado, não como decoração.
- Permitir escaneabilidade rápida em mobile (cards compactos + ações claras).
- Preservar consistência de spacing, borda e raio entre seções.

---

## 7. Acessibilidade

- Garantir contraste mínimo WCAG (4.5:1 em texto normal).
- Estado não depende só de cor: usar ícone + texto para status.
- Alvos de toque com área confortável em botões/toggles.
- Texto de apoio curto e claro para reduzir carga cognitiva.

---

## 8. Checklist de Implementação

- [x] Tipografia Montserrat aplicada
- [x] Paleta alinhada à logo
- [x] Ícones padronizados em SVG outline
- [x] Cards principais sem gradiente
- [x] Filtros e histórico colapsáveis
- [x] Skeleton loading para imagens
- [x] Logos de marketplaces em filtros e cards
- [x] Seções Interesses e Alertas modernizadas com KPI cards
