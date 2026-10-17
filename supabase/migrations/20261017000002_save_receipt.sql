create function save_receipt(p_receipt jsonb)
returns bigint  -- the new receipt_id
language plpgsql
as $$
declare
    v_store_id   bigint;
    v_receipt_id bigint;
    v_item       jsonb;
    v_user_id uuid;
    v_store_item_id bigint;
begin
    v_user_id := auth.uid();
    if v_user_id is null then
        raise exception 'User not signed in';
    end if;

    -- create or find the store we want to update
    insert into store (chain, branch)
    values (p_receipt->>'chain', p_receipt->>'storeName')
    on conflict (chain, branch) do nothing;

    select store_id into v_store_id
    from store
    where chain = p_receipt->>'chain' and branch = p_receipt->>'storeName';

    -- create the receipt, if it already exists do nothing
    insert into receipt (user_id, store_id, purchased_at, long_receipt_id, total, savings)
    values (v_user_id, v_store_id, (p_receipt->>'purchasedAt')::timestamptz, p_receipt->>'receiptId', (p_receipt->>'total')::integer, coalesce((p_receipt->>'savings')::integer, 0))
    on conflict (user_id, long_receipt_id) do nothing
    returning receipt_id into v_receipt_id;

    if v_receipt_id is null then
        raise exception 'Receipt already imported';
    end if;

 
    for v_item in select * from jsonb_array_elements(p_receipt->'items') loop
        -- find or create the store_item
        insert into store_item (user_id, chain, name)
        values (v_user_id, p_receipt->>'chain', v_item->>'name')
        on conflict (user_id, chain, name) do nothing;

        select store_item_id into v_store_item_id
        from store_item
        where user_id = v_user_id 
          and chain = p_receipt->>'chain' 
          and name = v_item->>'name';
        -- insert the receipt_item
        insert into receipt_item (store_item_id, receipt_id, quantity, unit_price)
        values (v_store_item_id, v_receipt_id, (v_item->>'quantity')::numeric, (v_item->>'unitPrice')::integer);

    end loop;

    return v_receipt_id;
end;
$$;
revoke execute on function save_receipt(jsonb) from public, anon;
grant execute on function save_receipt(jsonb) to authenticated;