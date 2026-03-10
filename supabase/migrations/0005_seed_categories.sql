-- Insert a default university for the MVP
-- Replace the values as needed
insert into universities (id, name, slug, domain, is_active)
values (
  '00000000-0000-0000-0000-000000000001',
  'University of Ilorin',
  'UNILORIN',
  'unilorin.edu.ng',
  true
)
on conflict (slug) do nothing;
