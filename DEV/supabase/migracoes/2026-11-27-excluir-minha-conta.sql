-- Cada pessoa pode excluir a própria conta (Configurações). O restante (perfil, contatos, mensagens,
-- aparelhos de notificação) é apagado em cascata pelas chaves estrangeiras. Devolve: ok | inexistente
create or replace function public.excluir_minha_conta()
returns text
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return 'inexistente'; end if;
  delete from auth.users where id = auth.uid();
  if not found then return 'inexistente'; end if;
  return 'ok';
end $$;
revoke all on function public.excluir_minha_conta() from public, anon;
grant execute on function public.excluir_minha_conta() to authenticated;
