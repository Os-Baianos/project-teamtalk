-- Issue #120: contatos (buscar por @, adicionar, listar, remover) com RLS.

create table if not exists public.contatos (
  dono_id uuid not null references public.perfis(id) on delete cascade,
  contato_id uuid not null references public.perfis(id) on delete cascade,
  criado_em timestamptz not null default now(),
  primary key (dono_id, contato_id),
  constraint contato_nao_e_o_dono check (dono_id <> contato_id)
);

alter table public.contatos enable row level security;

create policy "contatos_ver_proprios" on public.contatos
  for select to authenticated using (dono_id = auth.uid());
create policy "contatos_adicionar_proprios" on public.contatos
  for insert to authenticated with check (dono_id = auth.uid());
create policy "contatos_remover_proprios" on public.contatos
  for delete to authenticated using (dono_id = auth.uid());

-- Busca um usuário pelo @ (sem expor a lista inteira de perfis).
create or replace function public.buscar_perfil(candidato text)
returns table (id uuid, nome text, arroba text)
language sql stable security definer set search_path = public as $$
  select p.id, p.nome, p.arroba from public.perfis p
  where p.arroba = lower(regexp_replace(trim(candidato), '^@', ''))
    and p.id <> auth.uid()
    and auth.uid() is not null;
$$;

-- Lista os contatos de quem está logado.
create or replace function public.listar_contatos()
returns table (id uuid, nome text, arroba text)
language sql stable security definer set search_path = public as $$
  select p.id, p.nome, p.arroba
  from public.contatos c join public.perfis p on p.id = c.contato_id
  where c.dono_id = auth.uid()
  order by p.nome;
$$;

-- Adiciona por @. Devolve: ok | inexistente | proprio | duplicado
create or replace function public.adicionar_contato(candidato text)
returns text
language plpgsql security definer set search_path = public as $$
declare
  alvo uuid;
begin
  if auth.uid() is null then return 'inexistente'; end if;
  select id into alvo from public.perfis
    where arroba = lower(regexp_replace(trim(candidato), '^@', ''));
  if alvo is null then return 'inexistente'; end if;
  if alvo = auth.uid() then return 'proprio'; end if;
  insert into public.contatos (dono_id, contato_id) values (auth.uid(), alvo)
    on conflict do nothing;
  if not found then return 'duplicado'; end if;
  return 'ok';
end $$;

revoke all on function public.buscar_perfil(text), public.listar_contatos(), public.adicionar_contato(text) from public, anon;
grant execute on function public.buscar_perfil(text), public.listar_contatos(), public.adicionar_contato(text) to authenticated;

-- Permissões da tabela (a RLS limita cada pessoa às próprias linhas).
grant select, delete on public.contatos to authenticated;
