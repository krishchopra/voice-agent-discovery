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
		"Hello, I'd like to learn more about your services."
	);

	await discoveryService.start();
}

main().catch((error) => {
	logger.error("Application error:", error);
	process.exit(1);
});
