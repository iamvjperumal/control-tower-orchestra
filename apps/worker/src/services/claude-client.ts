import Anthropic from '@anthropic-ai/sdk';
import crypto from 'node:crypto';

const client = new Anthropic();

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
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    });

    const latencyMs = Date.now() - start;
    const textContent = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('');

    const parsed = JSON.parse(textContent);
    return {
      reason: parsed.reasons || ctx.contributingSignals,
      confidence: parsed.confidence || 0.75,
      promptHash,
      latencyMs,
    };
  } catch (err) {
    console.error('Claude API error, using fallback:', err);
    return {
      reason: ctx.contributingSignals,
      confidence: 0.5,
      promptHash,
      latencyMs: Date.now() - start,
    };
  }
}
