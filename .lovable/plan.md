## Nova paleta Securuss (70/20/10)

Aplicar a proporção 70/20/10 ao tema do site, mantendo o estilo limpo atual:

- **70% Branco** — fundos de página, cards, superfícies (`background`, `card`, `popover`, `surface`).
- **20% Azul-marinho `#182c44`** — cor estrutural/secundária: header/sidebar, textos principais (`foreground`), botões secundários, bordas de destaque, footer.
- **10% Dourado `#cfb159`** — cor de destaque (accent): botão primário (CTA), links ativos, ícones de destaque, badges de status "válido", focus ring.

### Mudanças

**`src/styles.css`** — substituir os tokens do `:root`:
- `--background`, `--card`, `--popover`, `--surface` → branco puro (mantido).
- `--foreground`, `--card-foreground`, `--popover-foreground`, `--secondary-foreground` → `#182c44` convertido para oklch.
- `--secondary` → tom muito claro derivado do `#182c44` (~oklch(0.96 0.01 250)) para fundos de seções secundárias.
- `--primary` → `#cfb159` (oklch ≈ 0.76 0.11 85), `--primary-foreground` → `#182c44` (contraste AA garantido sobre dourado).
- `--accent` → tom claro derivado do dourado (~oklch(0.95 0.04 85)), `--accent-foreground` → `#182c44`.
- `--ring` → `#cfb159`.
- `--border`, `--input` → cinza muito leve com leve viés azul (mantido próximo do atual).
- `--sidebar*` → fundo `#182c44`, foreground branco, primary/accent dourado (transformando a sidebar em superfície "20%").
- `--success` mantém verde (status), mas `--chart-1` passa a dourado e `--chart-2` ao azul-marinho para refletir a paleta.

**`public/favicon.svg`** (já planejado) — atualizar as cores da folha: fundo `#182c44`, traço `#cfb159`, para ficar coerente com a nova identidade.

### Como a proporção fica visível

- Páginas e formulários: fundos brancos dominam (70%).
- AppShell/sidebar/topbar e tipografia principal em `#182c44` (20%).
- Botões "Salvar", "Entrar", links ativos, ícones-chave e bordas de foco em `#cfb159` (10%).

Nenhum componente precisa ser editado individualmente — como tudo usa os tokens semânticos do Tailwind/shadcn (`bg-primary`, `text-foreground`, `bg-sidebar`, etc.), a troca dos tokens propaga para toda a aplicação automaticamente.
