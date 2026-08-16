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

    // Validate MIME type is image
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Hanya file gambar (JPG, PNG, WEBP) yang diperbolehkan." },
        { status: 400 }
      );
    }

    const fileExt = file.name.split(".").pop() || "png";
    const fileName = `produk-${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

    // Upload to Supabase Storage bucket 'produk-foto'
    let { data: uploadData, error: uploadError } = await supabase.storage
      .from("produk-foto")
      .upload(fileName, file, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error("[Supabase Storage] Upload error details:", {
        message: uploadError.message,
        name: uploadError.name,
        // @ts-ignore
        status: uploadError.status,
      });
      
      // Berikan pesan error yang lebih jelas ke developer/admin
      let errorMessage = "Gagal mengunggah foto produk.";
      if (uploadError.message.includes("Bucket not found") || (uploadError as any).status === 404 || (uploadError as any).status === "404") {
        errorMessage = "Bucket 'produk-foto' tidak ditemukan. Admin harus membuatnya di Supabase Dashboard.";
      } else if (uploadError.message.includes("new row violates row-level security") || (uploadError as any).status === 403 || (uploadError as any).status === "403") {
        errorMessage = "Akses ditolak (RLS). Pastikan Policy INSERT untuk bucket 'produk-foto' sudah disetup.";
      } else {
        errorMessage = `Error upload: ${uploadError.message}`;
      }

      return NextResponse.json(
        { error: errorMessage, detail: uploadError.message },
        { status: 500 }
      );
    }

    // Get Public URL
    const { data: { publicUrl } } = supabase.storage
      .from("produk-foto")
      .getPublicUrl(fileName);

    return NextResponse.json({ publicUrl });
  } catch (error: any) {
    console.error("Internal Server Error di /api/produk/upload-foto:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal server.", detail: error.message },
      { status: 500 }
    );
  }
}
