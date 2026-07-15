/**
 * Helper untuk kirim pesan WhatsApp via Fonnte.
 * Mengirim request HTTP POST ke API Fonnte dengan token autentikasi.
 */

interface SendWAParams {
  target: string; // Nomor tujuan, format 628xxxxxxxxxx
  message: string;
  fileUrl?: string; // URL publik file (untuk lampiran, mis. resi PDF)
  filename?: string; // Nama file lampiran (opsional)
}

export async function kirimPesanWA(params: SendWAParams): Promise<{
  success: boolean;
  message: string;
}> {
  const FONNTE_API_TOKEN = process.env.FONNTE_API_TOKEN;
  if (!FONNTE_API_TOKEN) {
    console.error("FONNTE_API_TOKEN belum diset di .env.local");
    return { success: false, message: "FONNTE_API_TOKEN tidak tersedia" };
  }

  const formData = new FormData();
  formData.append("target", params.target);
  formData.append("message", params.message);
  formData.append("countryCode", "62"); // default country code

  if (params.fileUrl) {
    formData.append("url", params.fileUrl);
  }
  if (params.filename) {
    formData.append("filename", params.filename);
  }

  try {
    const res = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: {
        Authorization: FONNTE_API_TOKEN,
      },
      body: formData,
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`Fonnte API HTTP error! status: ${res.status}, body: ${errText}`);
      return { success: false, message: `HTTP error ${res.status}: ${errText}` };
    }

    const data = await res.json();
    console.log("[Fonnte API Response]:", data);
    
    // Fonnte returns status: true or false (boolean)
    const success = data.status === true;
    return { 
      success, 
      message: data.reason || JSON.stringify(data) 
    };
  } catch (error) {
    console.error("Fonnte send error:", error);
    return { success: false, message: String(error) };
  }
}
