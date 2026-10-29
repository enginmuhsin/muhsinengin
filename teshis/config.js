// YKS Teşhis Defteri · site ayarları
// Supabase panelinde: Project Settings → API (ya da "Data API") bölümünden kopyalayın.
// "anon / public" anahtarı tarayıcıda kullanılmak içindir; güvenliği veritabanındaki
// satır düzeyi güvenlik (RLS) kuralları sağlar. "service_role" anahtarını ASLA buraya yazmayın.
window.TESHIS_CONFIG = {
  supabaseUrl: "https://kfpziysmsajqidkzaawh.supabase.co",
  supabaseAnonKey: "sb_publishable_jzoa489kAPGEComqCF2JSQ_N8gjKPjC"
};
// İki alan da boş bırakılırsa uygulama "yerel mod"da çalışır (kayıtlar yalnızca o tarayıcıda).
