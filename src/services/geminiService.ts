export interface QuestionSection {
  id: string;
  type: "Pilihan Ganda" | "Pilihan Ganda Kompleks" | "Benar Salah" | "Isian Singkat" | "Uraian/Essai";
  count: number;
  hasImages: boolean;
  difficulty: {
    easy: number;
    medium: number;
    hard: number;
  };
  cognitiveDimensions: string[];
}

export interface ExamIdentity {
  teacher: string;
  school: string;
  level: "SD" | "SMP";
  phase: string;
  className: string;
  subject: string;
  topic: string;
}

export const generateImage = async (prompt: string) => {
  try {
    const response = await fetch("/api/generate-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) throw new Error("Failed to generate image");
    const data = await response.json();
    return data.imageUrl;
  } catch (error) {
    console.error("Error generating image:", error);
    return null;
  }
};

export const generateExam = async (identity: ExamIdentity, sections: QuestionSection[]) => {
  try {
    const response = await fetch("/api/generate-exam", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identity, sections }),
    });

    if (!response.ok) throw new Error("Failed to generate exam");
    return await response.json();
  } catch (error) {
    console.error("Error generating exam:", error);
    throw error;
  }
};
