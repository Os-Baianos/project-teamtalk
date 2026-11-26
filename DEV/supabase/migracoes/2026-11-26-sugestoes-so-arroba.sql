-- A busca de contatos passa a ser só pelo @ (não procura mais pelo nome).
create or replace function public.sugerir_perfis(termo text)
returns table (id uuid, nome text, arroba text, foto_path text)
language plpgsql stable security definer set search_path = public as $$
declare
  q text := lower(regexp_replace(trim(coalesce(termo, '')), '^@', ''));
  padrao text;
begin
  if auth.uid() is null or char_length(q) < 2 then return; end if;
  padrao := replace(replace(replace(q, '\', '\\'), '%', '\%'), '_', '\_');
  return query
    select p.id, p.nome, p.arroba, p.foto_path
    from public.perfis p
    where p.id <> auth.uid()
      and p.arroba ilike '%' || padrao || '%'
      and not exists (select 1 from public.contatos c where c.dono_id = auth.uid() and c.contato_id = p.id)
    order by (p.arroba ilike padrao || '%') desc, p.arroba
    limit 5;
end $$;
revoke all on function public.sugerir_perfis(text) from public, anon;
grant execute on function public.sugerir_perfis(text) to authenticated;
