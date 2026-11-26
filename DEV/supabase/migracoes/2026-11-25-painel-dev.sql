-- Contas "dev": poder total sobre os usuários. Não dá para criar pelo site; só direto no banco.
alter table public.perfis add column if not exists papel text not null default 'usuario'
  check (papel in ('usuario', 'dev'));

create or replace function public.sou_dev()
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.perfis where id = auth.uid() and papel = 'dev');
$$;

create or replace function public.dev_listar_usuarios()
returns table (id uuid, nome text, arroba text, email text, papel text, criado_em timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.sou_dev() then raise exception 'sem permissao'; end if;
  return query
    select p.id, p.nome, p.arroba, u.email::text, p.papel, p.criado_em
    from public.perfis p join auth.users u on u.id = p.id
    order by p.criado_em desc;
end $$;

-- Devolve: ok | negado | proprio | inexistente
create or replace function public.dev_excluir_usuario(alvo uuid)
returns text
language plpgsql security definer set search_path = public as $$
begin
  if not public.sou_dev() then return 'negado'; end if;
  if alvo = auth.uid() then return 'proprio'; end if;
  delete from auth.users where id = alvo;
  if not found then return 'inexistente'; end if;
  return 'ok';
end $$;

-- Devolve: ok | negado | nome_invalido | arroba_invalido | arroba_em_uso | inexistente
create or replace function public.dev_editar_usuario(alvo uuid, novo_nome text, novo_arroba text)
returns text
language plpgsql security definer set search_path = public as $$
declare
  a text := lower(regexp_replace(trim(novo_arroba), '^@', ''));
  n text := trim(novo_nome);
begin
  if not public.sou_dev() then return 'negado'; end if;
  if char_length(n) < 3 or char_length(n) > 80 then return 'nome_invalido'; end if;
  if a !~ '^[a-z0-9._]{3,30}$' then return 'arroba_invalido'; end if;
  update public.perfis set nome = n, arroba = a where id = alvo;
  if not found then return 'inexistente'; end if;
  return 'ok';
exception when unique_violation then
  return 'arroba_em_uso';
end $$;

revoke all on function public.sou_dev(), public.dev_listar_usuarios(), public.dev_excluir_usuario(uuid), public.dev_editar_usuario(uuid, text, text) from public, anon;
grant execute on function public.sou_dev(), public.dev_listar_usuarios(), public.dev_excluir_usuario(uuid), public.dev_editar_usuario(uuid, text, text) to authenticated;

-- Conta dev inicial (rodar depois que a conta existir).
update public.perfis set papel = 'dev'
where id = (select id from auth.users where email = 'acebmoon@dev.teamtalk.com');
