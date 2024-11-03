import { WebhookServer } from "./services/WebhookServer";
import { CallService } from "./services/CallService";
import { TranscriptionService } from "./services/TranscriptService";
import { DiscoveryService } from "./services/DiscoveryService";
import { config } from "./utils/config";
import { logger } from "./utils/logger";

async function main() {
	const webhookServer = new WebhookServer();
	webhookServer.start();

	const callService = new CallService(config.apiToken, config.apiBaseUrl);
	const transcriptionService = new TranscriptionService(
		config.deepgramApiKey
	);

	const discoveryService = new DiscoveryService(
		callService,
		transcriptionService,
		webhookServer,
		config.testPhoneNumber,
		"Hello, this is Joe's Auto Repair virtual assistant. How can I help you today?"
	);

	await discoveryService.start();
	discoveryService.exportScenarios();
}

main().catch((error) => {
	logger.error("Application error:", error);
	process.exit(1);
});
