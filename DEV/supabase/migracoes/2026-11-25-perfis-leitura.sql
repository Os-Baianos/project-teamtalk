-- Cada pessoa lê o próprio perfil (a busca por @ de outras pessoas é pela função buscar_perfil).
create policy "perfis_ver_o_proprio" on public.perfis for select to authenticated using (id = auth.uid());
grant select on public.perfis to authenticated;
