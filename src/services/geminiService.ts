import { GoogleGenAI, Type } from "@google/genai";
import { BlockType, MathConfig, BlockStyle, BlockEvent, Block } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface GeneratedBlock {
  type: BlockType;
  content?: string;
  htmlContent?: string;
  mathConfig?: MathConfig;
  style?: BlockStyle;
  action?: string;
  state?: Record<string, any>;
  events?: {
    onClick?: BlockEvent[] | BlockEvent;
    onHover?: BlockEvent[] | BlockEvent;
    onChanged?: BlockEvent[] | BlockEvent;
  };
  label?: string;
  src?: string;
  props?: Record<string, any>;
}

export async function generateBlockFromPrompt(
  uiPrompt: string,
  box: { x: number; y: number; w: number; h: number },
  existingBlocks: any[] = [],
  functionPrompt?: string
): Promise<GeneratedBlock> {
  const safeUiPrompt = uiPrompt.length > 5000 ? uiPrompt.substring(0, 5000) + '...[truncated]' : uiPrompt;
  const safeFunctionPrompt = functionPrompt && functionPrompt.length > 5000 ? functionPrompt.substring(0, 5000) + '...[truncated]' : functionPrompt;
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `User wants to generate a UI component inside a bounding box (x: ${box.x}, y: ${box.y}, width: ${box.w}, height: ${box.h}).
UI/Style Requirement: "${safeUiPrompt}"
${safeFunctionPrompt ? `Functionality/Logic Requirement: "${safeFunctionPrompt}"` : ''}

Current Canvas State (Existing Elements):
${JSON.stringify(existingBlocks.map(b => {
  const sanitize = (val: any): any => {
    if (typeof val === 'string' && val.length > 100) return val.substring(0, 100) + '...[truncated]';
    if (Array.isArray(val)) return val.map(sanitize);
    if (val && typeof val === 'object') {
      const res: any = {};
      for (const k in val) res[k] = sanitize(val[k]);
      return res;
    }
    return val;
  };
  return { 
    id: b.id, 
    name: b.name,
    type: b.type, 
    x: b.x,
    y: b.y,
    width: b.width,
    height: b.height,
    content: typeof b.content === 'string' && b.content.length > 100 ? b.content.substring(0, 100) + '...[truncated]' : b.content, 
    label: typeof b.label === 'string' && b.label.length > 100 ? b.label.substring(0, 100) + '...[truncated]' : b.label, 
    props: sanitize(b.props),
    state: sanitize(b.state)
  };
}), null, 2)}

Generate the appropriate block configuration.
Available block types: 'text', 'image', 'video', 'math-graph', 'quiz', 'interaction', 'interactive_button', 'action_button', 'iframe_sandbox', 'dynamic_html'.

SPATIAL REASONING & TARGET IDENTIFICATION:
If the user asks to control an existing element (e.g., "点击这个按钮隐藏下面的图片", "播放右边的视频"):
1. You MUST analyze the spatial relationship between the 'User Selection Box' (x, y, width, height) and the elements in the 'Current Canvas State' (x, y, width, height).
2. Identify the target element based on the direction (Above, Below, Left, Right).
3. Use the target element's 'name' (e.g., "图片_100_100") as the 'targetId' in the 'events' array.
4. NEVER use placeholders like "..." or "target_id". You MUST use a real name or ID from the 'Current Canvas State'.
5. If no target is found spatially, look for a target that matches the description (e.g., "the video").

For 'action_button', you MUST trigger events on other blocks using 'events.onClick'.
Example: To toggle visibility of a component named '图片_1', use:
"events": { "onClick": [{ "targetId": "图片_1", "action": "TOGGLE_VISIBILITY" }] }

Available actions: 'PLAY', 'PAUSE', 'TOGGLE_VISIBILITY', 'SHOW', 'HIDE'.

For 'video', provide the video URL in 'src' and initial state in 'state' (e.g., { "isPlaying": false, "isVisible": true }).
For 'iframe_sandbox', provide the URL in 'props.url'.
For 'dynamic_html', provide the HTML string in 'htmlContent'.
For arbitrary custom properties, place them inside the 'props' object.

CRITICAL: All generated text content, labels, and UI text MUST be in Chinese.

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
          htmlContent: {
            type: Type.STRING,
            description: "The HTML content for dynamic_html blocks",
          },
          label: { type: Type.STRING, description: "Label for buttons" },
          src: { type: Type.STRING, description: "Source URL for video/image" },
          state: {
            type: Type.OBJECT,
            description: "Initial state of the block (e.g., { isPlaying: false, isVisible: true })"
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
          props: {
            type: Type.OBJECT,
            description: "Arbitrary properties for the component (e.g., url, htmlContent, fontSize, color)"
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

export async function generateEventFromPrompt(
  prompt: string,
  sourceBlock: Block,
  existingBlocks: Block[]
): Promise<BlockEvent[]> {
  const sanitize = (val: any): any => {
    if (typeof val === 'string' && val.length > 100) return val.substring(0, 100) + '...[truncated]';
    if (Array.isArray(val)) return val.map(sanitize);
    if (val && typeof val === 'object') {
      const res: any = {};
      for (const k in val) res[k] = sanitize(val[k]);
      return res;
    }
    return val;
  };

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `User wants to create an interactive action for a UI component.
User prompt: "${prompt}"

Source Component (The one being clicked/triggered):
${JSON.stringify({ id: sourceBlock.id, name: sourceBlock.name, type: sourceBlock.type, x: sourceBlock.x, y: sourceBlock.y }, null, 2)}

Current Canvas State (Other Elements):
${JSON.stringify(existingBlocks.filter(b => b.id !== sourceBlock.id).map(b => ({ 
  id: b.id, 
  name: b.name,
  type: b.type, 
  x: b.x,
  y: b.y,
  width: b.width,
  height: b.height,
  label: b.label
})), null, 2)}

Generate an array of BlockEvent objects.
Available actions: 
- 'TOGGLE_VISIBILITY', 'SHOW', 'HIDE' (Target any block)
- 'PLAY', 'PAUSE' (Target video blocks)
- 'CREATE' (Create a new block. For this action, 'targetId' should be the type of block to create, e.g., 'right_triangle', 'text', 'image'. Use 'value' to provide properties like { x, y, width, height, content, style })

Example for creating a triangle below the button:
[
  { 
    "targetId": "right_triangle", 
    "action": "CREATE", 
    "value": { "x": 100, "y": 200, "width": 100, "height": 100, "style": { "backgroundColor": "#3b82f6" } } 
  }
]

Return the configuration as a JSON array of BlockEvent objects.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            targetId: { type: Type.STRING, description: "The ID/Name of the target block, or the type for CREATE action" },
            action: { type: Type.STRING, description: "The action to perform" },
            value: { type: Type.OBJECT, description: "Additional data for the action" }
          },
          required: ["targetId", "action"]
        }
      }
    }
  });

  try {
    return JSON.parse(response.text || "[]") as BlockEvent[];
  } catch (e) {
    console.error("Failed to parse Gemini response for events", e);
    return [];
  }
}

export async function refineCode(currentCode: string, instruction: string): Promise<string> {
  const safeCode = currentCode.length > 500000 ? currentCode.substring(0, 500000) + '...[truncated]' : currentCode;
  const safeInstruction = instruction.length > 10000 ? instruction.substring(0, 10000) + '...[truncated]' : instruction;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `You are an expert web developer. 
Current HTML/CSS/JS code:
\`\`\`html
${safeCode}
\`\`\`

User instruction for modification: "${safeInstruction}"

Please provide the updated code. Return ONLY the code, no explanations. 
CRITICAL: All visible text in the generated code MUST be in Chinese.`,
  });

  let code = response.text?.trim() || "";
  code = code.replace(/^```(html)?\s*/i, "").replace(/\s*```$/i, "");
  return code;
}
