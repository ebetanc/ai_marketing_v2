-- Seed data for ai_marketing_v2
-- Coverage goals:
-- - Multiple companies (ascii, unicode, emoji, long text, nulls)
-- - Strategies per company (some dense with many angles, some sparse)
-- - Ideas linked to strategies/companies (varying filled topic counts, nulls)
-- - Content rows in unified public.content with post true/false/null
-- - Real estate content simple rows
-- - Idempotent via TRUNCATE ... RESTART IDENTITY CASCADE
begin;
-- Clean existing data for a deterministic seed (unified content table)
truncate table public.content,
public.ideas,
public.strategies,
public.companies,
public.real_estate_content restart identity cascade;
insert into auth.users (
        id,
        instance_id,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        aud,
        role,
        is_super_admin
    )
values (
        '11111111-1111-1111-1111-111111111111',
        '00000000-0000-0000-0000-000000000000',
        'seed@example.com',
        null,
        now(),
        '{"provider":"email","providers":["email"]}',
        '{}',
        'authenticated',
        'authenticated',
        false
    ) on conflict (id) do nothing;
-- Companies (assign owner_id to the seeded user for all rows)
insert into public.companies (
        owner_id,
        brand_name,
        website,
        additional_information,
        target_audience,
        brand_tone,
        key_offer
    )
values (
        '11111111-1111-1111-1111-111111111111',
        'Acme Analytics',
        'https://acme-analytics.example',
        'B2B analytics platform focusing on SMBs. Integrates with 50+ data sources.',
        'SMB founders, RevOps leaders',
        'Professional, witty, concise',
        'Self-serve dashboards with AI insights'
    ),
    (
        '11111111-1111-1111-1111-111111111111',
        'Café Montréal ☕',
        null,
        'Artisanal coffee roaster and café chain in Québec. Offre aussi des ateliers barista.',
        'Local coffee lovers, tourists',
        'Chaleureux, authentique, bilingue',
        'Subscriptions & seasonal roasts'
    ),
    (
        '11111111-1111-1111-1111-111111111111',
        'NeoFit+',
        'https://neofit.plus',
        'Consumer fitness app with adaptive workouts and Apple Health integration.',
        'Fitness enthusiasts, busy professionals',
        'Motivational, energetic',
        'AI-personalized training plans'
    ),
    (
        '11111111-1111-1111-1111-111111111111',
        'Globex Realty',
        'https://globexrealty.example',
        'Boutique real estate firm specializing in urban condos and staging.',
        'First-time buyers, downsizers',
        'Trustworthy, educational',
        'End-to-end buying assistance'
    ),
    (
        '11111111-1111-1111-1111-111111111111',
        'Zeta DevTools',
        'https://zeta.dev',
        'Developer tooling for CI/CD. Includes a free tier and on-prem options.',
        'DevOps engineers, platform teams',
        'Technical, pragmatic',
        'Blazing-fast pipelines with insights'
    ),
    (
        '11111111-1111-1111-1111-111111111111',
        'München Bikes 🚲',
        'https://muenchen-bikes.de',
        'Bike shop and rental service in München. E-Bikes and guided tours available.',
        'Commuters, tourists',
        'Friendly, sustainable',
        'Premium e-bike rentals & service'
    );
-- Strategies (mix of rich and minimal data)
-- Dense strategy for Acme Analytics (covers many angle fields)
insert into public.strategies (
        company_id,
        platforms,
        angle1_header,
        angle1_description,
        angle1_objective,
        angle1_tonality,
        angle2_header,
        angle2_description,
        angle2_objective,
        angle2_tonality,
        angle3_header,
        angle3_description,
        angle3_objective,
        angle3_tonality,
        angle4_header,
        angle4_description,
        angle4_objective,
        angle4_tonality,
        angle5_header,
        angle5_description,
        angle5_objective,
        angle5_tonality
    )
select c.id,
    'Twitter, LinkedIn, Newsletter',
    'Brand Awareness',
    'Showcase use-cases and customer stories to drive awareness',
    'Reach',
    'Witty',
    'Product Education',
    'Short tips and tricks for power users',
    'Activation',
    'Helpful',
    'Data Stories',
    'Monthly benchmarks and industry insights',
    'Engagement',
    'Authoritative',
    'Community',
    'Highlight user-generated dashboards',
    'Advocacy',
    'Celebratory',
    'Funnels',
    'Guide trials to paid with nurture content',
    'Conversion',
    'Persuasive'
