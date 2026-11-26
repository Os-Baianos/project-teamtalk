-- Cada pessoa troca o próprio nome. Devolve: ok | nome_invalido
create or replace function public.definir_nome(novo text)
returns text
language plpgsql security definer set search_path = public as $$
declare n text := regexp_replace(trim(coalesce(novo, '')), '\s+', ' ', 'g');
begin
  if auth.uid() is null then return 'nome_invalido'; end if;
  if char_length(n) < 5 or char_length(n) > 80 or n !~ '\S+\s+\S+' then return 'nome_invalido'; end if;
  update public.perfis set nome = n where id = auth.uid();
  return 'ok';
end $$;
revoke all on function public.definir_nome(text) from public, anon;
grant execute on function public.definir_nome(text) to authenticated;
