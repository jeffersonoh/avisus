-- ============================================================
-- SAMPLE DATA — apenas para desenvolvimento / demonstração
--
-- Identificação: raw_data->>'source' = 'sample'
-- UUIDs fixos garantem idempotência (re-executar não duplica).
--
-- Para remover antes do go-live:
--   DELETE FROM public.opportunities WHERE raw_data->>'source' = 'sample';
--   DELETE FROM public.products      WHERE external_id LIKE 'sample-%';
-- ============================================================

-- ── products (somente marketplaces suportados: ML e Magalu) ─────────────────
-- Nota: opportunities só aceita 'Mercado Livre' e 'Magazine Luiza' (scanner não cobre Shopee).
-- Os dois itens originalmente "Shopee" foram mapeados para o marketplace de maior margem.

INSERT INTO public.products
  (id, external_id, marketplace, name, category, image_url, last_price, last_seen_at)
VALUES
  -- Parafusadeira Bosch — Mercado Livre
  (
    'deadbeef-0000-0000-0000-000000000001',
    'sample-product-1', 'Mercado Livre',
    'Parafusadeira Bosch GSR 12V', 'Ferramentas',
    'https://picsum.photos/seed/avisus-drill/720/480',
    289.90, '2026-04-15T14:00:00Z'
  ),
  -- PlayStation 5 Slim Digital — Mercado Livre (re-mapeado de Shopee)
  (
    'deadbeef-0000-0000-0000-000000000002',
    'sample-product-2', 'Mercado Livre',
    'PlayStation 5 Slim Digital', 'Games',
    'https://picsum.photos/seed/avisus-ps5/720/480',
    2799.00, '2026-04-16T09:30:00Z'
  ),
  -- Tênis Nike Air Max 90 — Magazine Luiza
  (
    'deadbeef-0000-0000-0000-000000000003',
    'sample-product-3', 'Magazine Luiza',
    'Tênis Nike Air Max 90', 'Calçados',
    'https://picsum.photos/seed/avisus-nike/720/480',
    449.90, '2026-04-14T18:20:00Z'
  ),
  -- Fone Bluetooth Sony WH-CH720N — Mercado Livre
  (
    'deadbeef-0000-0000-0000-000000000004',
    'sample-product-4', 'Mercado Livre',
    'Fone Bluetooth Sony WH-CH720N', 'Eletrônicos',
    'https://picsum.photos/seed/avisus-headphone/720/480',
    319.00, '2026-04-16T11:05:00Z'
  ),
  -- Kit de ferramentas 89 peças — Magazine Luiza (re-mapeado de Shopee)
  (
    'deadbeef-0000-0000-0000-000000000005',
    'sample-product-5', 'Magazine Luiza',
    'Kit de ferramentas 89 peças', 'Ferramentas',
    'https://picsum.photos/seed/avisus-tools/720/480',
    129.00, '2026-04-13T08:00:00Z'
  )
ON CONFLICT (marketplace, external_id) DO NOTHING;

-- ── opportunities ────────────────────────────────────────────────────────────

INSERT INTO public.opportunities
  (id, product_id, external_id, marketplace, name, category, image_url,
   price, original_price, discount_pct, freight, freight_free,
   margin_best, margin_best_channel, quality, hot, status,
   buy_url, region_uf, region_city, detected_at, expires_at, raw_data)
