create function save_receipt(p_receipt jsonb)
returns bigint                      -- the new receipt_id
language plpgsql
as $$                               -- $$ … $$ is just a way to quote the function body
declare
    v_store_id   bigint;              -- variables: name, type
    v_receipt_id bigint;
    v_item       jsonb;
    v_user_id bigint;
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
        -- TODO:
        -- 1. find or create the store_item
        -- 2. insert the reciept_item
    end loop;

    return v_receipt_id;
end;
$$;