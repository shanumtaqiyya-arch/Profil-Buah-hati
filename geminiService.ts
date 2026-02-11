
import { GoogleGenAI, Type } from "@google/genai";
import { ChildProfile, GrowthRecord, MilestoneCategory } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getDevelopmentalAnalysis = async (
  profile: ChildProfile,
  records: GrowthRecord[],
  milestones: MilestoneCategory[]
) => {
  const latestRecord = records[records.length - 1];
  const achievedMilestones = milestones.flatMap(cat => 
    cat.items.filter(item => item.isAchieved).map(item => item.text)
  );
  const pendingMilestones = milestones.flatMap(cat => 
    cat.items.filter(item => !item.isAchieved).map(item => item.text)
  );

  const prompt = `
    Analisis tumbuh kembang balita berdasarkan standar WHO.
    
    Profil Anak:
    Nama: ${profile.name}
    Jenis Kelamin: ${profile.gender}
    Umur: ${latestRecord?.ageInMonths} bulan
    
    Data Terkini:
    Berat Badan: ${latestRecord?.weight} kg
    Tinggi/Panjang Badan: ${latestRecord?.height} cm
    Lingkar Kepala: ${latestRecord?.headCircumference || 'Tidak ada data'} cm
    
    Capaian Milestone (Perkembangan):
    - Sudah dicapai: ${achievedMilestones.join(', ')}
    - Belum dicapai: ${pendingMilestones.join(', ')}
    
    Instruksi:
    Bandingkan data pertumbuhan (BB dan TB) dengan standar Z-score WHO untuk umur dan jenis kelamin tersebut.
    Evaluasi capaian milestone berdasarkan tahapan umur ${latestRecord?.ageInMonths} bulan.
    Berikan solusi praktis atau stimulasi jika ditemukan kendala atau keterlambatan.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            status: { type: Type.STRING, description: "Status: Normal, Risiko, atau Perhatian" },
            summary: { type: Type.STRING, description: "Ringkasan analisis medis singkat" },
            recommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Daftar rekomendasi tindakan atau solusi"
            },
            disclaimer: { type: Type.STRING, description: "Peringatan medis bahwa ini hanya AI" }
          },
          required: ["status", "summary", "recommendations", "disclaimer"]
        },
      },
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Error fetching analysis:", error);
    throw error;
  }
};
