-- Ver o perfil de outra pessoa pelo @ (sem e-mail). "contato" diz se já está na lista de quem pediu.
create or replace function public.ver_perfil(candidato text)
returns table (id uuid, nome text, arroba text, foto_path text, criado_em timestamptz, contato boolean)
language sql stable security definer set search_path = public as $$
  select p.id, p.nome, p.arroba, p.foto_path, p.criado_em,
         exists (select 1 from public.contatos c where c.dono_id = auth.uid() and c.contato_id = p.id)
  from public.perfis p
  where p.arroba = lower(regexp_replace(trim(candidato), '^@', ''))
    and auth.uid() is not null;
$$;
revoke all on function public.ver_perfil(text) from public, anon;
grant execute on function public.ver_perfil(text) to authenticated;
