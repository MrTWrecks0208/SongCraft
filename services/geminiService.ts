import { GoogleGenAI } from "@google/genai";
import { SuggestionType, AiSuggestionResult } from '../types';

if (!process.env.GEMINI_API_KEY) {
  console.warn("GEMINI_API_KEY environment variable is not set. General suggestions may fail.");
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

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
    case SuggestionType.MAKE_IT_YOURS:
      prompt = `I am writing a song and want help tweaking my current lyrics to better match my personal style, based on my past work.
      
My Past Work (Style Reference):
---
${style}
---

Current Lyrics:
---
${lyrics}
---

Task:
1. Analyze my current lyrics and compare them to my 'Past Work'. Identify what makes my past work unique (e.g., word choice, recurring themes, rhythmic structures).
2. Suggest 2-3 specific tweaks to the 'Current Lyrics' to make them align more perfectly with my established style.
3. Show the suggested changes inline and explain exactly how it matches my past work.
4. DO NOT rewrite the whole song. Focus on making it sound more like ME.`;
      break;

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

    case SuggestionType.CHECK_COMMON_PHRASES:
      prompt = `Review my current lyrics and identify any potentially overused words or phrases (clichés).

Current Lyrics:
---
${lyrics}
---

Task:
1. List any words or phrases that are very commonly used in songwriting and might benefit from more original phrasing.
2. For each identified phrase, explain *why* it's considered common or clichéd.
3. Suggest 2-3 fresh, alternative ways to express the same idea that fit the tone of the song.`;
      break;

    case SuggestionType.SENTIMENT_ANALYSIS:
      prompt = `Perform a sentiment analysis on my lyrics to help me understand the emotional tone.

Current Lyrics:
---
${lyrics}
---

Task:
1. Identify the primary emotion (or mixed emotions) conveyed in these lyrics (e.g., Hopeful, Melancholic, Angry, Nostalgic).
2. Highlight specific words or lines that contribute most strongly to this sentiment.
3. Show a brief "emotional arc" of the song (how the feeling changes from beginning to end).
4. If there's an intended tone described in the feedback, suggest 1-2 small tweaks to push the lyrics closer to that tone.`;
      break;

    case SuggestionType.TONE_SWITCHER:
      const targetTone = style || "a different tone";
      prompt = `I want to switch the tone of my lyrics to be more: ${targetTone}.

Current Lyrics:
---
${lyrics}
---

Task:
1. Analyze how the current lyrics contrast with the desired tone ("${targetTone}").
2. Suggest specific changes to vocabulary, imagery, or phrasing to shift the emotional weight toward the requested tone.
3. Provide an example of how 2-3 lines could be rewritten to match this new tone, while keeping the original meaning and rhythm as close as possible.`;
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
    case SuggestionType.GENERATE_BEAT:
      prompt = `I need a beat concept created from scratch to help me start a song.
      
Current Lyrics (if any):
---
${lyrics || "(No lyrics provided yet, create a beat to inspire me)"}
---

Task:
1. Suggest a specific BPM (tempo) and Key that fits the mood.
2. Describe the primary instruments and synths to use.
3. Provide a textual representation of the drum pattern (e.g., Kick, Snare, Hi-Hat tabs or a beatbox pattern).
4. Describe the overall vibe and energy level of the beat.
5. If lyrics are provided, explain how this beat complements the emotion and rhythm of the lyrics.`;
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
    case SuggestionType.GENERATE_SONG:
      prompt = `I want to generate lyrics or a song based on a prompt.
      
Prompt:
---
${style || lyrics}
---

Task:
1. Generate complete lyrics based strictly on the provided prompt.
2. Include song structure (e.g., Verse, Chorus, Bridge).
3. If the prompt specifies a certain mood, genre, or style, follow it closely.
4. If no specific instructions are provided other than a topic, use your creative judgment to draft an engaging song.
5. Provide a brief explanation of your creative choices.`;
      break;
    case SuggestionType.RADIO_READY:
      prompt = `I want to put the final "radio-ready" polish on these lyrics. 
      
Current Lyrics:
---
${lyrics}
---

Task:
1. Provide a final, high-level critique of the song's commercial potential and "radio-readiness".
2. Suggest 3-5 specific, sophisticated improvements to word choice, phrasing, or rhythmic flow that would elevate the song to a professional, radio-ready standard.
3. Focus on making the hook more memorable, the verses more engaging, and the overall narrative more impactful.
4. Suggest a specific "production style" or "sonic palette" that would complement these lyrics for a modern radio hit (e.g., "clean pop production with synth-driven hooks" or "raw, acoustic-driven indie folk with layered harmonies").
5. DO NOT rewrite the whole song. Provide surgical, high-impact suggestions.

Format your response with clear headings and bullet points.`;
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

export const recognizeHandwriting = async (base64Image: string, mimeType: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: [
                {
                    inlineData: {
                        data: base64Image,
                        mimeType: mimeType,
                    },
                },
                {
                    text: "Please decipher the handwriting in this image and provide the digitized lyrics. Only return the lyrics themselves, with no additional commentary.",
                },
            ],
        });
        return response.text || "";
    } catch (error) {
        console.error("Error recognizing handwriting:", error);
        throw new Error("Failed to decipher handwriting. Please ensure the image is clear.");
    }
};