from public.companies c
where c.brand_name = 'Acme Analytics';
-- Minimal strategy for Café Montréal (only angle1)
insert into public.strategies (
        company_id,
        platforms,
        angle1_header,
        angle1_description,
        angle1_objective,
        angle1_tonality
    )
select id,
    'Instagram, Newsletter',
    'Seasonal Menu',
    'Promote seasonal drinks and beans',
    'Foot traffic',
    'Chaleureux'
from public.companies
where brand_name = 'Café Montréal ☕';
-- A couple strategies for NeoFit+ (mix of filled and nulls)
insert into public.strategies (
        company_id,
        platforms,
        angle1_header,
        angle1_description,
        angle1_objective,
        angle1_tonality,
        angle2_header,
        angle2_description
    )
select id,
    'Twitter, YouTube',
    '30-Day Challenge',
    'Daily micro-workouts for busy schedules',
    'Retention',
    'Energetic',
    'Coach AMA',
    'Weekly Q&A with trainers'
from public.companies
where brand_name = 'NeoFit+';
insert into public.strategies (
        company_id,
        platforms,
        angle1_header,
        angle1_description
    )
select id,
    null,
    'Integrations',
    'Highlight Apple Health & wearable sync'
from public.companies
where brand_name = 'NeoFit+';
-- Strategy for Globex Realty
insert into public.strategies (
        company_id,
        platforms,
        angle1_header,
        angle1_description,
        angle1_objective,
        angle1_tonality,
        angle2_header,
        angle2_description,
        angle2_objective,
        angle2_tonality
    )
select id,
    'LinkedIn, Blog, Newsletter',
    'Market Education',
    'Demystify closing costs and inspections',
    'Trust',
    'Educational',
    'Staging Tips',
    'Before/after photo threads',
    'Leads',
    'Inspiring'
from public.companies
where brand_name = 'Globex Realty';
-- Strategy for Zeta DevTools
insert into public.strategies (
        company_id,
        platforms,
        angle1_header,
        angle1_description,
        angle1_objective,
        angle1_tonality,
        angle2_header,
        angle2_description,
        angle3_header,
        angle3_description
    )
select id,
    'X/Twitter, LinkedIn',
    'Latency Wins',
    'Benchmarks vs competitors',
    'Demand gen',
    'Technical',
    'DX Tips',
    'Productivity tips for CI',
    'On-Prem',
    'Compliance & air-gapped stories'
from public.companies
where brand_name = 'Zeta DevTools';
-- Strategy for München Bikes
insert into public.strategies (
        company_id,
        platforms,
        angle1_header,
        angle1_description,
        angle1_objective,
        angle1_tonality
    )
select id,
    'Instagram, TikTok',
    'Tour Highlights',
    'Weekend routes and landmarks',
    'Bookings',
    'Friendly'
from public.companies
where brand_name = 'München Bikes 🚲';
-- Ideas (a mix: some with 10 topics, some with a few, some with nulls)
-- Acme: two Idea Sets, one dense, one sparse
insert into public.ideas (
        header,
        platforms,
        description,
        angle_number,
        angle_id,
        topic1,
        idea_description1,
        image_prompt1,
        topic2,
        idea_description2,
        image_prompt2,
        topic3,
        idea_description3,
        image_prompt3,
        topic4,
        idea_description4,
        image_prompt4,
        topic5,
        idea_description5,
        image_prompt5,
        topic6,
        idea_description6,
        image_prompt6,
        topic7,
        idea_description7,
        image_prompt7,
        topic8,
        idea_description8,
        image_prompt8,
        topic9,
        idea_description9,
        image_prompt9,
        topic10,
        idea_description10,
        image_prompt10,
        strategy_id,
        company_id
    )
select 'Q3 Growth Campaign',
    'Twitter, LinkedIn',
    'Multi-week thread series and benchmarks',
    1,
    null,
    'Benchmark: eCommerce',
    'How top stores use cohort analysis',
    'Dashboard screenshot, vibrant, minimal',
    'Tip Tuesday',
    '3 ways to reduce data freshness lag',
    'Clock + charts, clean UI',
    'Case Study: SaaS',
    'ARR insights from churn cohort',
    'Bar charts, brand palette',
    'UGC Spotlight',
    'User-created retention dashboard',
    'Desk setup, dashboard on screen',
    'Webinar Prep',
    'Data stories coming Thursday',
    'Speaker card, brand blue',
    'Launch: Funnels',
    'From trial to paid in 4 steps',
    'Funnel diagram, simple',
    'Quote',
    '”What gets measured gets managed.”',
    'Typography poster',
    'Community',
    'Share your dashboard for feedback',
    'Collage of dashboards',
    'Recap',
    'Month in review: top insights',
    'Grid of highlights',
    'AMA',
    'Ask our data team anything',
    'Q&A collage, simple icons',
    s.id,
    s.company_id
