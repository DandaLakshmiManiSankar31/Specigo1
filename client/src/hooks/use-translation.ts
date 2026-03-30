import { useMutation } from "@tanstack/react-query";

export type SupportedLanguage = "en" | "te" | "hi";

export const languageNames: Record<SupportedLanguage, string> = {
  en: "English",
  te: "Telugu",
  hi: "Hindi",
};

export function useTranslate() {
  return useMutation({
    mutationFn: async ({ 
      text, 
      fromLang, 
      toLang 
    }: { 
      text: string; 
      fromLang: SupportedLanguage; 
      toLang: SupportedLanguage;
    }) => {
      if (fromLang === toLang) {
        return { translatedText: text };
      }
      
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, fromLang, toLang }),
      });
      
      if (!res.ok) {
        throw new Error("Translation failed");
      }
      
      return res.json() as Promise<{ translatedText: string }>;
    },
  });
}
