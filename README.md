#  TCDD e-Bilet Koltuk Bulucu

![Eklenti İkonu](icon.png)

TCDD e-bilet sistemi üzerinde, belirlediğiniz saat aralığındaki **EKONOMİ** sınıfı boş koltukları otomatik olarak tarayan, bulduğunda görsel ve işitsel uyarı veren açık kaynaklı bir tarayıcı eklentisidir.

Özellikle bayram ve tatil dönemlerinde tükenen biletleri sürekli sayfayı yenileyerek kontrol etmek yerine, bu eklentiyi arka planda çalıştırarak zaman kazanabilirsiniz.

---

##  Özellikler

* **🕒 Saat Aralığı Filtreleme:** Sadece seyahat etmek istediğiniz saat aralığındaki (Örn: 08:00 - 14:30) seferleri takip eder.
* **🎯 Odaklı Tarama:** Sadece "EKONOMİ" sınıfı koltukları kontrol eder.
* **🟩 Görsel Vurgu:** Kriterlerinize uyan seferlerin dış çerçevesini ve bilet butonunu yeşile boyayarak anında fark edilmesini sağlar.
* **🔔 Bildirim Sistemi:** Boş koltuk bulunduğunda sesli uyarı (beep) verir ve masaüstü bildirimi gönderir.
* **🤖 Akıllı Yenileme:** Boş koltuk yoksa belirlediğiniz süre aralığında sayfayı otomatik yeniler. SPA (Single Page Application) mimarisine uyumludur.

---

##  Kurulum (Tarayıcı Eklentisi Olarak)

Bu eklenti Chrome, Edge, Brave gibi Chromium tabanlı tüm tarayıcılarda çalışır.

1. Dosyaları bilgisayarınıza indirin: Sayfanın sağ üstündeki yeşil **`Code`** butonuna tıklayıp **`Download ZIP`** seçeneğini seçin.
2. İndirdiğiniz ZIP dosyasını klasöre çıkartın.
3. Tarayıcınızda Eklentiler (Uzantılar) sayfasını açın:
   * Chrome için adres çubuğuna şunu yazın: `chrome://extensions/`
   * Edge için: `edge://extensions/`
4. Sayfanın sağ üst köşesinde bulunan **Geliştirici modu (Developer mode)** anahtarını açık konuma getirin.
5. Sol üstte beliren **Paketlenmemiş öğe yükle (Load unpacked)** butonuna tıklayın.
6. Zipten çıkardığınız klasörü seçin.

*(Not: Alternatif olarak `script.js` içindeki kodu Tampermonkey veya Violentmonkey gibi userscript yöneticileri ile de kullanabilirsiniz.)*

---

##  Kullanım

1. [TCDD e-Bilet](https://ebilet.tcddtasimacilik.gov.tr/) sayfasına girin ve gitmek istediğiniz yön/tarih için bilet araması yapın.
2. Sağ üstte beliren siyah **TCDD Takip** panelinden:
   * Aramak istediğiniz saat aralığını (Örn: `08:00AM` - `06:00PM`) girin.
   * "Kaydet" butonuna basın.
3. Sekmeyi açık bırakın. Eklenti, uygun bir bilet bulana kadar sayfayı otomatik olarak taramaya ve yenilemeye devam edecektir.

---

## ⚠️ Sorumluluk Reddi (Disclaimer)

* **Resmi Bir Uygulama Değildir:** Bu eklenti resmi bir TCDD Taşımacılık A.Ş. ürünü değildir. Tamamen bağımsız geliştirilmiş, açık kaynaklı ve ücretsiz bir yardımcı araçtır.
* **IP Engelleme Riski:** Çok sık sayfa yenilemek (örneğin 1-2 saniye gibi mantıksız süreler) TCDD sunucuları tarafından zararlı trafik (bot) olarak algılanabilir ve IP adresinizin geçici olarak engellenmesine yol açabilir. Eklenti içindeki standart yenileme süresini (30 saniye) düşürmeniz tavsiye edilmez.
* **Kullanıcı Sorumluluğu:** Bu aracın kullanımından doğabilecek her türlü sorumluluk, IP engellenmesi veya hesap kısıtlamaları tamamen kullanıcının kendisine aittir.

---
