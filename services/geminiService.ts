import { GoogleGenAI } from "@google/genai";
import { SuggestionType, AiSuggestionResult } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const BASE_SYSTEM_INSTRUCTION = `You are a world-class songwriting partner. Your goal is to help the user refine and enhance their existing lyrics, NOT to replace them with a new song.

CRITICAL RULES:
1. NEVER rewrite the entire song or large sections unless specifically asked.
2. FOCUS on incremental, high-impact changes (e.g., tweaking a single line, improving a rhyme, or strengthening a metaphor).
3. MAINTAIN the existing rhyme scheme, rhythm, and meter. If you suggest a change, ensure it fits the same "pocket" as the original.
4. BE CONSTRUCTIVE. Provide specific feedback on what is working well and where there is room for growth.
5. EXPLAIN YOUR REASONING. For every suggestion, explain why it's an improvement (e.g., "This word has more emotional weight" or "This fixes a slight rhythmic hiccup").
6. RESPECT the user's original voice, style, and intent.
7. Use Markdown for clear, professional formatting.`;

function getPrompt(lyrics: string, suggestionType: SuggestionType, feedback?: string, style?: string, styleType?: 'artist' | 'genre'): string {
  let prompt = "";
  switch (suggestionType) {
    case SuggestionType.STYLE_MIMIC:
      const target = style || (styleType === 'artist' ? 'a popular musician' : 'a specific genre');
      prompt = `I am writing a song and want help writing it in the style of ${target}.
      
Current Lyrics:
---
${lyrics}
---

Task:
1. Analyze the current lyrics and provide feedback on how they currently compare to ${target}'s typical style, themes, and lyrical structure.
2. Suggest 2-3 specific improvements or additions to the lyrics that would make them feel more like a song written in the style of ${target}.
3. Provide tips on how to capture the "essence" of ${target}'s songwriting (e.g., their use of metaphors, rhythmic patterns, or common themes).
4. DO NOT rewrite the whole song. Focus on incremental changes and stylistic guidance.`;
      break;
    case SuggestionType.TIKTOK_HOOK:
      prompt = `I want to generate a catchy, viral-potential "TikTok Hook" based on my current lyrics.
      
Current Lyrics:
---
${lyrics}
---

Task:
1. Identify the most "hooky" or emotionally resonant part of the current lyrics.
2. Suggest 2-3 variations of a 15-30 second "TikTok Hook".
3. For each variation:
   - Provide the lyrics for the hook.
   - Suggest a specific "TikTok trend" or visual idea that could go with it (e.g., a transition, a dance, a POV).
   - Explain why this specific part has viral potential (e.g., "relatable lyrics", "high energy drop", "clever wordplay").
4. Keep it punchy, memorable, and easy to sing along to.`;
      break;
    case SuggestionType.NEXT_LINES:
      prompt = `I am writing a song and need help with the next two lines. 

Current Lyrics:
---
${lyrics}
---

Task:
Suggest exactly TWO new lines that naturally follow the current lyrics.
- Maintain the established rhyme scheme and rhythm.
- Ensure the theme and emotional tone remain consistent.
- Provide a brief explanation of why these lines work well as a continuation.`;
      break;
    case SuggestionType.IMPROVE:
      prompt = `I want to polish my current lyrics with small, impactful improvements.

Current Lyrics:
---
${lyrics}
---

Task:
1. Provide constructive feedback on the current lyrics (what's working, what could be stronger).
2. Suggest 2-3 specific "micro-improvements" to individual lines or phrases.
3. Focus on word choice, imagery, and emotional resonance.
4. DO NOT rewrite the whole song.

Format your suggestions as follows:
- **Feedback**: [Your constructive critique]
- **Original Line**: "[The line you are improving]"
- **Suggested Change**: "[Your refined version]"
- **Why**: [Explanation of the improvement, focusing on rhyme, rhythm, or impact]`;
      break;
    case SuggestionType.MELODY:
      prompt = `Analyze these lyrics and suggest melody ideas that complement the existing rhythm and mood.

Current Lyrics:
---
${lyrics}
---

Task:
Describe 2-3 distinct melody ideas. For each:
- Suggest a vocal contour and tempo (BPM).
- Provide a simple chord progression.
- Explain how the melody enhances the emotional impact of the specific lyrics provided.`;
      break;
    case SuggestionType.STRUCTURE:
      prompt = `Analyze the structure and lyrical devices in these lyrics.

Current Lyrics:
---
${lyrics}
---

Task:
1. Identify the sections (Verse, Chorus, etc.).
2. Evaluate the flow between sections.
3. Identify specific lyrical devices (metaphor, alliteration, etc.) and suggest how to make them even more effective without changing the core meaning.`;
      break;
    case SuggestionType.CHORDS:
      prompt = `Suggest a chord progression that fits the mood and rhythm of these lyrics.

Current Lyrics:
---
${lyrics}
---

Task:
Provide chords for the different sections. Explain how the harmonic choices support the lyrical themes and the natural rhythm of the words.`;
      break;
    case SuggestionType.RHYMES:
      prompt = `Find diverse, high-quality rhymes for the last word in these lyrics: "${lyrics.trim().split(/[\s\n]+/).pop()?.replace(/[.,!?]/g, '')}"`;
      break;
    case SuggestionType.REVIEW:
      prompt = `I want a comprehensive review of my current lyrics.
      
Current Lyrics:
---
${lyrics}
---

Task:
1. Analyze the lyrics for theme, emotional impact, and narrative flow.
2. Identify strengths in word choice, imagery, and rhythm.
3. Point out any areas that feel weak, clichéd, or rhythmically awkward.
4. Provide a high-level assessment of the overall quality and potential.
5. DO NOT suggest specific improvements yet. Just provide the review.

Format your review with clear headings and bullet points.`;
      break;
    case SuggestionType.ORIGINALITY_CHECK:
      prompt = `I want to check the originality of my lyrics.
      
Current Lyrics:
---
${lyrics}
---

Task:
1. Scan the lyrics for any sequences of three or more consecutive lines that appear in other songs.
2. If you find any matches, identify the song, artist, and the specific lines that match.
3. If no matches are found, confirm that the lyrics appear to be original.
4. Provide a brief summary of your findings.

Use Google Search to verify these lyrics against existing song databases.`;
      break;
    default:
      prompt = lyrics;
  }

  if (feedback) {
    prompt += `\n\nUser feedback on previous suggestions or specific requests for this one: "${feedback}". Please ensure your response addresses this feedback specifically.`;
  }
  return prompt;
}

