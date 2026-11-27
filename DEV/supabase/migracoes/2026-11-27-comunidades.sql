-- Comunidades: grupos de conversa criados por Admin/DEV. Membros escrevem (ou só admins, se o chat estiver fechado).
create table if not exists public.grupos (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (char_length(btrim(nome)) between 1 and 60),
  foto_path text,
  so_admins boolean not null default false,
  criado_por uuid references public.perfis(id) on delete set null,
  criado_em timestamptz not null default now()
);
create table if not exists public.grupo_membros (
  grupo_id uuid not null references public.grupos(id) on delete cascade,
  usuario_id uuid not null references public.perfis(id) on delete cascade,
  entrou_em timestamptz not null default now(),
  lida_ate timestamptz not null default now(),
  primary key (grupo_id, usuario_id)
);
create index if not exists grupo_membros_usuario on public.grupo_membros(usuario_id);
alter table public.grupos enable row level security;
alter table public.grupo_membros enable row level security;

-- Funções de apoio (evitam recursão nas regras de acesso).
create or replace function public.sou_membro(g uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.grupo_membros where grupo_id = g and usuario_id = auth.uid());
$$;
create or replace function public.pode_ver_msg_grupo(g uuid, quando timestamptz) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.grupo_membros where grupo_id = g and usuario_id = auth.uid() and entrou_em <= quando);
$$;
create or replace function public.pode_escrever_grupo(g uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.grupo_membros m join public.grupos x on x.id = m.grupo_id
    where m.grupo_id = g and m.usuario_id = auth.uid() and (not x.so_admins or public.sou_dev()));
$$;
revoke all on function public.sou_membro(uuid), public.pode_ver_msg_grupo(uuid, timestamptz), public.pode_escrever_grupo(uuid) from public, anon;
grant execute on function public.sou_membro(uuid), public.pode_ver_msg_grupo(uuid, timestamptz), public.pode_escrever_grupo(uuid) to authenticated;

drop policy if exists grupos_ver on public.grupos;
create policy grupos_ver on public.grupos for select to authenticated using (public.sou_membro(id));
drop policy if exists grupo_membros_ver on public.grupo_membros;
create policy grupo_membros_ver on public.grupo_membros for select to authenticated using (public.sou_membro(grupo_id));

-- Mensagens de grupo: mesma tabela, com grupo_id no lugar do destinatário. "sistema" = aviso no chat.
alter table public.mensagens alter column destinatario_id drop not null;
alter table public.mensagens add column if not exists grupo_id uuid references public.grupos(id) on delete cascade;
alter table public.mensagens add column if not exists sistema boolean not null default false;
alter table public.mensagens drop constraint if exists mensagem_destino;
alter table public.mensagens add constraint mensagem_destino check ((destinatario_id is null) <> (grupo_id is null));
create index if not exists mensagens_grupo on public.mensagens(grupo_id, criado_em);

drop policy if exists mensagens_ver_do_grupo on public.mensagens;
create policy mensagens_ver_do_grupo on public.mensagens for select to authenticated
  using (grupo_id is not null and public.pode_ver_msg_grupo(grupo_id, criado_em));
drop policy if exists mensagens_enviar_no_grupo on public.mensagens;
create policy mensagens_enviar_no_grupo on public.mensagens for insert to authenticated
  with check (grupo_id is not null and destinatario_id is null and sistema = false
    and remetente_id = (select auth.uid()) and public.pode_escrever_grupo(grupo_id));

alter publication supabase_realtime add table public.grupos;
alter publication supabase_realtime add table public.grupo_membros;

-- Responder: vale na mesma conversa (par de pessoas ou mesmo grupo).
create or replace function public.mensagens_valida_resposta()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.responde_a is not null and not exists (
    select 1 from public.mensagens o
    where o.id = new.responde_a
      and ((new.grupo_id is not null and o.grupo_id = new.grupo_id)
        or (new.grupo_id is null and o.grupo_id is null and (
             (o.remetente_id = new.remetente_id and o.destinatario_id = new.destinatario_id)
          or (o.remetente_id = new.destinatario_id and o.destinatario_id = new.remetente_id))))
  ) then
    new.responde_a := null;
  end if;
  return new;
end $$;
revoke execute on function public.mensagens_valida_resposta() from public, anon, authenticated;

-- Avisos do sistema não se editam nem se apagam.
create or replace function public.editar_mensagem(msg uuid, novo text)
returns boolean language plpgsql security definer set search_path = public as $$
declare n int;
begin
  novo := btrim(coalesce(novo, ''));
  if char_length(novo) > 2000 then return false; end if;
  update public.mensagens set texto = novo, editada_em = now()
  where id = msg and remetente_id = auth.uid() and apagada_em is null and not sistema
    and (novo <> '' or anexo_nome is not null);
  get diagnostics n = row_count;
  return n > 0;
