import axios from "axios";

export interface CallResponse {
	id: string;
	status: string;
	recordingAvailable: boolean;
}

export class CallService {
	private apiToken: string;
	private baseUrl: string;

	constructor(apiToken: string, baseUrl: string) {
		this.apiToken = apiToken;
		this.baseUrl = baseUrl;
	}

	async startCall(
		phoneNumber: string,
		prompt: string,
		webhookUrl: string
	): Promise<string> {
		try {
			const response = await axios.post(
				`${this.baseUrl}/api/rest/exercise/start-call`,
				{
					phone_number: phoneNumber,
					prompt,
					webhook_url: webhookUrl,
				},
				{
					headers: {
						Authorization: `Bearer ${this.apiToken}`,
					},
				}
			);
			return response.data.id;
		} catch (error: any) {
			console.error("API Error Details:", {
				status: error.response?.status,
				data: error.response?.data,
				config: {
					url: error.config?.url,
					method: error.config?.method,
					headers: error.config?.headers,
					data: error.config?.data,
				},
			});
			throw new Error(`Failed to start call: ${error.message}`);
		}
	}

	async getRecording(callId: string): Promise<Buffer> {
		try {
			const url = `${this.baseUrl}/api/media/exercise`;
			console.log(`Attempting to fetch recording from: ${url}`);
			console.log(`Call ID: ${callId}`);

			const response = await axios.get(url, {
				params: { id: callId },
				responseType: "arraybuffer",
				headers: {
					Authorization: `Bearer ${this.apiToken}`,
				},
			});

			return Buffer.from(response.data);
		} catch (error: any) {
			console.error("API Error Details:", {
				status: error.response?.status,
				data: error.response?.data,
				config: {
					url: error.config?.url,
					method: error.config?.method,
					headers: error.config?.headers,
				},
			});
			throw new Error(`Failed to get recording: ${error.message}`);
		}
	}
}
