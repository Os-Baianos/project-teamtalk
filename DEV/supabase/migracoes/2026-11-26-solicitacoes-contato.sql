-- Solicitações de contato: pedir, aceitar, recusar, cancelar e remover.
-- "contatos" passa a guardar só contatos ACEITOS, sempre nos dois lados (A->B e B->A).

-- Cópia de segurança dos contatos de antes da mudança (sem acesso pela API).
create table if not exists public.contatos_backup_20261126 as select * from public.contatos;
alter table public.contatos_backup_20261126 enable row level security;

-- Quem já era contato vira contato aceito nos dois lados.
insert into public.contatos (dono_id, contato_id)
select contato_id, dono_id from public.contatos
on conflict do nothing;

create table if not exists public.solicitacoes_contato (
  de_id uuid not null references public.perfis(id) on delete cascade,
  para_id uuid not null references public.perfis(id) on delete cascade,
  criado_em timestamptz not null default now(),
  primary key (de_id, para_id),
  constraint solicitacao_nao_para_si check (de_id <> para_id)
);
alter table public.solicitacoes_contato enable row level security;
create policy "solicitacoes_ver_minhas" on public.solicitacoes_contato
  for select to authenticated using (de_id = auth.uid() or para_id = auth.uid());
grant select on public.solicitacoes_contato to authenticated;

-- Contatos e solicitações só mudam pelas funções abaixo.
revoke insert, update, delete on public.contatos from authenticated;
revoke insert, update, delete on public.solicitacoes_contato from authenticated;
drop function if exists public.adicionar_contato(text);

-- Relação entre quem está logado e outra pessoa: nenhuma | contato | enviada | recebida
create or replace function public.relacao_com(outra uuid)
returns text
language sql stable security definer set search_path = public as $$
  select case
    when exists (select 1 from public.contatos where dono_id = auth.uid() and contato_id = outra) then 'contato'
    when exists (select 1 from public.solicitacoes_contato where de_id = auth.uid() and para_id = outra) then 'enviada'
    when exists (select 1 from public.solicitacoes_contato where de_id = outra and para_id = auth.uid()) then 'recebida'
    else 'nenhuma' end;
$$;

drop function if exists public.buscar_perfil(text);
drop function if exists public.sugerir_perfis(text);
drop function if exists public.ver_perfil(text);

create or replace function public.buscar_perfil(candidato text)
returns table (id uuid, nome text, arroba text, foto_path text, relacao text)
language sql stable security definer set search_path = public as $$
  select p.id, p.nome, p.arroba, p.foto_path, public.relacao_com(p.id) from public.perfis p
  where p.arroba = lower(regexp_replace(trim(candidato), '^@', ''))
    and p.id <> auth.uid() and auth.uid() is not null;
$$;

-- Até 5 sugestões pelo @ (não mostra a própria pessoa nem quem já é contato).
create or replace function public.sugerir_perfis(termo text)
returns table (id uuid, nome text, arroba text, foto_path text, relacao text)
language plpgsql stable security definer set search_path = public as $$
declare
  q text := lower(regexp_replace(trim(coalesce(termo, '')), '^@', ''));
  padrao text;
