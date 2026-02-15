import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-database.js";

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

    const statusMsg = document.getElementById('opStatus');

    if (name && time) {
        set(ref(database, 'users/containers/container-' + cabin), {
            pillsName: name,
            notifications: [time],
            frequency: freq,
            lastDispensed: new Date().toISOString()
        }).then(() => {
            statusMsg.style.display = "block";
            statusMsg.style.backgroundColor = "rgba(79, 172, 254, 0.2)";
            statusMsg.style.color = "#00f2fe";
            statusMsg.innerHTML = "✅ Hazne " + cabin + " planı güncellendi!";
            
            setTimeout(() => { statusMsg.style.display = "none"; }, 3000);
        }).catch((error) => {
            console.error("Hata:", error);
            alert("Kayıt sırasında bir hata oluştu!");
        });
    } else {
        alert("Lütfen ilaç adını ve saatini girin!");
    }
});

// 2. MOTOR DÖNÜNCE BİLDİRİM ALMA VE SIFIRLAMA
const statusRef = ref(database, 'users/status');
onValue(statusRef, (snapshot) => {
    const data = snapshot.val();
    // Eğer Firebase'de doğrudan metin değil de {status: "..."} objesi varsa ona göre okur
    const status = (data && typeof data === 'object') ? data.status : data;
    const opStatus = document.getElementById('opStatus');
    
    if (status === "motor_dondu") {
        // Ekranda bildirim kutusunu göster
        opStatus.style.display = "block";
        opStatus.style.backgroundColor = "rgba(233, 30, 99, 0.2)";
        opStatus.style.border = "1px solid #e91e63";
        opStatus.style.color = "white";
        opStatus.innerHTML = "🔔 BİLDİRİM: İlaç verildi, motor döndü!";
        
        // Tarayıcı Bildirimi Gönder
        if (Notification.permission === "granted") {
            new Notification("İlaç Bildirimi", { 
                body: "Motor hazneyi açtı, ilacınızı alabilirsiniz.",
                icon: "pill.png" 
            });
            // --- TİTREŞİM EKLEMESİ ---
if ('vibrate' in navigator) {
    navigator.vibrate([500, 200, 500]); // 500ms titre, 200ms dur, 500ms titre
}
        } else if (Notification.permission !== "denied") {
            Notification.requestPermission();
        }

        // --- YENİ: SIFIRLAMA MANTIĞI ---
        // 5 saniye sonra durumu "beklemede"ye çek ki bir sonraki bildirimi tetikleyebilsin
        setTimeout(() => {
            set(ref(database, 'users/status'), {
                status: "beklemede"
            }).then(() => {
                opStatus.style.display = "none"; // Ekrandaki pembe kutuyu gizle
                console.log("Durum sıfırlandı: beklemede");
            });
        }, 5000);
    }
});
