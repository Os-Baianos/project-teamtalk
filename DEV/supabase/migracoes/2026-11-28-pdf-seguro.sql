-- Issue #204: PDFs passam pelo endpoint server-side, que confere os bytes antes de criar a mensagem.
-- O bucket e as colunas de anexo existentes são reutilizados.

-- Não permita que clientes autenticados anexem PDFs declarando o MIME no upload direto.
-- Uploads de fotos e vídeos continuam usando a policy já existente.
drop policy if exists anexos_enviar_na_propria_pasta on storage.objects;
create policy anexos_enviar_na_propria_pasta on storage.objects for insert to authenticated
  with check (
    bucket_id = 'anexos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and coalesce(metadata->>'mimetype', '') <> 'application/pdf'
  );

-- PDFs permanecem disponíveis no histórico; os demais anexos mantêm a retenção de 7 dias.
drop policy if exists anexos_ver_da_conversa on storage.objects;
create policy anexos_ver_da_conversa on storage.objects for select to authenticated
  using (bucket_id = 'anexos' and (
    ((storage.foldername(name))[1] = (select auth.uid())::text and lower(name) not like '%.pdf')
    or exists (
      select 1 from public.mensagens m
      where m.anexo_caminho = storage.objects.name
        and (m.anexo_tipo = 'application/pdf' or m.criado_em > now() - interval '7 days')
    )
  ));

create or replace function public.anexos_marcar_expirados(caminhos text[])
returns integer language plpgsql security definer set search_path = public as $$
declare n int;
begin
  update public.mensagens set anexo_caminho = null
  where remetente_id = auth.uid()
    and anexo_caminho = any(caminhos)
    and anexo_tipo is distinct from 'application/pdf'
    and criado_em <= now() - interval '7 days';
  get diagnostics n = row_count;
  return n;
end $$;
revoke all on function public.anexos_marcar_expirados(text[]) from public, anon;
grant execute on function public.anexos_marcar_expirados(text[]) to authenticated;

-- O endpoint é idempotente: um request id só pode produzir uma mensagem PDF.
create unique index if not exists mensagens_pdf_caminho_unico
  on public.mensagens (anexo_caminho)
  where anexo_tipo = 'application/pdf' and anexo_caminho is not null;

-- Mantenha o limite de 50 MiB para mídia atual, mas aplique 10 MiB aos PDFs.
create or replace function public.mensagens_valida_anexo()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  papel text := coalesce(current_setting('request.jwt.claim.role', true), '');
begin
  if new.anexo_caminho is null then
    new.anexo_nome := null;
    new.anexo_tipo := null;
    new.anexo_tamanho := null;
    return new;
  end if;

  if split_part(new.anexo_caminho, '/', 1) <> new.remetente_id::text
     or coalesce(new.anexo_tamanho, 0) <= 0
     or coalesce(btrim(new.anexo_nome), '') = ''
     or char_length(new.anexo_nome) > 200 then
    raise exception 'anexo inválido';
  end if;

  if new.anexo_tipo = 'application/pdf' then
    if papel <> 'service_role'
       or new.anexo_tamanho > 10485760
       or lower(new.anexo_nome) not like '%.pdf'
       or lower(new.anexo_caminho) not like '%.pdf' then
      raise exception 'PDF deve ser validado pelo servidor e ter até 10 MiB';
    end if;
  elsif new.anexo_tipo is null or new.anexo_tipo not in (
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'video/mp4', 'video/webm', 'video/quicktime'
  ) or new.anexo_tamanho > 52428800 or lower(new.anexo_nome) like '%.pdf' then
    raise exception 'tipo ou tamanho de anexo inválido';
  end if;
  return new;
end $$;
revoke execute on function public.mensagens_valida_anexo() from public, anon, authenticated;
