-- Sugestões ao digitar na busca de contatos + foto nas buscas e na lista de contatos.
create extension if not exists unaccent with schema extensions;

drop function if exists public.buscar_perfil(text);
drop function if exists public.listar_contatos();

create or replace function public.buscar_perfil(candidato text)
returns table (id uuid, nome text, arroba text, foto_path text)
language sql stable security definer set search_path = public as $$
  select p.id, p.nome, p.arroba, p.foto_path from public.perfis p
  where p.arroba = lower(regexp_replace(trim(candidato), '^@', ''))
    and p.id <> auth.uid()
    and auth.uid() is not null;
$$;

create or replace function public.listar_contatos()
returns table (id uuid, nome text, arroba text, foto_path text)
language sql stable security definer set search_path = public as $$
  select p.id, p.nome, p.arroba, p.foto_path
  from public.contatos c join public.perfis p on p.id = c.contato_id
  where c.dono_id = auth.uid()
  order by p.nome;
$$;

-- Até 5 sugestões por parte do @ ou do nome (sem acento e sem diferenciar maiúscula).
-- Não devolve a própria pessoa nem quem já é contato. Exige 2 letras ou mais.
create or replace function public.sugerir_perfis(termo text)
returns table (id uuid, nome text, arroba text, foto_path text)
language plpgsql stable security definer set search_path = public, extensions as $$
declare
  q text := lower(regexp_replace(trim(coalesce(termo, '')), '^@', ''));
  padrao text;
begin
  if auth.uid() is null or char_length(q) < 2 then return; end if;
  padrao := '%' || replace(replace(replace(q, '\', '\\'), '%', '\%'), '_', '\_') || '%';
  return query
    select p.id, p.nome, p.arroba, p.foto_path
    from public.perfis p
    where p.id <> auth.uid()
      and (p.arroba ilike padrao or unaccent(lower(p.nome)) ilike unaccent(padrao))
      and not exists (select 1 from public.contatos c where c.dono_id = auth.uid() and c.contato_id = p.id)
    order by (p.arroba ilike (substr(padrao, 2))) desc, p.nome
    limit 5;
end $$;

revoke all on function public.buscar_perfil(text), public.listar_contatos(), public.sugerir_perfis(text) from public, anon;
grant execute on function public.buscar_perfil(text), public.listar_contatos(), public.sugerir_perfis(text) to authenticated;
