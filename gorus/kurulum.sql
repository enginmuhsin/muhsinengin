-- =====================================================================
-- GÖRÜŞ VE ÖNERİLER — Supabase kurulumu (bir kez çalıştırılır)
-- Supabase paneli → SQL Editor → bu dosyanın tamamını yapıştır → Run.
-- Tekrar çalıştırmak zararsızdır. ÖNCE sayac/kurulum.sql çalışmış olmalı:
-- okuma yetkisi, sayaç panelindeki yönetici listesiyle (sayac_yonetici) aynıdır.
--
-- Benzetme: okulun koridorundaki kilitli öneri kutusu. Herkes kâğıt atabilir,
-- kutuyu yalnız anahtarı olan açar. Kâğıda kimse adını yazmak zorunda değildir.
--
-- Saklanan: zaman, sayfa yolu, rol (öğrenci/öğretmen/veli/diğer), puan (1–5, isteğe bağlı), mesaj.
-- Saklanmayan: ad, e-posta, IP, cihaz bilgisi.
-- 400 günden eski görüşler, panel her açıldığında kendiliğinden silinir.
-- =====================================================================

create table if not exists public.gorus (
  id     bigint generated always as identity primary key,
  zaman  timestamptz not null default now(),
  sayfa  text,
  rol    text not null,
  puan   smallint,
  mesaj  text not null,
  okundu boolean not null default false
);

alter table public.gorus enable row level security;
revoke all on public.gorus from anon, authenticated;

-- ---------------------------------------------------------------------
-- 1) Gönderme: /gorus/ sayfasındaki form bunu çağırır.
--    Dönen: 'tamam' | 'gecersiz' | 'tekrar' | 'sinir'
-- ---------------------------------------------------------------------
create or replace function public.gorus_gonder(p_sayfa text, p_rol text, p_puan integer, p_mesaj text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  m text := btrim(coalesce(p_mesaj, ''));
  s text := nullif(btrim(coalesce(p_sayfa, '')), '');
begin
  if p_rol is null or p_rol not in ('ogrenci', 'ogretmen', 'veli', 'diger') then return 'gecersiz'; end if;
  if p_puan is not null and (p_puan < 1 or p_puan > 5) then return 'gecersiz'; end if;
  if length(m) < 3 or length(m) > 1500 then return 'gecersiz'; end if;
  -- Sayfa yolu sayaçtakiyle aynı biçimde olmalı (ör. /kriptoloji/sezar/); değilse boş bırakılır.
  if s is not null and (length(s) > 80 or s !~ '^/([a-z0-9-]+/)*([a-z0-9-]+\.html)?$') then s := null; end if;

  -- Aynı mesaj bir gün içinde ikinci kez gelmez (çift tıklama, yenileme).
  if exists (select 1 from gorus g where g.mesaj = m and g.zaman > now() - interval '1 day') then return 'tekrar'; end if;
  -- Çöp koruması: bir günde en çok 200 görüş.
  if (select count(*) from gorus g where g.zaman > now() - interval '1 day') >= 200 then return 'sinir'; end if;

  insert into gorus (sayfa, rol, puan, mesaj) values (s, p_rol, p_puan, m);
  return 'tamam';
end;
$$;

revoke all on function public.gorus_gonder(text, text, integer, text) from public;
grant execute on function public.gorus_gonder(text, text, integer, text) to anon, authenticated;

-- ---------------------------------------------------------------------
-- 2) Okuma paneli: yalnız sayac_yonetici listesindeki hesap.
-- ---------------------------------------------------------------------
create or replace function public.gorus_liste()
returns table (id bigint, zaman timestamptz, sayfa text, rol text, puan smallint, mesaj text, okundu boolean)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from sayac_yonetici y where y.uid = auth.uid()) then
    raise exception 'yetki yok';
  end if;
  delete from gorus g where g.zaman < now() - interval '400 days';   -- saklama süresi
  return query select g.id, g.zaman, g.sayfa, g.rol, g.puan, g.mesaj, g.okundu from gorus g order by g.zaman desc limit 1000;
end;
$$;

create or replace function public.gorus_okundu(p_id bigint, p_okundu boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from sayac_yonetici y where y.uid = auth.uid()) then raise exception 'yetki yok'; end if;
  update gorus set okundu = p_okundu where id = p_id;
end;
$$;

create or replace function public.gorus_sil(p_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from sayac_yonetici y where y.uid = auth.uid()) then raise exception 'yetki yok'; end if;
  delete from gorus where id = p_id;
end;
$$;

revoke all on function public.gorus_liste() from public;
revoke all on function public.gorus_okundu(bigint, boolean) from public;
revoke all on function public.gorus_sil(bigint) from public;
grant execute on function public.gorus_liste() to authenticated;
grant execute on function public.gorus_okundu(bigint, boolean) to authenticated;
grant execute on function public.gorus_sil(bigint) to authenticated;

-- Kontrol: 'tamam' görmelisin (deneme görüşü; panelden silebilirsin). İkinci çalıştırmada 'tekrar' görürsün; bu da normal.
select public.gorus_gonder('/gorus/', 'diger', 5, 'Kurulum denemesi') as deneme;