export const getAiSuggestion = async (
  lyrics: string,
  suggestionType: SuggestionType,
  feedback?: string,
  companionSystemInstruction?: string,
  style?: string,
  styleType?: 'artist' | 'genre'
): Promise<AiSuggestionResult> => {
  try {
    const prompt = getPrompt(lyrics, suggestionType, feedback, style, styleType);
    const systemInstruction = companionSystemInstruction 
      ? `${BASE_SYSTEM_INSTRUCTION}\n\nAdditional context for your persona:\n${companionSystemInstruction}`
      : BASE_SYSTEM_INSTRUCTION;

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        tools: suggestionType === SuggestionType.ORIGINALITY_CHECK ? [{ googleSearch: {} }] : undefined,
      }
    });
    
    return {
      text: response.text,
      groundingChunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks
    };
  } catch (error) {
    console.error("Error getting suggestion from Gemini API:", error);
    if (error instanceof Error) {
        return { text: `An error occurred while getting your suggestion: ${error.message}. Please check your API key and try again.` };
    }
    return { text: "An unknown error occurred while getting your suggestion." };
  }
};

export const getRhymes = async (word: string): Promise<string[]> => {
    if (!word) return [];
    try {
        const prompt = `List several diverse, single-word rhymes for the word "${word}". Do not include the original word. Return only a single, comma-separated list of words with no extra text. For example: word1,word2,word3`;
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview', // Flash is sufficient and faster for this task
            contents: prompt,
        });
        const text = response.text.trim();
        if (!text) return [];
        return text.split(',').map(r => r.trim()).filter(Boolean);
    } catch (error) {
        console.error(`Error getting rhymes for "${word}":`, error);
        throw new Error("Could not fetch rhymes from the AI.");
    }
}
