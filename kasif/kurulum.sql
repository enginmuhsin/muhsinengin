-- =====================================================================
-- KÂŞİF DEFTERİ — Kâşifler Duvarı (Supabase kurulumu, bir kez çalıştırılır)
-- Supabase paneli → SQL Editor → yapıştır → Run. Tekrar çalıştırmak zararsızdır.
-- ÖNCE sayac/kurulum.sql çalışmış olmalı (onay yetkisi sayac_yonetici listesiyle aynı).
--
-- Benzetme: okul panosu. Bölümü bitiren öğrenci (ya da takım) adını panoya iğneler,
-- ama pano camlıdır: öğretmen onaylamadan kimse göremez.
--
-- Saklanan: zaman, bölüm, tür (bireysel/takım), takma ad ya da takım adı, üye takma adları, süre.
-- Saklanmayan: gerçek ad zorunlu değil, e-posta, IP, cihaz bilgisi.
-- =====================================================================

create table if not exists public.kasif_duvar (
  id     bigint generated always as identity primary key,
  zaman  timestamptz not null default now(),
  bolum  text not null,
  tur    text not null check (tur in ('bireysel', 'takim')),
  ad     text not null,
  uyeler text,
  sure   integer not null,          -- saniye
  onay   boolean not null default false
);
alter table public.kasif_duvar enable row level security;
revoke all on public.kasif_duvar from anon, authenticated;

-- 1) Gönderme: /kasif/ sayfası, kasa açılınca. Dönen: 'tamam' | 'gecersiz' | 'tekrar' | 'sinir'
create or replace function public.kasif_gonder(p_bolum text, p_tur text, p_ad text, p_uyeler text, p_sure integer)
returns text language plpgsql security definer set search_path = public as $$
declare
  a text := btrim(coalesce(p_ad, ''));
  u text := nullif(btrim(coalesce(p_uyeler, '')), '');
begin
  if p_bolum is null or p_bolum !~ '^b[0-9]{1,2}$' then return 'gecersiz'; end if;
  if p_tur not in ('bireysel', 'takim') then return 'gecersiz'; end if;
  if length(a) < 2 or length(a) > 24 or a !~ '^[A-Za-z0-9ÇĞİÖŞÜçğıöşüÂâÎîÛû ._-]+$' then return 'gecersiz'; end if;
  if u is not null and (length(u) > 130 or u !~ '^[A-Za-z0-9ÇĞİÖŞÜçğıöşüÂâÎîÛû ,._-]+$') then return 'gecersiz'; end if;
  if p_sure is null or p_sure < 120 or p_sure > 60 * 60 * 24 * 60 then return 'gecersiz'; end if;
  if exists (select 1 from kasif_duvar d where d.bolum = p_bolum and lower(d.ad) = lower(a) and d.zaman > now() - interval '10 minutes') then return 'tekrar'; end if;
  if (select count(*) from kasif_duvar d where d.zaman > now() - interval '1 day') >= 300 then return 'sinir'; end if;
  insert into kasif_duvar (bolum, tur, ad, uyeler, sure) values (p_bolum, p_tur, a, u, p_sure);
  return 'tamam';
end; $$;

-- 2) Herkese açık liste: yalnız onaylılar, her türde en hızlı 30.
create or replace function public.kasif_liste(p_bolum text)
returns table (tur text, ad text, uyeler text, sure integer, zaman timestamptz)
language sql security definer set search_path = public as $$
  (select d.tur, d.ad, d.uyeler, d.sure, d.zaman from kasif_duvar d where d.bolum = p_bolum and d.onay and d.tur = 'bireysel' order by d.sure limit 30)
  union all
  (select d.tur, d.ad, d.uyeler, d.sure, d.zaman from kasif_duvar d where d.bolum = p_bolum and d.onay and d.tur = 'takim' order by d.sure limit 30);
$$;

-- 3) Öğretmen: onay bekleyenler ve hepsi (görüş paneli içinden)
create or replace function public.kasif_yonetim()
returns table (id bigint, zaman timestamptz, bolum text, tur text, ad text, uyeler text, sure integer, onay boolean)
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from sayac_yonetici y where y.uid = auth.uid()) then raise exception 'yetki yok'; end if;
  return query select d.id, d.zaman, d.bolum, d.tur, d.ad, d.uyeler, d.sure, d.onay from kasif_duvar d order by d.onay, d.zaman desc limit 500;
end; $$;

create or replace function public.kasif_onay(p_id bigint, p_onay boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from sayac_yonetici y where y.uid = auth.uid()) then raise exception 'yetki yok'; end if;
  update kasif_duvar set onay = p_onay where id = p_id;
end; $$;

create or replace function public.kasif_sil(p_id bigint)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from sayac_yonetici y where y.uid = auth.uid()) then raise exception 'yetki yok'; end if;
  delete from kasif_duvar where id = p_id;
end; $$;

revoke all on function public.kasif_gonder(text, text, text, text, integer) from public;
revoke all on function public.kasif_liste(text) from public;
revoke all on function public.kasif_yonetim() from public;
revoke all on function public.kasif_onay(bigint, boolean) from public;
revoke all on function public.kasif_sil(bigint) from public;
grant execute on function public.kasif_gonder(text, text, text, text, integer) to anon, authenticated;
grant execute on function public.kasif_liste(text) to anon, authenticated;
grant execute on function public.kasif_yonetim() to authenticated;
grant execute on function public.kasif_onay(bigint, boolean) to authenticated;
grant execute on function public.kasif_sil(bigint) to authenticated;
