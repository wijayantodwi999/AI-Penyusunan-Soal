import express from "express";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

// API Routes
app.post("/api/generate-exam", async (req, res) => {
  const { identity, sections } = req.body;
  const model = "gemini-3-flash-preview";

  const prompt = `
    Anda adalah asisten ahli pembuat soal ujian pendidikan di Indonesia.
    Buatlah naskah soal, kunci jawaban, dan kisi-kisi berdasarkan identitas dan teknis berikut:

    IDENTITAS:
    - Guru: ${identity.teacher}
    - Sekolah: ${identity.school}
    - Jenjang: ${identity.level}
    - Fase: ${identity.phase}
    - Kelas: ${identity.className}
    - Mata Pelajaran: ${identity.subject}
    - Topik: ${identity.topic}

    STRUKTUR SOAL:
    ${sections.map((s: any, i: number) => `
    Bagian ${i + 1}:
    - Bentuk: ${s.type}
    - Jumlah: ${s.count}
    - Tingkat Kesulitan: Mudah(${s.difficulty.easy}), Sedang(${s.difficulty.medium}), Sulit(${s.difficulty.hard})
    - Dimensi Kognitif: ${s.cognitiveDimensions.join(", ")}
    - Sertakan stimulus gambar: ${s.hasImages ? "Ya (Berikan deskripsi prompt gambar yang sangat detail dalam bahasa Inggris untuk AI Image Generator)" : "Tidak"}
    `).join("\n")}

    OUTPUT HARUS DALAM FORMAT JSON dengan struktur:
    {
      "naskahSoal": "String Markdown lengkap untuk naskah soal (termasuk kop surat identitas). Gunakan placeholder seperti {{IMAGE_PROMPT_1}}, {{IMAGE_PROMPT_2}} dst di tempat gambar seharusnya berada.",
      "kunciJawaban": "String Markdown lengkap untuk kunci jawaban",
      "kisiKisi": "String Markdown lengkap untuk tabel kisi-kisi soal",
      "imagePrompts": [
        { "id": "IMAGE_PROMPT_1", "prompt": "Detailed English prompt for image generation..." }
      ]
    }

    Pastikan soal berkualitas tinggi, sesuai dengan kurikulum merdeka, dan menggunakan bahasa Indonesia yang baik dan benar.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
      },
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch (error: any) {
    console.error("Error generating exam:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/generate-image", async (req, res) => {
  const { prompt } = req.body;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: [{ parts: [{ text: prompt }] }],
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return res.json({ 
          imageUrl: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}` 
        });
      }
    }
    res.status(404).json({ error: "No image generated" });
  } catch (error: any) {
    console.error("Error generating image:", error);
    res.status(500).json({ error: error.message });
  }
});

// Vite middleware for development
if (process.env.NODE_ENV !== "production") {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static("dist"));
}

// Only listen if not on Vercel
if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;
