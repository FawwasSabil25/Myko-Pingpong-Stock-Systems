/**
 * Stub helper untuk kirim pesan WhatsApp via Fonnte.
 * Di Tahap 1, semua panggilan hanya di-log ke console.
 * Di Tahap 2, akan diganti dengan HTTP POST ke API Fonnte sungguhan.
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
  // --- TAHAP 1: STUB — hanya log ke console ---
  console.log("[WA STUB] would send to", params.target);
  console.log("[WA STUB] message:", params.message);
  if (params.fileUrl) {
    console.log("[WA STUB] attachment:", params.fileUrl, params.filename);
  }

  return {
    success: true,
    message: "[STUB] Pesan WA tidak benar-benar dikirim (Tahap 1)",
  };

  // --- TAHAP 2: Uncomment dan gunakan kode di bawah ini ---
  // const FONNTE_API_TOKEN = process.env.FONNTE_API_TOKEN;
  // if (!FONNTE_API_TOKEN) {
  //   console.error("FONNTE_API_TOKEN belum diset di .env.local");
  //   return { success: false, message: "FONNTE_API_TOKEN tidak tersedia" };
  // }
  //
  // const body: Record<string, string> = {
  //   target: params.target,
  //   message: params.message,
  // };
  // if (params.fileUrl) body.url = params.fileUrl;
  // if (params.filename) body.filename = params.filename;
  //
  // try {
  //   const res = await fetch("https://api.fonnte.com/send", {
  //     method: "POST",
  //     headers: {
  //       Authorization: FONNTE_API_TOKEN,
  //     },
  //     body: new URLSearchParams(body),
  //   });
  //   const data = await res.json();
  //   return { success: data.status === true, message: JSON.stringify(data) };
  // } catch (error) {
  //   console.error("Fonnte send error:", error);
  //   return { success: false, message: String(error) };
  // }
}
