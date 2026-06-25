import { WatsonXAI } from '@ibm-cloud/watsonx-ai';
import crypto from 'node:crypto';
import { config } from '../config.js';

let client: WatsonXAI | null = null;

function getClient(): WatsonXAI {
  if (!client) {
    client = WatsonXAI.newInstance({
      version: '2024-05-31',
      serviceUrl: config.watsonxUrl,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      authenticator: { apikey: config.watsonxApiKey } as any,
    });
  }
  return client;
}

interface RecommendationContext {
  customerId: string;
  riskScore: number;
  contributingSignals: string[];
  customerTier: string;
  determinedAction: string;
}

interface ExplanationResult {
  reason: string[];
  confidence: number;
  promptHash: string;
  latencyMs: number;
}

function buildPrompt(ctx: RecommendationContext): string {
  return `You are a risk analyst AI for an e-commerce platform. Given the following risk signals for customer ${ctx.customerId} (tier: ${ctx.customerTier}), explain why the action "${ctx.determinedAction}" is recommended.

Risk score: ${ctx.riskScore}
Contributing signals: ${ctx.contributingSignals.join(', ')}

Respond in JSON format only: {"reasons": ["reason1", "reason2", ...], "confidence": 0.0-1.0}

Be concise. Each reason should be one sentence. Do not include any PII.`;
}

export async function generateExplanation(ctx: RecommendationContext): Promise<ExplanationResult> {
  const prompt = buildPrompt(ctx);
  const promptHash = crypto.createHash('sha256').update(prompt).digest('hex').slice(0, 16);
  const start = Date.now();

  try {
    const watsonx = getClient();
    
    const textGenParams = {
      input: prompt,
      modelId: config.watsonxModelId,
      projectId: config.watsonxProjectId,
      parameters: {
        max_new_tokens: 512,
        temperature: 0.7,
        top_p: 1,
        top_k: 50,
        repetition_penalty: 1.0,
      },
    };

    const response = await watsonx.generateText(textGenParams);
    const latencyMs = Date.now() - start;

    // Extract generated text from response
    const generatedText = response.result?.results?.[0]?.generated_text || '';
    
    // Try to parse JSON from the response
    let parsed: { reasons?: string[]; confidence?: number };
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = generatedText.match(/```json\s*([\s\S]*?)\s*```/) || 
                       generatedText.match(/\{[\s\S]*\}/);
      const jsonText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : generatedText;
      parsed = JSON.parse(jsonText.trim());
    } catch (parseErr) {
      console.warn('Failed to parse WatsonX response as JSON, using fallback');
      parsed = {};
    }

    return {
      reason: parsed.reasons || ctx.contributingSignals,
      confidence: parsed.confidence || 0.75,
      promptHash,
      latencyMs,
    };
  } catch (err) {
    console.error('WatsonX API error, using fallback:', err);
    return {
      reason: ctx.contributingSignals,
      confidence: 0.5,
      promptHash,
      latencyMs: Date.now() - start,
    };
  }
}

// Made with Bob