VALUES
  -- 1. Parafusadeira Bosch GSR 12V — Mercado Livre
  (
    'cafebabe-0000-0000-0000-000000000001',
    'deadbeef-0000-0000-0000-000000000001',
    'sample-opp-1', 'Mercado Livre',
    'Parafusadeira Bosch GSR 12V', 'Ferramentas',
    'https://picsum.photos/seed/avisus-drill/720/480',
    289.90, 459.90, 37, 12.50, false,
    38.0, 'Mercado Livre', 'exceptional', true, 'active',
    'https://lista.mercadolivre.com.br/parafusadeira-bosch-gsr-12v',
    'SC', 'Palhoça',
    '2026-04-15T14:00:00Z', NOW() + INTERVAL '7 days',
    '{"source": "sample"}'::jsonb
  ),
  -- 2. PlayStation 5 Slim Digital — Mercado Livre (re-mapeado de Shopee)
  (
    'cafebabe-0000-0000-0000-000000000002',
    'deadbeef-0000-0000-0000-000000000002',
    'sample-opp-2', 'Mercado Livre',
    'PlayStation 5 Slim Digital', 'Games',
    'https://picsum.photos/seed/avisus-ps5/720/480',
    2799.00, 3699.00, 24, 0.00, true,
    24.0, 'Mercado Livre', 'great', false, 'active',
    'https://lista.mercadolivre.com.br/playstation-5-slim',
    'SP', 'São Paulo',
    '2026-04-16T09:30:00Z', NOW() + INTERVAL '7 days',
    '{"source": "sample"}'::jsonb
  ),
  -- 3. Tênis Nike Air Max 90 — Magazine Luiza
  (
    'cafebabe-0000-0000-0000-000000000003',
    'deadbeef-0000-0000-0000-000000000003',
    'sample-opp-3', 'Magazine Luiza',
    'Tênis Nike Air Max 90', 'Calçados',
    'https://picsum.photos/seed/avisus-nike/720/480',
    449.90, 799.00, 44, 0.00, true,
    42.0, 'Magazine Luiza', 'exceptional', true, 'active',
    'https://www.magazineluiza.com.br/',
    'RJ', 'Rio de Janeiro',
    '2026-04-14T18:20:00Z', NOW() + INTERVAL '7 days',
    '{"source": "sample"}'::jsonb
  ),
  -- 4. Fone Bluetooth Sony WH-CH720N — Mercado Livre
  (
    'cafebabe-0000-0000-0000-000000000004',
    'deadbeef-0000-0000-0000-000000000004',
    'sample-opp-4', 'Mercado Livre',
    'Fone Bluetooth Sony WH-CH720N', 'Eletrônicos',
    'https://picsum.photos/seed/avisus-headphone/720/480',
    319.00, 499.00, 36, 9.90, false,
    28.0, 'Mercado Livre', 'good', false, 'active',
    'https://lista.mercadolivre.com.br/',
    'SP', 'Campinas',
    '2026-04-16T11:05:00Z', NOW() + INTERVAL '7 days',
    '{"source": "sample"}'::jsonb
  ),
  -- 5. Kit de ferramentas 89 peças — Magazine Luiza (re-mapeado de Shopee)
  (
    'cafebabe-0000-0000-0000-000000000005',
    'deadbeef-0000-0000-0000-000000000005',
    'sample-opp-5', 'Magazine Luiza',
    'Kit de ferramentas 89 peças', 'Ferramentas',
    'https://picsum.photos/seed/avisus-tools/720/480',
    129.00, 219.00, 41, 15.00, false,
    33.0, 'Magazine Luiza', 'great', false, 'active',
    'https://www.magazineluiza.com.br/',
    'PR', 'Curitiba',
    '2026-04-13T08:00:00Z', NOW() + INTERVAL '7 days',
    '{"source": "sample"}'::jsonb
  )
ON CONFLICT (marketplace, external_id) DO NOTHING;

-- ── channel_margins ──────────────────────────────────────────────────────────

INSERT INTO public.channel_margins
  (opportunity_id, channel, market_price, fee_pct, net_margin)
VALUES
  -- opp-1: Parafusadeira Bosch
  ('cafebabe-0000-0000-0000-000000000001', 'Mercado Livre',  459.90, 15.0, 38.0),
  ('cafebabe-0000-0000-0000-000000000001', 'Shopee',         449.00, 18.0, 31.0),
  ('cafebabe-0000-0000-0000-000000000001', 'Magazine Luiza', 452.00, 16.0, 34.0),
  -- opp-2: PlayStation 5
  ('cafebabe-0000-0000-0000-000000000002', 'Mercado Livre',  3699.00, 15.0, 24.0),
  ('cafebabe-0000-0000-0000-000000000002', 'Shopee',         3650.00, 18.0, 19.0),
  ('cafebabe-0000-0000-0000-000000000002', 'Magazine Luiza', 3680.00, 16.0, 21.0),
  -- opp-3: Tênis Nike
  ('cafebabe-0000-0000-0000-000000000003', 'Mercado Livre',  789.00, 15.0, 39.0),
  ('cafebabe-0000-0000-0000-000000000003', 'Shopee',         799.00, 18.0, 35.0),
  ('cafebabe-0000-0000-0000-000000000003', 'Magazine Luiza', 779.00, 16.0, 42.0),
  -- opp-4: Fone Sony
  ('cafebabe-0000-0000-0000-000000000004', 'Mercado Livre',  499.00, 15.0, 28.0),
  ('cafebabe-0000-0000-0000-000000000004', 'Shopee',         489.00, 18.0, 22.0),
  ('cafebabe-0000-0000-0000-000000000004', 'Magazine Luiza', 495.00, 16.0, 25.0),
  -- opp-5: Kit ferramentas
  ('cafebabe-0000-0000-0000-000000000005', 'Mercado Livre',  219.00, 15.0, 30.0),
  ('cafebabe-0000-0000-0000-000000000005', 'Shopee',         209.00, 18.0, 33.0),
  ('cafebabe-0000-0000-0000-000000000005', 'Magazine Luiza', 215.00, 16.0, 28.0)
ON CONFLICT (opportunity_id, channel) DO NOTHING;
