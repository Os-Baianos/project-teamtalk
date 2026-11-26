-- Status das mensagens (enviada / recebida / lida), edição e exclusão.
-- Só adiciona colunas e funções; nada existente é apagado.

alter table public.mensagens
  add column if not exists recebida_em timestamptz,
  add column if not exists editada_em timestamptz,
  add column if not exists apagada_em timestamptz;

-- Marca como recebidas tudo o que chegou para mim (chamada ao abrir o app/lista).
create or replace function public.marcar_recebidas()
returns void language sql security definer set search_path = public as $$
  update public.mensagens set recebida_em = now()
  where destinatario_id = auth.uid() and recebida_em is null;
$$;

-- Ler também conta como recebida.
create or replace function public.marcar_lidas(de uuid)
returns void language sql security definer set search_path = public as $$
  update public.mensagens
  set lida_em = now(), recebida_em = coalesce(recebida_em, now())
  where destinatario_id = auth.uid() and remetente_id = de and lida_em is null;
$$;

-- Só quem enviou edita; mensagem apagada não pode ser editada.
create or replace function public.editar_mensagem(msg uuid, novo text)
returns boolean language plpgsql security definer set search_path = public as $$
declare n int;
begin
  novo := btrim(coalesce(novo, ''));
  if novo = '' or char_length(novo) > 2000 then return false; end if;
  update public.mensagens set texto = novo, editada_em = now()
  where id = msg and remetente_id = auth.uid() and apagada_em is null;
  get diagnostics n = row_count;
  return n > 0;
end $$;

-- Apagar para todos: só quem enviou; o texto some, fica o aviso.
create or replace function public.apagar_mensagem(msg uuid)
returns boolean language plpgsql security definer set search_path = public as $$
declare n int;
begin
  update public.mensagens set texto = 'Mensagem apagada', apagada_em = now()
  where id = msg and remetente_id = auth.uid() and apagada_em is null;
  get diagnostics n = row_count;
  return n > 0;
end $$;

drop function if exists public.listar_conversas();
create function public.listar_conversas()
returns table(contato_id uuid, nome text, arroba text, ultima_texto text, ultima_em timestamptz,
              nao_lidas bigint, ultima_minha boolean, ultima_status text, foto_path text)
language sql stable security definer set search_path = public as $$
  with minhas as (
    select m.*, case when m.remetente_id = auth.uid() then m.destinatario_id else m.remetente_id end as outro
    from public.mensagens m where auth.uid() in (m.remetente_id, m.destinatario_id)
  ), ult as (
    select distinct on (outro) * from minhas order by outro, criado_em desc
  )
  select p.id, p.nome, p.arroba,
    case when u.apagada_em is not null then 'Mensagem apagada' else u.texto end,
    u.criado_em,
    (select count(*) from minhas x where x.outro = p.id and x.destinatario_id = auth.uid() and x.lida_em is null and x.apagada_em is null),
    (u.remetente_id = auth.uid()),
    case when u.lida_em is not null then 'lida' when u.recebida_em is not null then 'recebida' else 'enviada' end,
    p.foto_path
  from ult u join public.perfis p on p.id = u.outro
  order by u.criado_em desc;
$$;

revoke all on function public.marcar_recebidas(), public.editar_mensagem(uuid, text), public.apagar_mensagem(uuid), public.listar_conversas() from public, anon;
grant execute on function public.marcar_recebidas(), public.editar_mensagem(uuid, text), public.apagar_mensagem(uuid), public.listar_conversas() to authenticated;
grant execute on function public.marcar_lidas(uuid) to authenticated;
