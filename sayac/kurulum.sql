-- =====================================================================
-- ZİYARETÇİ SAYACI — Supabase kurulumu (bir kez çalıştırılır)
-- Supabase paneli → SQL Editor → bu dosyanın tamamını yapıştır → Run.
-- Tekrar çalıştırmak zararsızdır (her şey "yoksa oluştur / varsa değiştir").
--
-- Benzetme: okul kapısındaki yoklama defteri. Her gün için bir sayfa, her sekme için bir satır.
-- Kapıdan kim geçtiği yazılmaz (ad, IP, cihaz yok); yalnızca çentik sayısı tutulur.
--   tekil        = o gün o sekmeye gelen farklı ziyaretçi (aynı tarayıcı gün içinde 1 kez sayılır)
--   goruntulenme = o gün o sekmenin kaç kez açıldığı (yenilemeler dahil)
--   sayfa '__site__' = o gün siteye gelen toplam farklı ziyaretçi
-- =====================================================================

create table if not exists public.sayac_gunluk (
  gun          date    not null,
  sayfa        text    not null,
  tekil        integer not null default 0,
  goruntulenme integer not null default 0,
  primary key (gun, sayfa)
);

-- Tabloya tarayıcıdan doğrudan erişim yok; yalnızca aşağıdaki iki fonksiyon kullanılır.
alter table public.sayac_gunluk enable row level security;
revoke all on public.sayac_gunluk from anon, authenticated;

-- Raporu görebilecek hesaplar (Supabase giriş hesabı; Teşhis'teki öğretmen hesabıyla aynı)
create table if not exists public.sayac_yonetici (
  uid uuid primary key references auth.users(id) on delete cascade
);
alter table public.sayac_yonetici enable row level security;
revoke all on public.sayac_yonetici from anon, authenticated;

-- ---------------------------------------------------------------------
-- 1) Sayma: her sayfa açılışında tarayıcı bunu çağırır.
-- ---------------------------------------------------------------------
create or replace function public.sayac_artir(p_sayfa text, p_tekil boolean, p_site_tekil boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  bugun date := (now() at time zone 'Europe/Istanbul')::date;
begin
  -- Yalnızca düzgün sayfa yolları kabul edilir: /, /teshis/, /zeka-oyunlari/go/ ...
  if p_sayfa is null or length(p_sayfa) > 80 or p_sayfa !~ '^/([a-z0-9-]+/)*([a-z0-9-]+\.html)?$' then
    return;
  end if;

  -- Çöp satır koruması: bir günde 150'den fazla farklı sayfa kabul edilmez.
  if not exists (select 1 from sayac_gunluk where gun = bugun and sayfa = p_sayfa)
     and (select count(*) from sayac_gunluk where gun = bugun) >= 150 then
    return;
  end if;

  insert into sayac_gunluk as s (gun, sayfa, tekil, goruntulenme)
  values (bugun, p_sayfa, case when p_tekil then 1 else 0 end, 1)
  on conflict (gun, sayfa) do update
    set tekil = s.tekil + case when p_tekil then 1 else 0 end,
        goruntulenme = s.goruntulenme + 1;

  if p_site_tekil then
    insert into sayac_gunluk as s (gun, sayfa, tekil, goruntulenme)
    values (bugun, '__site__', 1, 0)
    on conflict (gun, sayfa) do update set tekil = s.tekil + 1;
  end if;
end;
$$;

revoke all on function public.sayac_artir(text, boolean, boolean) from public;
grant execute on function public.sayac_artir(text, boolean, boolean) to anon, authenticated;

-- ---------------------------------------------------------------------
-- 2) Rapor: yalnızca sayac_yonetici listesindeki hesap görebilir.
-- ---------------------------------------------------------------------
create or replace function public.sayac_rapor(p_gun_sayisi integer default 30)
returns table (gun date, sayfa text, tekil integer, goruntulenme integer)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from sayac_yonetici y where y.uid = auth.uid()) then
    raise exception 'yetki yok';
  end if;
  return query
    select s.gun, s.sayfa, s.tekil, s.goruntulenme
    from sayac_gunluk s
    where s.gun > (now() at time zone 'Europe/Istanbul')::date - greatest(1, least(p_gun_sayisi, 400))
    order by s.gun, s.sayfa;
end;
$$;

revoke all on function public.sayac_rapor(integer) from public;
grant execute on function public.sayac_rapor(integer) to authenticated;

-- ---------------------------------------------------------------------
-- 3) Yönetici: aşağıdaki e-posta yerine kendi Supabase giriş e-postanı yaz.
-- ---------------------------------------------------------------------
insert into public.sayac_yonetici (uid)
select id from auth.users where email = 'BURAYA-GIRIS-EPOSTAN'
on conflict do nothing;

-- Kontrol: 1 satır görmelisin.
select count(*) as yonetici_sayisi from public.sayac_yonetici;
