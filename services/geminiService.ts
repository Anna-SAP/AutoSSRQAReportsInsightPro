import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AuditReport } from "../types";
import { getSystemPrompt } from "../constants";

// Define the Schema strictly using Type enum from @google/genai
const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    meta: {
      type: Type.OBJECT,
      properties: {
        supported_languages: { type: Type.ARRAY, items: { type: Type.STRING } },
        detected_languages: { type: Type.ARRAY, items: { type: Type.STRING } },
        report_files: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              file_name: { type: Type.STRING },
              language: { type: Type.STRING },
              issues_found: { type: Type.NUMBER },
            },
          },
        },
        generated_at: { type: Type.STRING },
      },
    },
    quality_overview: {
      type: Type.OBJECT,
      properties: {
        overall_assessment: { type: Type.STRING },
        p0_count: { type: Type.NUMBER },
        p1_count: { type: Type.NUMBER },
        needs_context_count: { type: Type.NUMBER },
        top_risk_areas: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
    },
    fix_list: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          priority: { type: Type.STRING }, // P0 | P1
          language: { type: Type.STRING },
          category: { type: Type.STRING },
          summary: { type: Type.STRING },
          evidence: {
            type: Type.OBJECT,
            properties: {
              file_name: { type: Type.STRING },
              issue_id: { type: Type.STRING, nullable: true },
              location: { type: Type.STRING, nullable: true },
              source_text: { type: Type.STRING, nullable: true },
              target_text: { type: Type.STRING, nullable: true },
              rule_hit: { type: Type.STRING, nullable: true },
            },
          },
          why_it_matters: { type: Type.STRING },
          proposed_fix: { type: Type.STRING },
          verification_steps: { type: Type.ARRAY, items: { type: Type.STRING } },
          confidence: { type: Type.NUMBER },
          dedup: {
            type: Type.OBJECT,
            nullable: true,
            properties: {
              group_id: { type: Type.STRING },
              occurrences: { type: Type.NUMBER },
              other_locations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    file_name: { type: Type.STRING },
                    location: { type: Type.STRING },
                  },
                },
              },
            },
          },
          missing_fields: { type: Type.ARRAY, items: { type: Type.STRING }, nullable: true },
        },
      },
    },
    needs_context: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          language: { type: Type.STRING },
          category: { type: Type.STRING },
          summary: { type: Type.STRING },
          what_is_missing: { type: Type.ARRAY, items: { type: Type.STRING } },
          risk_if_wrong: { type: Type.STRING },
          suggested_next_step: { type: Type.STRING },
        },
      },
    },
    process_improvements: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          area: { type: Type.STRING },
          recommendation: { type: Type.STRING },
          expected_benefit: { type: Type.STRING },
          example: { type: Type.STRING },
        },
      },
    },
  },
};

export const auditReports = async (
  fileContents: { name: string; content: string }[],
  targetLanguage: 'en-US' | 'zh-CN'
): Promise<AuditReport> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key not found. Please ensure process.env.API_KEY is available.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Prepare the prompt input
  // We'll concatenate file contents with delimiters
  let inputContent = "Analyze the following HTML reports:\n\n";
  fileContents.forEach((f, idx) => {
    inputContent += `--- REPORT START: ${f.name} ---\n${f.content}\n--- REPORT END: ${f.name} ---\n\n`;
  });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview", 
      contents: [
        {
          role: "user",
          parts: [{ text: inputContent }],
        },
      ],
      config: {
        systemInstruction: getSystemPrompt(targetLanguage),
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("Empty response from AI model.");
    }

    const json = JSON.parse(text) as AuditReport;
    return json;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
