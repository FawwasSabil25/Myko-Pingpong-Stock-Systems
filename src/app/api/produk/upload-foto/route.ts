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

    // If bucket does not exist, create dynamically
    if (uploadError && (uploadError.message.includes("Bucket not found") || (uploadError as any).status === 404)) {
      console.log("Bucket 'produk-foto' tidak ditemukan. Membuat bucket baru...");
      const { error: createBucketError } = await supabase.storage.createBucket("produk-foto", {
        public: true,
        allowedMimeTypes: allowedTypes,
      });

      if (createBucketError) {
        console.error("Gagal membuat bucket 'produk-foto':", createBucketError);
        return NextResponse.json(
          { error: "Gagal membuat folder penyimpanan foto produk.", detail: createBucketError.message },
          { status: 500 }
        );
      }

      // Retry upload
      const retryResult = await supabase.storage
        .from("produk-foto")
        .upload(fileName, file, {
          contentType: file.type,
          upsert: true,
        });
      
      uploadData = retryResult.data;
      uploadError = retryResult.error;
    }

    if (uploadError) {
      console.error("Error uploading file to Supabase Storage:", uploadError);
      return NextResponse.json(
        { error: "Gagal mengunggah foto produk.", detail: uploadError.message },
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
