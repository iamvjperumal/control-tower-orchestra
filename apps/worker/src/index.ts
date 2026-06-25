import { seedCustomers } from './generators/customer-generator.js';
import { runRandomBackground, runFraudScenario, runVipRetentionScenario, runRefundScenario } from './generators/scenario-orchestrator.js';
import { startRiskScorer, stopRiskScorer } from './processors/risk-scorer.js';
import { startRecommendationEngine, stopRecommendationEngine } from './processors/recommendation-engine.js';
import { stopProducer } from './services/kafka-producer.js';
import { config } from './config.js';

async function start(): Promise<void> {
  console.log('CTO Worker starting...');

  await startRiskScorer();
  await startRecommendationEngine();

  // Seed customer profiles
  await seedCustomers();

  // Run demo scenarios after a short delay
  setTimeout(async () => {
    console.log('Running demo scenarios...');
    await runFraudScenario('c-1003');
    await new Promise((r) => setTimeout(r, 5000));
    await runVipRetentionScenario('c-1001');
    await new Promise((r) => setTimeout(r, 5000));
    await runRefundScenario('c-1002');
  }, 3000);

  // Background event generation
  setInterval(async () => {
    try {
      await runRandomBackground();
    } catch (err) {
      console.error('Background generation error:', err);
    }
  }, config.generatorIntervalMs);

  console.log('CTO Worker running');
}

async function shutdown(): Promise<void> {
  console.log('Worker shutting down...');
  await stopRiskScorer();
  await stopRecommendationEngine();
  await stopProducer();
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

start().catch((err) => {
  console.error('Worker failed to start:', err);
  process.exit(1);
});
