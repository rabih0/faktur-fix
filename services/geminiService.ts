
import { GoogleGenAI, Type } from "@google/genai";
import { InvoiceItem } from '../types';

export const generateTasksForMovingAndCleaning = async (): Promise<InvoiceItem[]> => {
    try {
        if (!process.env.API_KEY) {
            throw new Error("API_KEY environment variable not set");
        }
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: "Erstelle eine Liste von 10 typischen Aufgaben oder Dienstleistungen für ein Unternehmen, das sowohl Möbeltransporte als auch Reinigungsdienste anbietet. Jede Aufgabe sollte eine kurze Beschreibung, eine empfohlene Menge von 1 und einen realistischen Einzelpreis in Euro haben.",
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        tasks: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    description: { type: Type.STRING },
                                    unitPrice: { type: Type.NUMBER }
                                },
                                required: ["description", "unitPrice"]
                            }
                        }
                    }
                }
            }
        });

        let jsonString = response.text.trim();
        if (jsonString.startsWith("```json")) {
            jsonString = jsonString.substring(7);
        }
        if (jsonString.endsWith("```")) {
            jsonString = jsonString.substring(0, jsonString.length - 3);
        }
        const parsed = JSON.parse(jsonString);

        if (parsed.tasks && Array.isArray(parsed.tasks)) {
            return parsed.tasks.map((task: any, index: number) => ({
                id: `ai-item-${Date.now()}-${index}`,
                description: task.description,
                quantity: 1,
                unitPrice: task.unitPrice,
            }));
        }
        return [];
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        // Fallback to avoid crashing the app
        return [
            { id: 'fallback-1', description: 'Fehler bei der KI-Anfrage. Bitte manuell hinzufügen.', quantity: 1, unitPrice: 0 }
        ];
    }
};