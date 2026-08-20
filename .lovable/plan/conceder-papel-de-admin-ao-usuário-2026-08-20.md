# Conceder papel de admin ao usuário

## Objetivo
Executar o SQL necessário para conceder o papel `admin` ao usuário `wrccdesign@gmail.com`, permitindo acesso à página `/admin/ingestao` e ao endpoint `ingest-datajud`.

## Passos
1. Executar o INSERT na tabela `public.user_roles` vinculando o `user_id` do email `wrccdesign@gmail.com` ao papel `admin`.
2. Verificar que a linha foi criada corretamente.

## SQL a ser executado
```sql
insert into public.user_roles (user_id, role)
select id, 'admin'
from auth.users
where email = 'wrccdesign@gmail.com'
on conflict (user_id, role) do nothing;
```

## Verificação
```sql
select u.email, ur.role, ur.created_at
from public.user_roles ur
join auth.users u on u.id = ur.user_id
where u.email = 'wrccdesign@gmail.com';
```
