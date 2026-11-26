-- Excluir conversa só do meu lado: guarda até quando eu "limpei" cada conversa.
-- As mensagens continuam no banco (a outra pessoa segue vendo); para mim só aparecem as mais novas.

create table if not exists public.conversas_limpas (
  dono_id uuid not null references auth.users(id) on delete cascade,
  outro_id uuid not null references auth.users(id) on delete cascade,
  limpa_ate timestamptz not null default now(),
  primary key (dono_id, outro_id)
);
alter table public.conversas_limpas enable row level security;
create policy conversas_limpas_ver_minhas on public.conversas_limpas for select using (dono_id = auth.uid());
revoke all on public.conversas_limpas from anon, authenticated;
grant select on public.conversas_limpas to authenticated;

create or replace function public.limpar_conversa(outro uuid)
returns void language sql security definer set search_path = public as $$
  insert into public.conversas_limpas(dono_id, outro_id, limpa_ate) values (auth.uid(), outro, now())
  on conflict (dono_id, outro_id) do update set limpa_ate = now();
$$;

-- Histórico com uma pessoa, sem o que eu já excluí.
create or replace function public.listar_mensagens(outro uuid)
returns setof public.mensagens language sql stable security invoker set search_path = public as $$
  select m.* from public.mensagens m
  where ((m.remetente_id = auth.uid() and m.destinatario_id = outro) or (m.remetente_id = outro and m.destinatario_id = auth.uid()))
    and m.criado_em > coalesce((select c.limpa_ate from public.conversas_limpas c where c.dono_id = auth.uid() and c.outro_id = outro), '-infinity')
  order by m.criado_em asc
  limit 500;
$$;

-- A lista também ignora o que foi excluído.
create or replace function public.listar_conversas()
returns table(contato_id uuid, nome text, arroba text, ultima_texto text, ultima_em timestamptz,
              nao_lidas bigint, ultima_minha boolean, ultima_status text, foto_path text)
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
    case when u.apagada_em is not null then 'Mensagem apagada' else u.texto end,
    u.criado_em,
    (select count(*) from minhas x where x.outro = p.id and x.destinatario_id = auth.uid() and x.lida_em is null and x.apagada_em is null),
    (u.remetente_id = auth.uid()),
    case when u.lida_em is not null then 'lida' when u.recebida_em is not null then 'recebida' else 'enviada' end,
    p.foto_path
  from ult u join public.perfis p on p.id = u.outro
  order by u.criado_em desc;
$$;

-- Remover contato também exclui a conversa, só do meu lado.
create or replace function public.remover_contato(contato uuid)
returns text language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return 'inexistente'; end if;
  delete from public.contatos
    where (dono_id = auth.uid() and contato_id = contato) or (dono_id = contato and contato_id = auth.uid());
  if not found then return 'inexistente'; end if;
  insert into public.conversas_limpas(dono_id, outro_id, limpa_ate) values (auth.uid(), contato, now())
  on conflict (dono_id, outro_id) do update set limpa_ate = now();
  return 'ok';
end $$;

revoke all on function public.limpar_conversa(uuid), public.listar_mensagens(uuid), public.listar_conversas(), public.remover_contato(uuid) from public, anon;
grant execute on function public.limpar_conversa(uuid), public.listar_mensagens(uuid), public.listar_conversas(), public.remover_contato(uuid) to authenticated;
