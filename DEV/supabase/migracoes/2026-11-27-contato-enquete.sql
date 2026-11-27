-- Contato (cartão de uma pessoa) e Enquete (votação) nas mensagens.

alter table public.mensagens
  add column if not exists contato_ref uuid references public.perfis(id) on delete set null,
  add column if not exists enquete boolean not null default false;

create table public.enquetes (
  mensagem_id uuid primary key references public.mensagens(id) on delete cascade,
  multipla boolean not null default false,
  encerrada_em timestamptz
);
create table public.enquete_opcoes (
  id uuid primary key default gen_random_uuid(),
  mensagem_id uuid not null references public.mensagens(id) on delete cascade,
  texto text not null check (char_length(btrim(texto)) between 1 and 100),
  pos smallint not null
);
create index on public.enquete_opcoes (mensagem_id);
create table public.enquete_votos (
  opcao_id uuid not null references public.enquete_opcoes(id) on delete cascade,
  mensagem_id uuid not null references public.mensagens(id) on delete cascade,
  usuario_id uuid not null references public.perfis(id) on delete cascade,
  criado_em timestamptz not null default now(),
  primary key (opcao_id, usuario_id)
);
create index on public.enquete_votos (mensagem_id);

alter table public.enquetes enable row level security;
alter table public.enquete_opcoes enable row level security;
alter table public.enquete_votos enable row level security;

-- Quem enxerga a mensagem enxerga a enquete dela.
create or replace function public.pode_ver_mensagem(m uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.mensagens x
    where x.id = m and (
      x.remetente_id = auth.uid() or x.destinatario_id = auth.uid()
      or (x.grupo_id is not null and public.pode_ver_msg_grupo(x.grupo_id, x.criado_em))
    )
  );
$$;

create policy enquetes_ver on public.enquetes for select to authenticated using (public.pode_ver_mensagem(mensagem_id));
create policy enquete_opcoes_ver on public.enquete_opcoes for select to authenticated using (public.pode_ver_mensagem(mensagem_id));
create policy enquete_votos_ver on public.enquete_votos for select to authenticated using (public.pode_ver_mensagem(mensagem_id));
grant select on public.enquetes, public.enquete_opcoes, public.enquete_votos to authenticated;

-- Depois de gravar a mensagem (enquete = true), quem a enviou define as opções (2 a 6).
create or replace function public.enquete_definir(msg uuid, opcoes text[], multipla boolean) returns boolean
language plpgsql security definer set search_path = public as $$
declare limpas text[]; i int;
begin
  if not exists (select 1 from public.mensagens where id = msg and remetente_id = auth.uid() and enquete) then return false; end if;
  if exists (select 1 from public.enquetes where mensagem_id = msg) then return false; end if;
  select array_agg(btrim(o)) into limpas from unnest(opcoes) o where btrim(o) <> '';
  if limpas is null or cardinality(limpas) < 2 or cardinality(limpas) > 6
     or (select count(distinct lower(x)) from unnest(limpas) x) <> cardinality(limpas)
     or exists (select 1 from unnest(limpas) x where char_length(x) > 100) then return false; end if;
  for i in 1..cardinality(limpas) loop
    insert into public.enquete_opcoes (mensagem_id, texto, pos) values (msg, limpas[i], i);
  end loop;
  insert into public.enquetes (mensagem_id, multipla) values (msg, multipla);
  return true;
end $$;

-- Marca ou tira o meu voto. Enquete de escolha única troca o voto anterior.
create or replace function public.enquete_votar(msg uuid, opcao uuid, marcar boolean) returns boolean
language plpgsql security definer set search_path = public as $$
declare q record;
begin
  select e.multipla, e.encerrada_em, m.apagada_em into q
  from public.enquetes e join public.mensagens m on m.id = e.mensagem_id where e.mensagem_id = msg;
  if not found or q.encerrada_em is not null or q.apagada_em is not null then return false; end if;
  if not public.pode_ver_mensagem(msg) then return false; end if;
  if not exists (select 1 from public.enquete_opcoes where id = opcao and mensagem_id = msg) then return false; end if;
  if marcar then
    if not q.multipla then delete from public.enquete_votos where mensagem_id = msg and usuario_id = auth.uid() and opcao_id <> opcao; end if;
    insert into public.enquete_votos (opcao_id, mensagem_id, usuario_id) values (opcao, msg, auth.uid()) on conflict do nothing;
  else
    delete from public.enquete_votos where opcao_id = opcao and usuario_id = auth.uid();
  end if;
  return true;
end $$;

-- Só quem criou a enquete encerra.
create or replace function public.enquete_encerrar(msg uuid) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  update public.enquetes e set encerrada_em = now()
  where e.mensagem_id = msg and e.encerrada_em is null
    and exists (select 1 from public.mensagens m where m.id = msg and m.remetente_id = auth.uid());
  return found;
end $$;

revoke all on function public.pode_ver_mensagem(uuid), public.enquete_definir(uuid, text[], boolean), public.enquete_votar(uuid, uuid, boolean), public.enquete_encerrar(uuid) from public, anon;
grant execute on function public.pode_ver_mensagem(uuid), public.enquete_definir(uuid, text[], boolean), public.enquete_votar(uuid, uuid, boolean), public.enquete_encerrar(uuid) to authenticated;

alter publication supabase_realtime add table public.enquetes, public.enquete_votos;
