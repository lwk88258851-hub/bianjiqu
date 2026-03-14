import { GoogleGenAI, Type } from "@google/genai";
import { BlockType, MathConfig, BlockStyle, BlockEvent } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface GeneratedBlock {
  type: BlockType;
  content?: string;
  mathConfig?: MathConfig;
  style?: BlockStyle;
  action?: string;
  state?: Record<string, any>;
  events?: {
    onClick?: BlockEvent[];
    onHover?: BlockEvent[];
    onChanged?: BlockEvent[];
  };
  label?: string;
  src?: string;
}

export async function generateBlockFromPrompt(
  prompt: string,
  box: { x: number; y: number; w: number; h: number }
): Promise<GeneratedBlock> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `User wants to generate a UI component inside a bounding box (x: ${box.x}, y: ${box.y}, width: ${box.w}, height: ${box.h}).
User prompt: "${prompt}"

Generate the appropriate block configuration.
Available block types: 'text', 'image', 'video', 'math-graph', 'quiz', 'interaction', 'interactive_button', 'action_button'.

For 'action_button', you can trigger events on other blocks using 'events.onClick'.
Example: To play a video with ID 'vid_01', use { "targetId": "vid_01", "action": "PLAY" }.
Available actions: 'PLAY', 'PAUSE', 'TOGGLE_VISIBILITY'.

For 'video', provide the video URL in 'src' and initial state in 'state' (e.g., { "isPlaying": false }).

Return the configuration as a JSON object.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          type: {
            type: Type.STRING,
            description: "The type of the block (e.g., 'text', 'math-graph', 'action_button', 'video')",
          },
          content: {
            type: Type.STRING,
            description: "The content of the block",
          },
          label: { type: Type.STRING, description: "Label for buttons" },
          src: { type: Type.STRING, description: "Source URL for video/image" },
          state: {
            type: Type.OBJECT,
            description: "Initial state of the block (e.g., { isPlaying: false })"
          },
          events: {
            type: Type.OBJECT,
            description: "Event triggers (e.g., onClick: [{ targetId: 'vid_01', action: 'PLAY' }])",
            properties: {
              onClick: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    targetId: { type: Type.STRING },
                    action: { type: Type.STRING },
                    value: { type: Type.STRING }
                  }
                }
              }
            }
          },
          mathConfig: {
            type: Type.OBJECT,
            description: "Configuration for math-graph blocks",
            properties: {
              equation: { type: Type.STRING },
              showGrid: { type: Type.BOOLEAN },
              showLabels: { type: Type.BOOLEAN },
              variables: {
                type: Type.OBJECT,
                description: "Variables for the equation, where keys are variable names (e.g., 'a', 'b'). Example: { 'a': { min: -10, max: 10, step: 1, value: 1, allowDrag: true } }",
              }
            }
          },
          style: {
            type: Type.OBJECT,
            description: "Styling for the block (e.g., backgroundColor, color, fontSize)",
            properties: {
              backgroundColor: { type: Type.STRING },
              color: { type: Type.STRING },
              fontSize: { type: Type.STRING },
              borderRadius: { type: Type.STRING },
              fontWeight: { type: Type.STRING }
            }
          },
          action: {
            type: Type.STRING,
            description: "Action to trigger (e.g., 'toggle_visibility', 'check_answer')"
          }
        },
        required: ["type"]
      }
    }
  });

  let jsonStr = response.text?.trim() || "{}";
  jsonStr = jsonStr.replace(/^```(json)?\s*/i, "").replace(/\s*```$/i, "");
  
  try {
    return JSON.parse(jsonStr) as GeneratedBlock;
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    throw new Error("Invalid response from AI");
  }
}

export async function refineCode(currentCode: string, instruction: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `You are an expert web developer. 
Current HTML/CSS/JS code:
\`\`\`html
${currentCode}
\`\`\`

User instruction for modification: "${instruction}"

Please provide the updated code. Return ONLY the code, no explanations.`,
  });

  let code = response.text?.trim() || "";
  code = code.replace(/^```(html)?\s*/i, "").replace(/\s*```$/i, "");
  return code;
}
