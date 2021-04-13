select f.id,f.code,f.code_created_at from family f
left join family_member fm
on fm.family_id = f.id
where user_id = $1;
