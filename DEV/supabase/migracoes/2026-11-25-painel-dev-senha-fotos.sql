-- Painel dev: trocar a senha de outra conta e apagar as fotos de quem é excluído.

-- Devolve: ok | negado | senha_fraca | inexistente
create or replace function public.dev_trocar_senha(alvo uuid, nova text)
returns text
language plpgsql security definer set search_path = public, extensions as $$
begin
  if not public.sou_dev() then return 'negado'; end if;
  if nova is null or char_length(nova) < 6 or nova !~ '[A-Z]' or nova !~ '[a-z]' or nova !~ '[0-9]' or nova !~ '[^A-Za-z0-9]' then
    return 'senha_fraca';
  end if;
  update auth.users set encrypted_password = crypt(nova, gen_salt('bf')), updated_at = now() where id = alvo;
  if not found then return 'inexistente'; end if;
  delete from auth.sessions where user_id = alvo; -- desconecta a pessoa de onde estiver logada
  return 'ok';
end $$;

revoke all on function public.dev_trocar_senha(uuid, text) from public, anon;
grant execute on function public.dev_trocar_senha(uuid, text) to authenticated;

-- Contas dev podem listar e apagar qualquer foto de perfil (para limpar ao excluir uma conta).
create policy "avatares_dev_listar" on storage.objects for select to authenticated
  using (bucket_id = 'avatares' and public.sou_dev());
create policy "avatares_dev_apagar" on storage.objects for delete to authenticated
  using (bucket_id = 'avatares' and public.sou_dev());
