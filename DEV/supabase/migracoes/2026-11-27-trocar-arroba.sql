-- Troca de @ (usuário): cada pessoa pode trocar o próprio @ e só pode trocar de novo depois de 30 dias.
-- Quem tem conta DEV/Admin troca o @ de qualquer pessoa sem esperar (dev_editar_usuario) e pode zerar
-- a contagem (dev_liberar_troca_arroba) para a pessoa trocar de novo na hora.
alter table public.perfis add column if not exists arroba_alterado_em timestamptz;

-- Devolve: ok | invalido | igual | em_uso | aguarde
create or replace function public.definir_arroba(novo text)
returns text
language plpgsql security definer set search_path = public as $$
declare
  a text := lower(regexp_replace(trim(coalesce(novo, '')), '^@', ''));
  atual record;
begin
  if auth.uid() is null then return 'invalido'; end if;
  if a !~ '^[a-z][a-z0-9._]{2,19}$' then return 'invalido'; end if;
  select arroba, arroba_alterado_em into atual from public.perfis where id = auth.uid();
  if not found then return 'invalido'; end if;
  if atual.arroba = a then return 'igual'; end if;
  if atual.arroba_alterado_em is not null and now() < atual.arroba_alterado_em + interval '30 days' then
    return 'aguarde';
  end if;
  update public.perfis set arroba = a, arroba_alterado_em = now() where id = auth.uid();
  return 'ok';
exception when unique_violation then
  return 'em_uso';
end $$;

-- Admin: zera a contagem dos 30 dias. Devolve: ok | negado | inexistente
create or replace function public.dev_liberar_troca_arroba(alvo uuid)
returns text
language plpgsql security definer set search_path = public as $$
begin
  if not public.sou_dev() then return 'negado'; end if;
  update public.perfis set arroba_alterado_em = null where id = alvo;
  if not found then return 'inexistente'; end if;
  return 'ok';
end $$;

-- A lista do Admin passa a mostrar quando a pessoa trocou o @ pela última vez.
drop function if exists public.dev_listar_usuarios();
create function public.dev_listar_usuarios()
returns table (id uuid, nome text, arroba text, email text, papel text, criado_em timestamptz, foto_path text, arroba_alterado_em timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.sou_dev() then raise exception 'sem permissao'; end if;
  return query
    select p.id, p.nome, p.arroba, u.email::text, p.papel, p.criado_em, p.foto_path, p.arroba_alterado_em
    from public.perfis p join auth.users u on u.id = p.id
    order by p.criado_em desc;
end $$;

revoke all on function public.definir_arroba(text), public.dev_liberar_troca_arroba(uuid), public.dev_listar_usuarios() from public, anon;
grant execute on function public.definir_arroba(text), public.dev_liberar_troca_arroba(uuid), public.dev_listar_usuarios() to authenticated;
