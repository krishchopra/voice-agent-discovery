import { createClient } from "@deepgram/sdk";

export interface TranscriptionResult {
	text: string;
	confidence: number;
}

export class TranscriptionService {
	private deepgramClient;

	constructor(apiKey: string) {
		this.deepgramClient = createClient(apiKey);
	}

	async transcribeAudio(audioBuffer: Buffer): Promise<TranscriptionResult> {
		try {
			const { result, error } =
				await this.deepgramClient.listen.prerecorded.transcribeFile(
					audioBuffer,
					{
						model: "nova-2",
						smart_format: true,
					}
				);

			if (error) {
				throw new Error(
					`Deepgram transcription failed: ${error.message}`
				);
			}

			// extract the transcript and confidence from the first alternative
			const transcript =
				result.results?.channels[0]?.alternatives[0]?.transcript;
			const confidence =
				result.results?.channels[0]?.alternatives[0]?.confidence;

			if (!transcript) {
				throw new Error("No transcript found in Deepgram response");
			}

			return {
				text: transcript,
				confidence: confidence || 0,
			};
		} catch (error: any) {
			throw new Error(`Transcription failed: ${error.message}`);
		}
	}
}
