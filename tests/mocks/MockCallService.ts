import { CallService } from "../../src/services/CallService";

export class MockCallService extends CallService {
	constructor() {
		super("test_token", "http://test.com");
	}

	async startCall(): Promise<string> {
		return "test-call-id";
	}

	async getRecording(): Promise<Buffer> {
		return Buffer.from("test audio data");
	}
}