from public.strategies s
    join public.companies c on c.id = s.company_id
where c.brand_name = 'Acme Analytics'
    and coalesce(s.angle1_header, '') = 'Brand Awareness';
insert into public.ideas (
        header,
        platforms,
        description,
        angle_number,
        angle_id,
        topic1,
        idea_description1,
        topic2,
        idea_description2,
        strategy_id,
        company_id
    )
select 'Quick Wins',
    'Twitter',
    'Short tips thread set',
    2,
    2,
    'Keyboard Shortcuts',
    '5 shortcuts for faster filtering',
    'Template Pack',
    '3 dashboard templates to copy',
    s.id,
    s.company_id
from public.strategies s
    join public.companies c on c.id = s.company_id
where c.brand_name = 'Acme Analytics'
    and coalesce(s.angle2_header, '') = 'Product Education';
-- Café Montréal: one Idea Set, some nulls and unicode
insert into public.ideas (
        header,
        platforms,
        description,
        angle_number,
        angle_id,
        topic1,
        idea_description1,
        image_prompt1,
        topic2,
        idea_description2,
        topic3,
        idea_description3,
        strategy_id,
        company_id
    )
select 'Menu d''automne 🍁',
    'Instagram',
    'Nouveautés & ateliers',
    1,
    null,
    'Latte à la citrouille',
    'Backstage: torréfaction & recette',
    'Flatlay latte art, feuilles d''automne',
    'Atelier barista',
    'Annonce des places disponibles',
    'Nouveau blend',
    'Notes de chocolat et noisette',
    s.id,
    s.company_id
from public.strategies s
    join public.companies c on c.id = s.company_id
where c.brand_name = 'Café Montréal ☕'
limit 1;
-- NeoFit+: two Idea Sets across two strategies
insert into public.ideas (
        header,
        platforms,
        description,
        angle_number,
        topic1,
        idea_description1,
        topic2,
        idea_description2,
        topic3,
        idea_description3,
        strategy_id,
        company_id
    )
select '30-Day Micro Challenge',
    'Twitter, YouTube',
    'Daily 10-min routines',
    1,
    'Day 1: Core',
    'Planks + mountain climbers',
    'Day 2: Upper',
    'Push-up ladder',
    'Day 3: Lower',
    'Lunges + wall sits',
    s.id,
    s.company_id
from public.strategies s
    join public.companies c on c.id = s.company_id
where c.brand_name = 'NeoFit+'
    and coalesce(s.angle1_header, '') = '30-Day Challenge';
insert into public.ideas (
        header,
        platforms,
        description,
        angle_number,
        topic1,
        idea_description1,
        strategy_id,
        company_id
    )
select 'Integration Spotlight',
    null,
    'Sync your rings and watches',
    1,
    'Apple Health 101',
    'How sync works and common fixes',
    s.id,
    s.company_id
from public.strategies s
    join public.companies c on c.id = s.company_id
where c.brand_name = 'NeoFit+'
    and coalesce(s.angle1_header, '') = 'Integrations';
-- Globex Realty: one Idea Set
insert into public.ideas (
        header,
        platforms,
        description,
        angle_number,
        topic1,
        idea_description1,
        topic2,
        idea_description2,
        topic3,
        idea_description3,
        strategy_id,
        company_id
    )
select 'Closing Costs Explained',
    'LinkedIn, Blog',
    'Demystify fees for buyers',
    1,
    'Inspection 101',
    'What to expect and how to prepare',
    'Appraisal vs. Inspection',
    'Key differences and who pays',
    'What is Title Insurance?',
    'Peace of mind for ownership',
    s.id,
    s.company_id
from public.strategies s
    join public.companies c on c.id = s.company_id
where c.brand_name = 'Globex Realty'
limit 1;
-- Zeta DevTools: two Idea Sets
insert into public.ideas (
        header,
        platforms,
        description,
        angle_number,
        topic1,
        idea_description1,
        image_prompt1,
        topic2,
        idea_description2,
        strategy_id,
        company_id
    )
select 'Latency Showdown',
    'X/Twitter, LinkedIn',
    'Head-to-head CI benchmarks',
    1,
    'Cold cache',
    'First run vs competitors',
    'Terminal screenshot, code blocks, dark theme',
    'Hot cache',
    'Repeat run with primed cache',
    s.id,
    s.company_id
