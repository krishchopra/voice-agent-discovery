import { CallService } from "./CallService";
import { TranscriptionService } from "./TranscriptService";
import { CallTree } from "../models/CallTree";
import { WebhookServer } from "./WebhookServer";
import { logger } from "../utils/logger";
import { config } from "../utils/config";

export class DiscoveryService {
	private callTree: CallTree;
	private activeCallId: string | null = null;
	private currentNodeId: string | null = null;
	private maxRetries = 3;

	constructor(
		private callService: CallService,
		private transcriptionService: TranscriptionService,
		private webhookServer: WebhookServer,
		private phoneNumber: string,
		initialPrompt: string
	) {
		this.callTree = new CallTree(initialPrompt);
		this.setupWebhookListener();
	}

	private setupWebhookListener() {
		this.webhookServer.on("recordingReady", async (callId: string) => {
			if (callId === this.activeCallId) {
				await this.processRecordingWithRetry(callId);
			}
		});
	}

	private async processRecordingWithRetry(callId: string, retryCount = 0) {
		try {
			await this.processRecording(callId);
		} catch (error) {
			if (retryCount < this.maxRetries) {
				logger.info(
					`Retrying processing recording (attempt ${retryCount + 1})`
				);
				await new Promise((resolve) =>
					setTimeout(resolve, 1000 * (retryCount + 1))
				);
				await this.processRecordingWithRetry(callId, retryCount + 1);
			} else {
				logger.error(
					`Failed to process recording after ${this.maxRetries} attempts:`,
					error
				);
				await this.discoverNext(); // move to next node even if this one failed
			}
		}
	}

	private async processRecording(callId: string) {
		const recording = await this.callService.getRecording(callId);
		const transcript = await this.transcriptionService.transcribeAudio(
			recording
		);

		if (this.currentNodeId) {
			this.callTree.addResponse(this.currentNodeId, transcript.text);
			this.callTree.markVisited(this.currentNodeId);

			await this.analyzeResponseAndGeneratePrompts(transcript.text);
		}

		await this.discoverNext();
	}

	private async analyzeResponseAndGeneratePrompts(response: string) {
		// simple response analysis to detect common patterns
		const patterns = [
			{
				trigger: /yes|yeah|correct|sure/i,
				prompt: "Can you tell me more about that?",
			},
			{
				trigger: /no|nope|not/i,
				prompt: "What would be a better option?",
			},
			{
				trigger: /how|what|when|where|why/i,
				prompt: "Let me explain that in detail.",
			},
			{
				trigger: /price|cost|money/i,
				prompt: "Would you like to know about our pricing options?",
			},
			{
				trigger: /help|support/i,
				prompt: "What kind of assistance do you need?",
			},
		];

		if (this.currentNodeId) {
			for (const pattern of patterns) {
				if (pattern.trigger.test(response)) {
					this.callTree.addChild(this.currentNodeId, pattern.prompt);
				}
			}
		}
	}

	public async start() {
		logger.info("Starting discovery process...");
		await this.discoverNext();
	}

	private async discoverNext() {
		const nextNode = this.callTree.getNextUnvisitedNode();

		if (!nextNode) {
			logger.info("Discovery complete! Final tree:");
			this.callTree.printTree();
			return;
		}

		try {
			this.currentNodeId = nextNode.id;
			this.activeCallId = await this.callService.startCall(
				this.phoneNumber,
				nextNode.prompt,
				config.webhookUrl
			);

			logger.info(
				`Started call ${this.activeCallId} for node ${nextNode.id} with prompt: ${nextNode.prompt}`
			);
		} catch (error) {
			logger.error("Failed to start call:", error);
			// retry the node later
			if (this.currentNodeId) {
				this.callTree.markVisited(this.currentNodeId);
			}
			await this.discoverNext();
		}
	}
}
