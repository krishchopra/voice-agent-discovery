import { CallService } from "../../src/services/CallService";
import axios from "axios";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("CallService", () => {
	let callService: CallService;

	beforeEach(() => {
		callService = new CallService("test_token", "http://test.api");
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe("startCall", () => {
		it("should successfully start a call", async () => {
			mockedAxios.post.mockResolvedValue({
				data: { id: "test-call-id" },
			});

			const result = await callService.startCall(
				"1234567890",
				"Test prompt",
				"http://webhook.url"
			);

			expect(result).toBe("test-call-id");
			expect(mockedAxios.post).toHaveBeenCalledWith(
				"http://test.api/api/rest/exercise/start-call",
				{
					phone_number: "1234567890",
					prompt: "Test prompt",
					webhook_url: "http://webhook.url",
				},
				{
					headers: {
						Authorization: "Bearer test_token",
					},
				}
			);
		});

		it("should handle errors when starting a call", async () => {
			mockedAxios.post.mockRejectedValue(new Error("API Error"));

			await expect(
				callService.startCall(
					"1234567890",
					"Test prompt",
					"http://webhook.url"
				)
			).rejects.toThrow("Failed to start call: API Error");
		});
	});

	describe("getRecording", () => {
		it("should successfully get a recording", async () => {
			const mockBuffer = Buffer.from("test audio data");
			mockedAxios.get.mockResolvedValue({ data: mockBuffer });

			const result = await callService.getRecording("test-call-id");

			expect(Buffer.isBuffer(result)).toBe(true);
			expect(mockedAxios.get).toHaveBeenCalledWith(
				"http://test.api/api/media/exercise",
				{
					params: { id: "test-call-id" },
					responseType: "arraybuffer",
					headers: {
						Authorization: "Bearer test_token",
					},
				}
			);
		});
	});
});