begin
  if auth.uid() is null or char_length(q) < 2 then return; end if;
  padrao := replace(replace(replace(q, '\', '\\'), '%', '\%'), '_', '\_');
  return query
    select p.id, p.nome, p.arroba, p.foto_path, public.relacao_com(p.id)
    from public.perfis p
    where p.id <> auth.uid()
      and p.arroba ilike '%' || padrao || '%'
      and public.relacao_com(p.id) <> 'contato'
    order by (p.arroba ilike padrao || '%') desc, p.arroba
    limit 5;
end $$;

create or replace function public.ver_perfil(candidato text)
returns table (id uuid, nome text, arroba text, foto_path text, criado_em timestamptz, relacao text)
language sql stable security definer set search_path = public as $$
  select p.id, p.nome, p.arroba, p.foto_path, p.criado_em, public.relacao_com(p.id)
  from public.perfis p
  where p.arroba = lower(regexp_replace(trim(candidato), '^@', ''))
    and auth.uid() is not null;
$$;

-- Pede para virar contato. Devolve: ok | aceita | inexistente | proprio | ja_contato | ja_enviada
-- ("aceita": a outra pessoa já tinha pedido para você, então vira contato na hora)
create or replace function public.solicitar_contato(candidato text)
returns text
language plpgsql security definer set search_path = public as $$
declare alvo uuid; rel text;
begin
  if auth.uid() is null then return 'inexistente'; end if;
  select id into alvo from public.perfis where arroba = lower(regexp_replace(trim(candidato), '^@', ''));
  if alvo is null then return 'inexistente'; end if;
  if alvo = auth.uid() then return 'proprio'; end if;
  rel := public.relacao_com(alvo);
  if rel = 'contato' then return 'ja_contato'; end if;
  if rel = 'enviada' then return 'ja_enviada'; end if;
  if rel = 'recebida' then
    delete from public.solicitacoes_contato where de_id = alvo and para_id = auth.uid();
    insert into public.contatos (dono_id, contato_id) values (auth.uid(), alvo), (alvo, auth.uid()) on conflict do nothing;
    return 'aceita';
  end if;
  insert into public.solicitacoes_contato (de_id, para_id) values (auth.uid(), alvo);
  return 'ok';
end $$;

-- Aceita a solicitação que a pessoa "de" me enviou. Devolve: ok | inexistente
create or replace function public.aceitar_solicitacao(de uuid)
returns text
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return 'inexistente'; end if;
  delete from public.solicitacoes_contato where de_id = de and para_id = auth.uid();
  if not found then return 'inexistente'; end if;
  insert into public.contatos (dono_id, contato_id) values (auth.uid(), de), (de, auth.uid()) on conflict do nothing;
  return 'ok';
end $$;

-- Recusa a solicitação recebida. Devolve: ok | inexistente
create or replace function public.recusar_solicitacao(de uuid)
returns text
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return 'inexistente'; end if;
  delete from public.solicitacoes_contato where de_id = de and para_id = auth.uid();
  return case when found then 'ok' else 'inexistente' end;
end $$;

-- Cancela a solicitação que eu enviei. Devolve: ok | inexistente
create or replace function public.cancelar_solicitacao(para uuid)
returns text
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return 'inexistente'; end if;
  delete from public.solicitacoes_contato where de_id = auth.uid() and para_id = para;
  return case when found then 'ok' else 'inexistente' end;
end $$;

-- Remove o contato dos dois lados. Devolve: ok | inexistente
create or replace function public.remover_contato(contato uuid)
returns text
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return 'inexistente'; end if;
  delete from public.contatos
    where (dono_id = auth.uid() and contato_id = contato) or (dono_id = contato and contato_id = auth.uid());
  return case when found then 'ok' else 'inexistente' end;
end $$;

-- Solicitações recebidas e enviadas (direcao: recebida | enviada).
create or replace function public.listar_solicitacoes()
returns table (id uuid, nome text, arroba text, foto_path text, direcao text, criado_em timestamptz)
language sql stable security definer set search_path = public as $$
  select p.id, p.nome, p.arroba, p.foto_path, 'recebida', s.criado_em
  from public.solicitacoes_contato s join public.perfis p on p.id = s.de_id where s.para_id = auth.uid()
  union all
  select p.id, p.nome, p.arroba, p.foto_path, 'enviada', s.criado_em
  from public.solicitacoes_contato s join public.perfis p on p.id = s.para_id where s.de_id = auth.uid()
  order by 6 desc;
$$;

create or replace function public.contar_solicitacoes_recebidas()
returns integer
language sql stable security definer set search_path = public as $$
  select count(*)::int from public.solicitacoes_contato where para_id = auth.uid();
$$;

-- Só contatos aceitos trocam mensagens.
drop policy if exists "mensagens_enviar_como_eu" on public.mensagens;
create policy "mensagens_enviar_para_contato" on public.mensagens
  for insert to authenticated
  with check (remetente_id = auth.uid() and exists (
    select 1 from public.contatos c where c.dono_id = auth.uid() and c.contato_id = destinatario_id));

-- Tempo real para as solicitações e para a lista de contatos.
alter publication supabase_realtime add table public.solicitacoes_contato;
alter publication supabase_realtime add table public.contatos;

revoke all on function
  public.relacao_com(uuid), public.buscar_perfil(text), public.sugerir_perfis(text), public.ver_perfil(text),
  public.solicitar_contato(text), public.aceitar_solicitacao(uuid), public.recusar_solicitacao(uuid),
  public.cancelar_solicitacao(uuid), public.remover_contato(uuid), public.listar_solicitacoes(),
  public.contar_solicitacoes_recebidas() from public, anon;
grant execute on function
  public.relacao_com(uuid), public.buscar_perfil(text), public.sugerir_perfis(text), public.ver_perfil(text),
  public.solicitar_contato(text), public.aceitar_solicitacao(uuid), public.recusar_solicitacao(uuid),
  public.cancelar_solicitacao(uuid), public.remover_contato(uuid), public.listar_solicitacoes(),
  public.contar_solicitacoes_recebidas() to authenticated;
