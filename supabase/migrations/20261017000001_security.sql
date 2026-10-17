alter table category enable row level security;
alter table store enable row level security;
alter table receipt enable row level security;
alter table receipt_item enable row level security;
alter table store_item enable row level security;

grant select, insert, update, delete on category to authenticated;

create policy "Users manage their own categories"
on category
for all
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

grant select, insert on store to authenticated;

create policy "Signed-in reads all stores"
on store
for select
to authenticated
using (true);

create policy "Signed-in creates new stores"
on store
for insert
to authenticated
with check (true);

grant select, insert, update, delete on receipt to authenticated;

create policy "Users manage their own receipts"
on receipt
for all
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

grant select, insert, update, delete on store_item to authenticated;

create policy "Users manage their own store items"
on store_item
for all
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

grant select, insert, update, delete on receipt_item to authenticated;

create policy "Users manage their own receipt items"
on receipt_item
for all
to authenticated
using (
    exists (
        select 1 from receipt
        where receipt.receipt_id = receipt_item.receipt_id
        and receipt.user_id = (select auth.uid())
    )
)
with check (
    exists (
        select 1 from receipt
        where receipt.receipt_id = receipt_item.receipt_id
        and receipt.user_id = (select auth.uid())
    )
    and
    exists (
        select 1 from store_item
        where store_item.store_item_id = receipt_item.store_item_id
        and store_item.user_id = (select auth.uid())
    )
);