end $$;
create or replace function public.apagar_mensagem(msg uuid)
returns boolean language plpgsql security definer set search_path = public as $$
declare n int;
begin
  update public.mensagens set texto = 'Mensagem apagada', apagada_em = now(),
    anexo_caminho = null, anexo_nome = null, anexo_tipo = null, anexo_tamanho = null
  where id = msg and remetente_id = auth.uid() and apagada_em is null and not sistema;
  get diagnostics n = row_count;
  return n > 0;
end $$;

-- A lista de conversas 1:1 não inclui mensagens de grupo.
create or replace function public.listar_conversas()
returns table(contato_id uuid, nome text, arroba text, ultima_texto text, ultima_em timestamptz, nao_lidas bigint, ultima_minha boolean, ultima_status text, foto_path text)
language sql stable security definer set search_path = public as $$
  with minhas as (
    select m.*, case when m.remetente_id = auth.uid() then m.destinatario_id else m.remetente_id end as outro
    from public.mensagens m
    where m.grupo_id is null and auth.uid() in (m.remetente_id, m.destinatario_id)
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

-- Aviso no chat do grupo (feito em nome de quem fez a ação).
create or replace function public.grupo_aviso(g uuid, ator uuid, quando text)
returns void language sql security definer set search_path = public as $$
  insert into public.mensagens (remetente_id, grupo_id, texto, sistema) values (ator, g, quando, true);
$$;
revoke all on function public.grupo_aviso(uuid, uuid, text) from public, anon, authenticated;

-- Só Admin/DEV: criar, configurar, adicionar, remover, excluir.
create or replace function public.grupo_criar(nome text, membros uuid[], so_admins boolean default false)
returns uuid language plpgsql security definer set search_path = public as $$
declare g uuid;
begin
  if not public.sou_dev() then raise exception 'sem permissao'; end if;
  nome := btrim(coalesce(nome, ''));
  if char_length(nome) not between 1 and 60 then raise exception 'nome invalido'; end if;
  insert into public.grupos (nome, so_admins, criado_por) values (nome, coalesce(so_admins, false), auth.uid()) returning id into g;
  insert into public.grupo_membros (grupo_id, usuario_id)
    select g, p.id from public.perfis p where p.id = auth.uid() or p.id = any(coalesce(membros, '{}'))
    on conflict do nothing;
  perform public.grupo_aviso(g, auth.uid(), 'criou o grupo "' || nome || '"');
  return g;
end $$;

create or replace function public.grupo_configurar(g uuid, novo_nome text, fechado boolean)
returns boolean language plpgsql security definer set search_path = public as $$
declare atual public.grupos%rowtype;
begin
  if not public.sou_dev() then raise exception 'sem permissao'; end if;
  select * into atual from public.grupos where id = g;
  if not found then return false; end if;
  novo_nome := btrim(coalesce(novo_nome, atual.nome));
  if char_length(novo_nome) not between 1 and 60 then return false; end if;
  update public.grupos set nome = novo_nome, so_admins = coalesce(fechado, atual.so_admins) where id = g;
  if novo_nome <> atual.nome then
    perform public.grupo_aviso(g, auth.uid(), 'mudou o nome do grupo para "' || novo_nome || '"');
  end if;
  if fechado is not null and fechado <> atual.so_admins then
    perform public.grupo_aviso(g, auth.uid(), case when fechado
      then 'mudou as configurações do grupo para permitir que somente admins enviem mensagens'
      else 'mudou as configurações do grupo para permitir que todos os membros enviem mensagens' end);
  end if;
  return true;
end $$;

create or replace function public.grupo_foto(g uuid, caminho text)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if not public.sou_dev() then raise exception 'sem permissao'; end if;
  update public.grupos set foto_path = caminho where id = g;
  if not found then return false; end if;
  perform public.grupo_aviso(g, auth.uid(), case when caminho is null then 'removeu a foto do grupo' else 'mudou a foto do grupo' end);
  return true;
end $$;

create or replace function public.grupo_adicionar(g uuid, usuarios uuid[])
returns integer language plpgsql security definer set search_path = public as $$
declare r record; n int := 0;
begin
  if not public.sou_dev() then raise exception 'sem permissao'; end if;
  if not exists (select 1 from public.grupos where id = g) then return 0; end if;
  for r in select p.id, p.nome from public.perfis p where p.id = any(coalesce(usuarios, '{}'))
           and not exists (select 1 from public.grupo_membros m where m.grupo_id = g and m.usuario_id = p.id) loop
    insert into public.grupo_membros (grupo_id, usuario_id) values (g, r.id);
    perform public.grupo_aviso(g, auth.uid(), 'adicionou ' || r.nome);
    n := n + 1;
  end loop;
  return n;
end $$;

create or replace function public.grupo_remover(g uuid, usuario uuid)
returns boolean language plpgsql security definer set search_path = public as $$
declare nome_alvo text;
begin
  if not public.sou_dev() then raise exception 'sem permissao'; end if;
  select p.nome into nome_alvo from public.perfis p where p.id = usuario;
  delete from public.grupo_membros where grupo_id = g and usuario_id = usuario;
  if not found then return false; end if;
  perform public.grupo_aviso(g, auth.uid(), 'removeu ' || coalesce(nome_alvo, 'um membro'));
  return true;
end $$;

create or replace function public.grupo_excluir(g uuid)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if not public.sou_dev() then raise exception 'sem permissao'; end if;
  delete from public.grupos where id = g;
  return found;
end $$;

-- Qualquer membro pode sair.
create or replace function public.grupo_sair(g uuid)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if not public.sou_membro(g) then return false; end if;
  perform public.grupo_aviso(g, auth.uid(), 'saiu');
  delete from public.grupo_membros where grupo_id = g and usuario_id = auth.uid();
  return true;
end $$;

create or replace function public.grupo_marcar_lido(g uuid)
returns void language sql security definer set search_path = public as $$
  update public.grupo_membros set lida_ate = now() where grupo_id = g and usuario_id = auth.uid();
$$;

-- Lista dos meus grupos, com a última mensagem e as não lidas.
create or replace function public.grupo_listar()
returns table(id uuid, nome text, foto_path text, so_admins boolean, membros bigint, ultima_texto text, ultima_em timestamptz, ultima_minha boolean, nao_lidas bigint, posso_escrever boolean)
language sql stable security definer set search_path = public as $$
  select g.id, g.nome, g.foto_path, g.so_admins,
    (select count(*) from public.grupo_membros x where x.grupo_id = g.id),
    case when u.id is null then null
         when u.apagada_em is not null then (case when u.sistema then '' else split_part(pu.nome, ' ', 1) || ': ' end) || 'Mensagem apagada'
         when u.sistema then pu.nome || ' ' || u.texto
         else (case when u.remetente_id = auth.uid() then 'Você: ' else split_part(pu.nome, ' ', 1) || ': ' end) ||
              (case when btrim(u.texto) = '' and u.anexo_nome is not null then
                 (case when u.anexo_tipo like 'image/%' then 'Foto' when u.anexo_tipo like 'video/%' then 'Vídeo' else u.anexo_nome end)
               else u.texto end) end,
    coalesce(u.criado_em, g.criado_em),
    coalesce(u.remetente_id = auth.uid(), false),
    (select count(*) from public.mensagens x where x.grupo_id = g.id and x.criado_em > me.lida_ate and x.criado_em >= me.entrou_em
       and x.remetente_id <> auth.uid() and not x.sistema and x.apagada_em is null),
    (not g.so_admins or public.sou_dev())
  from public.grupos g
  join public.grupo_membros me on me.grupo_id = g.id and me.usuario_id = auth.uid()
  left join lateral (select m.* from public.mensagens m where m.grupo_id = g.id and m.criado_em >= me.entrou_em order by m.criado_em desc limit 1) u on true
  left join public.perfis pu on pu.id = u.remetente_id
  order by coalesce(u.criado_em, g.criado_em) desc;
$$;

-- Para o painel Admin: todos os grupos.
create or replace function public.grupo_listar_todos()
returns table(id uuid, nome text, foto_path text, so_admins boolean, membros bigint, criado_em timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.sou_dev() then raise exception 'sem permissao'; end if;
  return query select g.id, g.nome, g.foto_path, g.so_admins,
    (select count(*) from public.grupo_membros x where x.grupo_id = g.id), g.criado_em
    from public.grupos g order by g.criado_em desc;
end $$;

-- Notificação: endereços dos membros (menos eu) de um grupo onde acabei de escrever.
create or replace function public.push_destinos_grupo(g uuid)
returns table(endpoint text, p256dh text, auth text)
language sql stable security definer set search_path = public as $$
  select a.endpoint, a.p256dh, a.auth from public.push_assinaturas a
  join public.grupo_membros m on m.usuario_id = a.usuario_id and m.grupo_id = g
  where a.usuario_id <> auth.uid()
    and exists (select 1 from public.mensagens x where x.grupo_id = g and x.remetente_id = auth.uid() and x.criado_em > now() - interval '1 minute');
$$;

do $$ declare f text; begin
  foreach f in array array[
    'grupo_criar(text, uuid[], boolean)','grupo_configurar(uuid, text, boolean)','grupo_foto(uuid, text)','grupo_adicionar(uuid, uuid[])',
    'grupo_remover(uuid, uuid)','grupo_excluir(uuid)','grupo_sair(uuid)','grupo_marcar_lido(uuid)','grupo_listar()','grupo_listar_todos()','push_destinos_grupo(uuid)']
  loop
    execute format('revoke all on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;

-- Leitura liberada para quem está logado (as regras de linha acima limitam o que cada um enxerga).
grant select on public.grupos to authenticated;
grant select on public.grupo_membros to authenticated;
