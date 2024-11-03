import { TranscriptionService } from "../../src/services/TranscriptService";

// mock the entire Deepgram SDK
const mockTranscribeFile = jest.fn();
jest.mock("@deepgram/sdk", () => ({
	createClient: () => ({
		listen: {
			prerecorded: {
				transcribeFile: mockTranscribeFile,
			},
		},
	}),
}));

describe("TranscriptionService", () => {
	let transcriptionService: TranscriptionService;
	const mockAudioBuffer = Buffer.from("test audio data");

	beforeEach(() => {
		jest.clearAllMocks();
		transcriptionService = new TranscriptionService("test_key");
	});

	it("should successfully transcribe audio", async () => {
		// set up mock response
		mockTranscribeFile.mockResolvedValue({
			result: {
				results: {
					channels: [
						{
							alternatives: [
								{
									transcript: "Hello world",
									confidence: 0.95,
								},
							],
						},
					],
				},
			},
		});

		const result = await transcriptionService.transcribeAudio(
			mockAudioBuffer
		);

		expect(result).toEqual({
			text: "Hello world",
			confidence: 0.95,
		});
		expect(mockTranscribeFile).toHaveBeenCalledWith(mockAudioBuffer, {
			model: "nova-2",
			smart_format: true,
		});
	});

	it("should handle transcription errors", async () => {
		mockTranscribeFile.mockRejectedValue(new Error("Transcription failed"));

		await expect(
			transcriptionService.transcribeAudio(mockAudioBuffer)
		).rejects.toThrow("Transcription failed");
	});
});
