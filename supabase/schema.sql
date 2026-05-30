create table if not exists public.articles (
  id text primary key,
  title text not null,
  category text not null check (category in ('布里斯本房產', '首次購屋', '投資區域', '澳洲生活')),
  hero_image text not null,
  excerpt text not null,
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.leads (
  id text primary key,
  name text not null,
  email text not null,
  messenger text not null,
  created_at timestamptz not null default now()
);

alter table public.articles enable row level security;
alter table public.leads enable row level security;

create index if not exists articles_created_at_idx on public.articles (created_at desc);
create index if not exists leads_created_at_idx on public.leads (created_at desc);

insert into public.articles (id, title, category, hero_image, excerpt, content, created_at)
values
  (
    'brisbane-family-suburbs',
    'Brisbane 哪些區域適合亞洲家庭？',
    '布里斯本房產',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    '從學校、交通、生活機能與預算角度，整理適合家庭居住的區域。',
    '<p>從學校、交通、生活機能與預算角度，整理適合家庭居住的區域。</p><p><strong>Brisbane 買房</strong>不只是比較房價，也要把家庭日常、孩子上學與通勤節奏一起放進考量。</p>',
    '2026-05-28T09:00:00.000Z'
  ),
  (
    'australia-first-home-guide',
    '澳洲首次購屋完整攻略',
    '首次購屋',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
    '整理首購補助、貸款準備、頭期款與看房流程。',
    '<p>整理首購補助、貸款準備、頭期款與看房流程。</p><p>首次購屋最重要的是先建立順序：預算、貸款、區域、物件，再進入出價與合約。</p>',
    '2026-05-24T09:00:00.000Z'
  ),
  (
    'logan-investment-potential',
    'Logan 還值得投資嗎？',
    '投資區域',
    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
    '用租金、成長性、交通與人口結構分析投資潛力。',
    '<p>用租金、成長性、交通與人口結構分析投資潛力。</p><p>投資判斷不能只看價格，也要看租客需求、交通動線與長期人口結構。</p>',
    '2026-05-20T09:00:00.000Z'
  )
on conflict (id) do update set
  title = excluded.title,
  category = excluded.category,
  hero_image = excluded.hero_image,
  excerpt = excluded.excerpt,
  content = excluded.content,
  created_at = excluded.created_at;
