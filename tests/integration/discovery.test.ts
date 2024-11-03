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
		jest.clearAllMocks();

		webhookServer = new WebhookServer();
		callService = {
			startCall: jest.fn().mockResolvedValue("test-call-id"),
			getRecording: jest
				.fn()
				.mockResolvedValue(Buffer.from("test audio")),
		} as any;

		transcriptionService = {
			transcribeAudio: jest.fn().mockResolvedValue({
				text: "Yes, I would like to know more",
				confidence: 0.95,
			}),
		} as any;

		discoveryService = new DiscoveryService(
			callService,
			transcriptionService,
			webhookServer,
			"1234567890",
			"Initial test prompt"
		);
	});

	it("should handle the complete discovery flow", async () => {
		// start the discovery process
		await discoveryService.start();

		// verify initial call was made
		expect(callService.startCall).toHaveBeenCalledWith(
			"1234567890",
			"Initial test prompt",
			expect.any(String)
		);

		// simulate webhook callbacks
		webhookServer.emit("recordingReady", {
			id: "test-call-id",
			status: "event_phone_call_connected",
			recording_available: false,
		});
		await new Promise((resolve) => setTimeout(resolve, 10));

		webhookServer.emit("recordingReady", {
			id: "test-call-id",
			status: "event_phone_call_ended",
			recording_available: false,
		});
		await new Promise((resolve) => setTimeout(resolve, 10));

		webhookServer.emit("recordingReady", {
			id: "test-call-id",
			status: "event_recording",
			recording_available: true,
		});
		await new Promise((resolve) => setTimeout(resolve, 100));

		// verify the recording was processed
		expect(callService.getRecording).toHaveBeenCalledWith("test-call-id");
		expect(transcriptionService.transcribeAudio).toHaveBeenCalled();
	});
});
