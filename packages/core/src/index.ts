export * from './types.js';
export { registry } from './use-case-registry.js';
export { DomainStateStore, type DomainStateStoreConfig } from './generic-state-store.js';
export { createProcessor, type ProcessorConfig, type Processor } from './generic-processor.js';
export * from './governance.js';

export { retailDefinition } from './definitions/retail.js';
export { fleetDefinition } from './definitions/fleet.js';
export { finguardDefinition } from './definitions/finguard.js';
export { factoryGuardianDefinition } from './definitions/factory-guardian.js';
export { careflowDefinition } from './definitions/careflow.js';
export { netpulseDefinition } from './definitions/netpulse.js';
export { gridwatchDefinition } from './definitions/gridwatch.js';

import { registry } from './use-case-registry.js';
import { retailDefinition } from './definitions/retail.js';
import { fleetDefinition } from './definitions/fleet.js';
import { finguardDefinition } from './definitions/finguard.js';
import { factoryGuardianDefinition } from './definitions/factory-guardian.js';
import { careflowDefinition } from './definitions/careflow.js';
import { netpulseDefinition } from './definitions/netpulse.js';
import { gridwatchDefinition } from './definitions/gridwatch.js';

registry.register(retailDefinition);
registry.register(fleetDefinition);
registry.register(finguardDefinition);
registry.register(factoryGuardianDefinition);
registry.register(careflowDefinition);
registry.register(netpulseDefinition);
registry.register(gridwatchDefinition);
