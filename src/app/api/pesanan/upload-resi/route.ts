import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "Tidak ada file yang diunggah." },
        { status: 400 }
      );
    }

    // Batasi file hanya PDF (opsional tambahan keamanan)
    if (!file.name.endsWith(".pdf") && file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Hanya file PDF yang diperbolehkan." },
        { status: 400 }
      );
    }

    const fileExt = "pdf";
    const fileName = `resi-${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

    // Upload ke Supabase Storage bucket 'resi'
    let { data: uploadData, error: uploadError } = await supabase.storage
      .from("resi")
      .upload(fileName, file, {
        contentType: "application/pdf",
        upsert: true,
      });

    // Jika bucket belum ada, buat bucket baru secara dinamis
    if (uploadError && (uploadError.message.includes("Bucket not found") || (uploadError as any).status === 404)) {
      console.log("Bucket 'resi' tidak ditemukan. Membuat bucket baru...");
      const { error: createBucketError } = await supabase.storage.createBucket("resi", {
        public: true,
        allowedMimeTypes: ["application/pdf"],
      });

      if (createBucketError) {
        console.error("Gagal membuat bucket 'resi':", createBucketError);
        return NextResponse.json(
          { error: "Gagal membuat folder penyimpanan resi.", detail: createBucketError.message },
          { status: 500 }
        );
      }

      // Coba upload ulang
      const retryResult = await supabase.storage
        .from("resi")
        .upload(fileName, file, {
          contentType: "application/pdf",
          upsert: true,
        });
      
      uploadData = retryResult.data;
      uploadError = retryResult.error;
    }

    if (uploadError) {
      console.error("Error uploading file to Supabase Storage:", uploadError);
      return NextResponse.json(
        { error: "Gagal mengunggah file resi.", detail: uploadError.message },
        { status: 500 }
      );
    }

    // Dapatkan Public URL
    const { data: { publicUrl } } = supabase.storage
      .from("resi")
      .getPublicUrl(fileName);

    return NextResponse.json({ publicUrl });
  } catch (error: any) {
    console.error("Internal Server Error di /api/pesanan/upload-resi:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server.", detail: error.message },
      { status: 500 }
    );
  }
}
