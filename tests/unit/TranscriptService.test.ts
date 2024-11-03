import { TranscriptionService } from "../../src/services/TranscriptService";

jest.mock("@deepgram/sdk", () => ({
	createClient: jest.fn(() => ({
		listen: {
			prerecorded: {
				transcribeFile: jest.fn(),
			},
		},
	})),
}));

describe("TranscriptionService", () => {
	let transcriptionService: TranscriptionService;
	const mockAudioBuffer = Buffer.from("test audio data");

	beforeEach(() => {
		transcriptionService = new TranscriptionService("test_key");
	});

	it("should successfully transcribe audio", async () => {
		const mockResult = {
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
			error: null,
		};

		const deepgramClient = require("@deepgram/sdk").createClient();
		deepgramClient.listen.prerecorded.transcribeFile.mockResolvedValue(
			mockResult
		);

		const result = await transcriptionService.transcribeAudio(
			mockAudioBuffer
		);

		expect(result).toEqual({
			text: "Hello world",
			confidence: 0.95,
		});
	});

	it("should handle transcription errors", async () => {
		const deepgramClient = require("@deepgram/sdk").createClient();
		deepgramClient.listen.prerecorded.transcribeFile.mockRejectedValue(
			new Error("Transcription failed")
		);

		await expect(
			transcriptionService.transcribeAudio(mockAudioBuffer)
		).rejects.toThrow("Transcription failed");
	});
});
