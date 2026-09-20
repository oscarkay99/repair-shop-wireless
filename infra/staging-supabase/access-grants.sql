\set ON_ERROR_STOP on

revoke all on schema wireless from public;
grant usage on schema wireless to anon, authenticated, service_role;

revoke all on all tables in schema wireless from public, anon, authenticated;
revoke all on all sequences in schema wireless from public, anon, authenticated;
revoke execute on all functions in schema wireless from public, anon, authenticated;

grant all on all tables in schema wireless to service_role;
grant all on all sequences in schema wireless to service_role;
grant execute on all functions in schema wireless to service_role;

grant execute on function wireless.lookup_ticket(text, text) to anon;
grant execute on function wireless.lookup_ticket_by_token(uuid) to anon;
grant execute on function wireless.get_service_terms() to anon;

notify pgrst, 'reload schema';
