-- Responder a uma mensagem: a nova mensagem guarda o id da original (responde_a).
alter table public.mensagens add column if not exists responde_a uuid references public.mensagens(id) on delete set null;

-- Só vale responder a uma mensagem da mesma conversa; qualquer outra coisa é ignorada.
create or replace function public.mensagens_valida_resposta()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.responde_a is not null and not exists (
    select 1 from public.mensagens o
    where o.id = new.responde_a
      and ((o.remetente_id = new.remetente_id and o.destinatario_id = new.destinatario_id)
        or (o.remetente_id = new.destinatario_id and o.destinatario_id = new.remetente_id))
  ) then
    new.responde_a := null;
  end if;
  return new;
end $$;

drop trigger if exists mensagens_valida_resposta on public.mensagens;
create trigger mensagens_valida_resposta before insert on public.mensagens
  for each row execute function public.mensagens_valida_resposta();

-- Recria para o histórico trazer a nova coluna.
create or replace function public.listar_mensagens(outro uuid)
returns setof public.mensagens language sql stable security invoker set search_path = public as $$
  select m.* from public.mensagens m
  where ((m.remetente_id = auth.uid() and m.destinatario_id = outro) or (m.remetente_id = outro and m.destinatario_id = auth.uid()))
    and m.criado_em > coalesce((select c.limpa_ate from public.conversas_limpas c where c.dono_id = auth.uid() and c.outro_id = outro), '-infinity')
  order by m.criado_em asc
  limit 500;
$$;
grant execute on function public.listar_mensagens(uuid) to authenticated;
