-- Limite do plano Free do Supabase: 50 MB por arquivo. Vídeo passa a ser aceito.
-- Os arquivos duram 7 dias: depois disso ninguém mais abre (esta regra) e eles são apagados do armazenamento.
update storage.buckets set file_size_limit = 52428800, allowed_mime_types = array[
  'image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm','video/quicktime',
  'application/pdf','text/plain','text/csv','application/zip','application/msword','application/vnd.ms-excel','application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation'] where id = 'anexos';

create or replace function public.mensagens_valida_anexo()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.anexo_caminho is not null then
    if split_part(new.anexo_caminho, '/', 1) <> new.remetente_id::text
       or coalesce(new.anexo_tamanho, 0) <= 0 or new.anexo_tamanho > 52428800
       or coalesce(btrim(new.anexo_nome), '') = '' or char_length(new.anexo_nome) > 200 then
      raise exception 'anexo inválido';
    end if;
  else
    new.anexo_nome := null; new.anexo_tipo := null; new.anexo_tamanho := null;
  end if;
  return new;
end $$;
revoke execute on function public.mensagens_valida_anexo() from public, anon, authenticated;

-- Arquivo expirado = mensagem com nome de arquivo mas sem caminho. O texto pode ficar vazio nesse caso.
alter table public.mensagens drop constraint if exists mensagens_texto_check;
alter table public.mensagens add constraint mensagens_texto_check check (
  char_length(btrim(texto)) <= 2000 and (char_length(btrim(texto)) >= 1 or anexo_nome is not null)
);

-- Só abre o arquivo quem participa da conversa e só nos 7 primeiros dias (quem enviou vê a própria pasta).
drop policy if exists anexos_ver_da_conversa on storage.objects;
create policy anexos_ver_da_conversa on storage.objects for select to authenticated
  using (bucket_id = 'anexos' and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or exists (select 1 from public.mensagens m
               where m.anexo_caminho = storage.objects.name and m.criado_em > now() - interval '7 days')));

create or replace function public.editar_mensagem(msg uuid, novo text)
returns boolean language plpgsql security definer set search_path = public as $$
declare n int;
begin
  novo := btrim(coalesce(novo, ''));
  if char_length(novo) > 2000 then return false; end if;
  update public.mensagens set texto = novo, editada_em = now()
  where id = msg and remetente_id = auth.uid() and apagada_em is null
    and (novo <> '' or anexo_nome is not null);
  get diagnostics n = row_count;
  return n > 0;
end $$;

-- Depois que o arquivo sai do armazenamento, a mensagem guarda só o nome ("Arquivo expirado").
create or replace function public.anexos_marcar_expirados(caminhos text[])
returns integer language plpgsql security definer set search_path = public as $$
declare n int;
begin
  update public.mensagens set anexo_caminho = null
  where remetente_id = auth.uid() and anexo_caminho = any(caminhos) and criado_em <= now() - interval '7 days';
  get diagnostics n = row_count;
  return n;
end $$;
revoke all on function public.anexos_marcar_expirados(text[]) from public, anon;
grant execute on function public.anexos_marcar_expirados(text[]) to authenticated;

-- Prévia da conversa: "Foto", "Vídeo" ou o nome do arquivo.
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
         when btrim(u.texto) = '' and u.anexo_nome is not null then
           case when u.anexo_tipo like 'image/%' then 'Foto' when u.anexo_tipo like 'video/%' then 'Vídeo' else u.anexo_nome end
         else u.texto end,
    u.criado_em,
    (select count(*) from minhas x where x.outro = p.id and x.destinatario_id = auth.uid() and x.lida_em is null and x.apagada_em is null),
    (u.remetente_id = auth.uid()),
    case when u.lida_em is not null then 'lida' when u.recebida_em is not null then 'recebida' else 'enviada' end,
    p.foto_path
  from ult u join public.perfis p on p.id = u.outro
  order by u.criado_em desc;
$$;
