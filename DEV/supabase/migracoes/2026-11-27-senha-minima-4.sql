-- Senha: só o mínimo de 4 caracteres (máximo 72, limite do bcrypt). Sem exigir maiúscula, número ou símbolo.
create or replace function public.dev_trocar_senha(alvo uuid, nova text)
returns text language plpgsql security definer set search_path = public, extensions as $$
begin
  if not public.sou_dev() then return 'negado'; end if;
  if nova is null or char_length(nova) < 4 or char_length(nova) > 72 then return 'senha_fraca'; end if;
  update auth.users set encrypted_password = crypt(nova, gen_salt('bf')), updated_at = now() where id = alvo;
  if not found then return 'inexistente'; end if;
  delete from auth.sessions where user_id = alvo;
  return 'ok';
end $$;

-- Trocar a própria senha (o app confere a senha atual antes). Passa por aqui porque o Auth do Supabase
-- tem um mínimo próprio de caracteres que não dá para baixar a 4 por código.
create or replace function public.trocar_minha_senha(nova text)
returns text language plpgsql security definer set search_path = public, extensions as $$
begin
  if auth.uid() is null then return 'negado'; end if;
  if nova is null or char_length(nova) < 4 or char_length(nova) > 72 then return 'senha_fraca'; end if;
  update auth.users set encrypted_password = crypt(nova, gen_salt('bf')), updated_at = now() where id = auth.uid();
  return 'ok';
end $$;
revoke all on function public.trocar_minha_senha(text) from public, anon;
grant execute on function public.trocar_minha_senha(text) to authenticated;

-- Função de gatilho não precisa ser chamável pela API.
revoke execute on function public.mensagens_valida_anexo() from public, anon, authenticated;
