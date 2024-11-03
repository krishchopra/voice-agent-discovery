import { DiscoveryService } from "../../src/services/DiscoveryService";
import { WebhookServer } from "../../src/services/WebhookServer";
import { CallService } from "../../src/services/CallService";
import { TranscriptionService } from "../../src/services/TranscriptService";

jest.mock("../../src/services/CallService");
jest.mock("../../src/services/TranscriptService");

describe("DiscoveryService Integration", () => {
	let discoveryService: DiscoveryService;
	let webhookServer: WebhookServer;
	let callService: jest.Mocked<CallService>;
	let transcriptionService: jest.Mocked<TranscriptionService>;

	beforeEach(() => {
		webhookServer = new WebhookServer();
		callService = new CallService(
			"test_token",
			"http://test.api"
		) as jest.Mocked<CallService>;
		transcriptionService = new TranscriptionService(
			"test_key"
		) as jest.Mocked<TranscriptionService>;

		discoveryService = new DiscoveryService(
			callService,
			transcriptionService,
			webhookServer,
			"1234567890",
			"Initial test prompt"
		);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it("should handle the complete discovery flow", async () => {
		// mock the necessary service calls
		callService.startCall.mockResolvedValue("test-call-id");
		callService.getRecording.mockResolvedValue(Buffer.from("test audio"));
		transcriptionService.transcribeAudio.mockResolvedValue({
			text: "Yes, I would like to know more",
			confidence: 0.95,
		});

		// start the discovery process
		await discoveryService.start();

		// simulate webhook callback
		webhookServer.emit("recordingReady", "test-call-id");

		// add assertions based on expected behavior
		expect(callService.startCall).toHaveBeenCalled();
		expect(transcriptionService.transcribeAudio).toHaveBeenCalled();
	});
});
