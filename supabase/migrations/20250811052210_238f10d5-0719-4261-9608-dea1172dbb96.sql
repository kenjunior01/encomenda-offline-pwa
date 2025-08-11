-- Harden functions by setting empty search_path
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id
      and role = _role
  );
$$;

create or replace function public.can_access_order(_order_id uuid)
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.orders o
    left join public.profiles p on p.id = o.created_by
    where o.id = _order_id
      and (
        o.created_by = auth.uid()
        or public.has_role(auth.uid(), 'director')
        or (p.supervisor_id = auth.uid())
      )
  );
$$;