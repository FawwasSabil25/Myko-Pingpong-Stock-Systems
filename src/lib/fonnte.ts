/**
 * Helper untuk kirim pesan WhatsApp via Fonnte.
 * Mengirim request HTTP POST ke API Fonnte dengan token autentikasi.
 */

interface SendWAParams {
  target: string; // Nomor tujuan, format 08xxxxxxxxxx (sesuai dokumentasi Fonnte)
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
    console.error("[Fonnte] ❌ FONNTE_API_TOKEN belum diset di .env.local");
    return { success: false, message: "FONNTE_API_TOKEN tidak tersedia" };
  }

  // Log payload sebelum request (message ditruncate untuk keamanan log)
  const messagePreview = params.message.length > 80
    ? params.message.substring(0, 80) + "..."
    : params.message;
  console.log("[Fonnte] 📤 Mengirim WA:", {
    target: params.target,
    message_preview: messagePreview,
    has_file: !!params.fileUrl,
    token_exists: !!FONNTE_API_TOKEN,
    token_preview: FONNTE_API_TOKEN.substring(0, 4) + "****",
  });

  const formData = new FormData();
  formData.append("target", params.target);
  formData.append("message", params.message);

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
      console.error(`[Fonnte] ❌ HTTP error! status: ${res.status}, body: ${errText}`);
      return { success: false, message: `HTTP error ${res.status}: ${errText}` };
    }

    const data = await res.json();

    // Fonnte returns status: true or false (boolean)
    const success = data.status === true;
    if (success) {
      console.log("[Fonnte] ✅ Pesan berhasil dikirim:", {
        target: params.target,
        response: data,
      });
    } else {
      console.warn("[Fonnte] ⚠️ Fonnte returned non-success:", {
        target: params.target,
        response: data,
      });
    }

    return {
      success,
      message: data.reason || JSON.stringify(data),
    };
  } catch (error) {
    console.error("[Fonnte] ❌ Exception saat kirim pesan:", {
      target: params.target,
      error: String(error),
    });
    return { success: false, message: String(error) };
  }
}

