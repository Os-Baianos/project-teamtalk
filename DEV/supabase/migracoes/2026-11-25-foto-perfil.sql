-- Foto de perfil: coluna, bucket público "avatares" e função para trocar/remover.
alter table public.perfis add column if not exists foto_path text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatares', 'avatares', true, 2097152, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

-- Cada pessoa mexe só na própria pasta (nome da pasta = id da pessoa).
create policy "avatares_enviar_na_propria_pasta" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatares' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatares_trocar_na_propria_pasta" on storage.objects for update to authenticated
  using (bucket_id = 'avatares' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatares_apagar_da_propria_pasta" on storage.objects for delete to authenticated
  using (bucket_id = 'avatares' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatares_listar_propria_pasta" on storage.objects for select to authenticated
  using (bucket_id = 'avatares' and (storage.foldername(name))[1] = auth.uid()::text);

create or replace function public.definir_foto(caminho text)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return; end if;
  if caminho is not null and split_part(caminho, '/', 1) <> auth.uid()::text then
    raise exception 'caminho invalido';
  end if;
  update public.perfis set foto_path = caminho where id = auth.uid();
end $$;
revoke all on function public.definir_foto(text) from public, anon;
grant execute on function public.definir_foto(text) to authenticated;
