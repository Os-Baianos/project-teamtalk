-- Issues #121 e #122: enviar e receber mensagens em tempo real (conversa 1 a 1).

create table if not exists public.mensagens (
  id uuid primary key default gen_random_uuid(),
  remetente_id uuid not null references public.perfis(id) on delete cascade,
  destinatario_id uuid not null references public.perfis(id) on delete cascade,
  texto text not null check (char_length(btrim(texto)) between 1 and 2000),
  criado_em timestamptz not null default now(),
  lida_em timestamptz,
  constraint mensagem_nao_para_si check (remetente_id <> destinatario_id)
);
create index if not exists mensagens_par_idx on public.mensagens (remetente_id, destinatario_id, criado_em desc);
create index if not exists mensagens_dest_idx on public.mensagens (destinatario_id, criado_em desc);

alter table public.mensagens enable row level security;

create policy "mensagens_ver_minhas" on public.mensagens
  for select to authenticated using (remetente_id = auth.uid() or destinatario_id = auth.uid());
create policy "mensagens_enviar_como_eu" on public.mensagens
  for insert to authenticated with check (remetente_id = auth.uid());

grant select, insert on public.mensagens to authenticated;

-- Lista de conversas: última mensagem de cada pessoa + quantas não lidas.
create or replace function public.listar_conversas()
returns table (contato_id uuid, nome text, arroba text, ultima_texto text, ultima_em timestamptz, nao_lidas bigint)
language sql stable security definer set search_path = public as $$
  with minhas as (
    select m.*, case when m.remetente_id = auth.uid() then m.destinatario_id else m.remetente_id end as outro
    from public.mensagens m
    where auth.uid() in (m.remetente_id, m.destinatario_id)
  ), ult as (
    select distinct on (outro) outro, texto, criado_em from minhas order by outro, criado_em desc
  )
  select p.id, p.nome, p.arroba, u.texto, u.criado_em,
    (select count(*) from minhas x where x.outro = p.id and x.destinatario_id = auth.uid() and x.lida_em is null)
  from ult u join public.perfis p on p.id = u.outro
  order by u.criado_em desc;
$$;

-- Marca como lidas as mensagens recebidas de uma pessoa.
create or replace function public.marcar_lidas(de uuid)
returns void
language sql security definer set search_path = public as $$
  update public.mensagens set lida_em = now()
  where destinatario_id = auth.uid() and remetente_id = de and lida_em is null;
$$;

revoke all on function public.listar_conversas(), public.marcar_lidas(uuid) from public, anon;
grant execute on function public.listar_conversas(), public.marcar_lidas(uuid) to authenticated;

-- Tempo real: o Supabase avisa quem está com a conversa aberta (a RLS vale também aqui).
alter publication supabase_realtime add table public.mensagens;
