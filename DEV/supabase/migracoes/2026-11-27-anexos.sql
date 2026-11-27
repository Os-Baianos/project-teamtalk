-- Anexos nas mensagens: imagens, PDF e arquivos (até 10 MB), em bucket privado.
alter table public.mensagens
  add column if not exists anexo_caminho text,
  add column if not exists anexo_nome text,
  add column if not exists anexo_tipo text,
  add column if not exists anexo_tamanho integer;

-- Mensagem só com anexo pode ter texto vazio (legenda opcional).
alter table public.mensagens drop constraint if exists mensagens_texto_check;
alter table public.mensagens add constraint mensagens_texto_check check (
  char_length(btrim(texto)) <= 2000 and (char_length(btrim(texto)) >= 1 or anexo_caminho is not null)
);

-- O arquivo precisa estar na pasta de quem envia e dentro do limite.
create or replace function public.mensagens_valida_anexo()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.anexo_caminho is not null then
    if split_part(new.anexo_caminho, '/', 1) <> new.remetente_id::text
       or coalesce(new.anexo_tamanho, 0) <= 0 or new.anexo_tamanho > 10485760
       or coalesce(btrim(new.anexo_nome), '') = '' or char_length(new.anexo_nome) > 200 then
      raise exception 'anexo inválido';
    end if;
  else
    new.anexo_nome := null; new.anexo_tipo := null; new.anexo_tamanho := null;
  end if;
  return new;
end $$;

drop trigger if exists mensagens_valida_anexo on public.mensagens;
create trigger mensagens_valida_anexo before insert on public.mensagens
  for each row execute function public.mensagens_valida_anexo();

-- Bucket privado: só quem participa da conversa abre o arquivo (por link assinado, que expira).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('anexos', 'anexos', false, 10485760, array[
  'image/jpeg','image/png','image/webp','image/gif','application/pdf','text/plain','text/csv',
  'application/zip','application/msword','application/vnd.ms-excel','application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists anexos_enviar_na_propria_pasta on storage.objects;
create policy anexos_enviar_na_propria_pasta on storage.objects for insert to authenticated
  with check (bucket_id = 'anexos' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists anexos_ver_da_conversa on storage.objects;
create policy anexos_ver_da_conversa on storage.objects for select to authenticated
  using (bucket_id = 'anexos' and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or exists (select 1 from public.mensagens m where m.anexo_caminho = storage.objects.name)));

drop policy if exists anexos_apagar_da_propria_pasta on storage.objects;
create policy anexos_apagar_da_propria_pasta on storage.objects for delete to authenticated
  using (bucket_id = 'anexos' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- Editar: só a legenda; pode ficar vazia se a mensagem tem anexo.
create or replace function public.editar_mensagem(msg uuid, novo text)
returns boolean language plpgsql security definer set search_path = public as $$
declare n int;
begin
  novo := btrim(coalesce(novo, ''));
  if char_length(novo) > 2000 then return false; end if;
  update public.mensagens set texto = novo, editada_em = now()
  where id = msg and remetente_id = auth.uid() and apagada_em is null
    and (novo <> '' or anexo_caminho is not null);
  get diagnostics n = row_count;
  return n > 0;
end $$;

-- Apagar também tira o acesso ao arquivo (o app remove o arquivo do bucket em seguida).
create or replace function public.apagar_mensagem(msg uuid)
returns boolean language plpgsql security definer set search_path = public as $$
declare n int;
begin
  update public.mensagens set texto = 'Mensagem apagada', apagada_em = now(),
    anexo_caminho = null, anexo_nome = null, anexo_tipo = null, anexo_tamanho = null
  where id = msg and remetente_id = auth.uid() and apagada_em is null;
  get diagnostics n = row_count;
  return n > 0;
end $$;

-- Prévia da conversa: "Foto" ou o nome do arquivo quando não há texto.
create or replace function public.listar_conversas()
returns table(contato_id uuid, nome text, arroba text, ultima_texto text, ultima_em timestamptz, nao_lidas bigint, ultima_minha boolean, ultima_status text, foto_path text)
language sql stable security definer set search_path = public as $$
  with minhas as (
    select m.*, case when m.remetente_id = auth.uid() then m.destinatario_id else m.remetente_id end as outro
    from public.mensagens m
    where auth.uid() in (m.remetente_id, m.destinatario_id)
      and m.criado_em > coalesce((select c.limpa_ate from public.conversas_limpas c
        where c.dono_id = auth.uid() and c.outro_id = case when m.remetente_id = auth.uid() then m.destinatario_id else m.remetente_id end), '-infinity')
  ), ult as (
    select distinct on (outro) * from minhas order by outro, criado_em desc
  )
  select p.id, p.nome, p.arroba,
    case when u.apagada_em is not null then 'Mensagem apagada'
         when btrim(u.texto) = '' and u.anexo_caminho is not null then
           case when u.anexo_tipo like 'image/%' then 'Foto' else u.anexo_nome end
         else u.texto end,
    u.criado_em,
    (select count(*) from minhas x where x.outro = p.id and x.destinatario_id = auth.uid() and x.lida_em is null and x.apagada_em is null),
    (u.remetente_id = auth.uid()),
    case when u.lida_em is not null then 'lida' when u.recebida_em is not null then 'recebida' else 'enviada' end,
    p.foto_path
  from ult u join public.perfis p on p.id = u.outro
  order by u.criado_em desc;
$$;