from public.strategies s
    join public.companies c on c.id = s.company_id
where c.brand_name = 'Zeta DevTools'
limit 1;
insert into public.ideas (
        header,
        platforms,
        description,
        angle_number,
        topic1,
        idea_description1,
        strategy_id,
        company_id
    )
select 'On-Prem Deep Dive',
    'LinkedIn',
    'Compliance-first deployments',
    3,
    'Air-gapped installs',
    'What to configure and why',
    s.id,
    s.company_id
from public.strategies s
    join public.companies c on c.id = s.company_id
where c.brand_name = 'Zeta DevTools'
limit 1;
-- München Bikes: one Idea Set
insert into public.ideas (
        header,
        platforms,
        description,
        angle_number,
        topic1,
        idea_description1,
        image_prompt1,
        topic2,
        idea_description2,
        strategy_id,
        company_id
    )
select 'Isar River Tour',
    'Instagram, TikTok',
    'Family-friendly route highlights',
    1,
    'Stop: Deutsches Museum',
    'Great for kids and science lovers',
    'Sunny riverside, bikes, museum backdrop',
    'Beer garden break',
    'Where to park and best snacks',
    s.id,
    s.company_id
from public.strategies s
    join public.companies c on c.id = s.company_id
where c.brand_name = 'München Bikes 🚲'
limit 1;
-- Content: map to a few idea ids across brands; vary post flags in unified table
-- Twitter content
insert into public.content (idea_id, content_body, post, status, platform)
select i.id,
    '5 ways to reduce freshness lag in your data warehouse. #analytics',
    true,
    'approved',
    'twitter'
from public.ideas i
    join public.companies c on c.id = i.company_id
where c.brand_name = 'Acme Analytics'
order by i.id asc
limit 1;
insert into public.content (idea_id, content_body, post, status, platform)
select i.id,
    'Day 1: 10-min core burner. No equipment needed. #NeoFitChallenge',
    false,
    'draft',
    'twitter'
from public.ideas i
    join public.companies c on c.id = i.company_id
where c.brand_name = 'NeoFit+'
order by i.id asc
limit 1;
insert into public.content (idea_id, content_body, post, status, platform)
select i.id,
    'Latency showdown: cold vs hot cache. Results will surprise you. #devtools',
    null,
    'draft',
    'twitter'
from public.ideas i
    join public.companies c on c.id = i.company_id
where c.brand_name = 'Zeta DevTools'
order by i.id asc
limit 1;
-- LinkedIn content
insert into public.content (idea_id, content_body, post, status, platform)
select i.id,
    'Closing costs explained: a simple guide for first-time buyers.',
    true,
    'approved',
    'linkedin'
from public.ideas i
    join public.companies c on c.id = i.company_id
where c.brand_name = 'Globex Realty'
order by i.id asc
limit 1;
insert into public.content (idea_id, content_body, post, status, platform)
select i.id,
    'On-Prem in regulated industries: what teams get wrong first.',
    false,
    'draft',
    'linkedin'
from public.ideas i
    join public.companies c on c.id = i.company_id
where c.brand_name = 'Zeta DevTools'
order by i.id desc
limit 1;
-- Newsletter content
insert into public.content (idea_id, content_body, post, status, platform)
select i.id,
    'Menu d''automne: nouvelles torréfactions et ateliers à venir 🍁',
    true,
    'approved',
    'newsletter'
from public.ideas i
    join public.companies c on c.id = i.company_id
where c.brand_name = 'Café Montréal ☕'
order by i.id asc
limit 1;
insert into public.content (idea_id, content_body, post, status, platform)
select i.id,
    'Monthly recap: your top dashboards and insights from September.',
    null,
    'draft',
    'newsletter'
from public.ideas i
    join public.companies c on c.id = i.company_id
where c.brand_name = 'Acme Analytics'
order by i.id desc
limit 1;
-- Real estate content (simple, independent)
insert into public.real_estate_content (
        id,
        created_at,
        link_origin,
        link_final,
        owner_id
    )
values (
        1,
        now(),
        'https://example.com/listing/123',
        'https://globexrealty.example/properties/123',
        '11111111-1111-1111-1111-111111111111'
    ),
    (
        2,
        now(),
        'https://blog.mortgage.example/fees',
        'https://globexrealty.example/guides/closing-costs',
        '11111111-1111-1111-1111-111111111111'
    ),
    (
        3,
        now(),
        'https://city-data.example/market-report',
        'https://globexrealty.example/reports/q3',
        '11111111-1111-1111-1111-111111111111'
    );
commit;
