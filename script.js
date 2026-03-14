import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
import { getDatabase, ref, set, onValue, update } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-database.js";

// Firebase Bilgilerin
const firebaseConfig = {
  apiKey: "AIzaSyDMQG5IYpNVbbi4DsEhjOItF1LuP2YmDH4",
  authDomain: "smart-pill-box-2025.firebaseapp.com",
  databaseURL: "https://smart-pill-box-2025-default-rtdb.firebaseio.com",
  projectId: "smart-pill-box-2025",
  storageBucket: "smart-pill-box-2025.firebasestorage.app",
  appId: "1:740889677604:web:d8db94053ea34df2c92db1"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// 1. VERİ KAYDETME (Yeni Plan Ekleme)
document.getElementById('saveBtn').addEventListener('click', () => {
    const name = document.getElementById('pillsName').value;
    const cabin = document.getElementById('containerSelect').value;
    const time = document.getElementById('pillTime').value;
    const freq = document.getElementById('frequencySelect').value;
    const count = parseInt(document.getElementById('pillsCount').value); // YENİ: Sayıyı al

    const statusMsg = document.getElementById('opStatus');

    if (name && time && count > 0) {
        set(ref(database, 'users/containers/container-' + cabin), {
            pillsName: name,
            notifications: [time],
            frequency: freq,
            pillsCount: count, // YENİ: Firebase'e stok sayısını gönder
            lastDispensed: new Date().toISOString()
        }).then(() => {
            statusMsg.style.display = "block";
            statusMsg.style.backgroundColor = "rgba(79, 172, 254, 0.2)";
            statusMsg.style.color = "#00f2fe";
            statusMsg.innerHTML = "✅ Hazne " + cabin + " planı ve " + count + " adet ilaç kaydedildi!";
            
            setTimeout(() => { statusMsg.style.display = "none"; }, 3000);
        }).catch((error) => {
            console.error("Hata:", error);
            alert("Kayıt sırasında bir hata oluştu!");
        });
    } else {
        alert("Lütfen tüm alanları (İlaç adı, sayısı ve saati) doldurun!");
    }
});

// 2. LİSTEYİ GÜNCELLEME VE KALAN MİKTARI GÖSTERME
const containersRef = ref(database, 'users/containers');
onValue(containersRef, (snapshot) => {
    const data = snapshot.val();
    const pillList = document.getElementById('pill-list');
    pillList.innerHTML = ""; // Listeyi temizle

    if (data) {
        Object.keys(data).forEach((key) => {
            const item = data[key];
            const pillItem = document.createElement('div');
            pillItem.className = 'pill-item';
            
            // Kalan miktar 0 ise kırmızı uyarı ver
            const stockColor = item.pillsCount <= 0 ? 'red' : '#00f2fe';
            const stockText = item.pillsCount <= 0 ? 'BİTTİ!' : item.pillsCount + ' Adet';

            pillItem.innerHTML = `
                <span class="stock-badge" style="color: ${stockColor}">Kalan: ${stockText}</span>
                <strong>${item.pillsName}</strong><br>
                <small><i class="far fa-clock"></i> ${item.notifications[0]} | ${item.frequency}</small>
            `;
            pillList.appendChild(pillItem);
        });
    }
});

// --- 3. MOTOR DÖNÜNCE BİLDİRİM ALMA VE SIFIRLAMA ---
const statusRef = ref(database, 'users/status');

onValue(statusRef, (snapshot) => {
    const data = snapshot.val();
    // Veri objeyse status alanını al, değilse doğrudan veriyi al
    const status = (data && typeof data === 'object') ? data.status : data;
    const opStatus = document.getElementById('opStatus');
    
    if (status === "motor_dondu") {
        // Titreşim
        if ('vibrate' in navigator) {
            navigator.vibrate([500, 200, 500]);
        }

        // Ekran Mesajı Stil Ayarları
        opStatus.style.display = "block";
        opStatus.style.backgroundColor = "rgba(233, 30, 99, 0.2)";
        opStatus.style.border = "1px solid #e91e63";
        opStatus.style.color = "white";
        opStatus.innerHTML = "🔔 BİLDİRİM: İlaç verildi, motor döndü!";
        
        // Tarayıcı Bildirimi
        if (Notification.permission === "granted") {
            new Notification("İlaç Bildirimi", { 
                body: "Motor hazneyi açtı, ilacınızı alabilirsiniz.",
                icon: "pill.png" 
            });
        }

        // 5 saniye sonra durumu "beklemede"ye çekerek mesajı temizle
        setTimeout(() => {
            set(ref(database, 'users/status'), {
                status: "beklemede"
            }).then(() => {
                opStatus.style.display = "none";
                console.log("Durum sıfırlandı.");
            });
        }, 5000);
    }
}); 
