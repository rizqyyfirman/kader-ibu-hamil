// File ini bisa digunakan untuk fungsi-fungsi utility yang dipakai di beberapa halaman
// Untuk sementara bisa dikosongkan atau tambahkan fungsi helper

// Fungsi format tanggal Indonesia
function formatTanggalIndonesia(tanggal) {
    const options = { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
    };
    return new Date(tanggal).toLocaleDateString('id-ID', options);
}

// Fungsi format tanggal dan waktu
function formatTanggalWaktu(tanggal) {
    const options = { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return new Date(tanggal).toLocaleDateString('id-ID', options);
}

// Fungsi cek login
function checkLogin() {
    if (!localStorage.getItem('token')) {
        window.location.href = '/';
        return false;
    }
    return true;
}