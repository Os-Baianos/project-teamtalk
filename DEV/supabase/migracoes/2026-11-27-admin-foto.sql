-- Admin (antigo Painel Dev): a lista de usuários passa a trazer a foto de perfil.
drop function if exists public.dev_listar_usuarios();
create function public.dev_listar_usuarios()
returns table (id uuid, nome text, arroba text, email text, papel text, criado_em timestamptz, foto_path text)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.sou_dev() then raise exception 'sem permissao'; end if;
  return query
    select p.id, p.nome, p.arroba, u.email::text, p.papel, p.criado_em, p.foto_path
    from public.perfis p join auth.users u on u.id = p.id
    order by p.criado_em desc;
end $$;
revoke all on function public.dev_listar_usuarios() from public, anon;
grant execute on function public.dev_listar_usuarios() to authenticated;
