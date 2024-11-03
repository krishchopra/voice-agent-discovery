import { CallService } from "./CallService";
import { TranscriptionService } from "./TranscriptService";
import { CallTree, CallNode } from "../models/CallTree";
import { WebhookServer } from "./WebhookServer";
import { logger } from "../utils/logger";
import { config } from "../utils/config";

// add this interface before the DiscoveryService class
interface BranchResponse {
	condition?: RegExp;
	prompt: string;
	isTerminal: boolean;
}

export class DiscoveryService {
	private callTree: CallTree;
	private activeCallId: string | null = null;
	private currentNodeId: string | null = null;
	private maxRetries = 3;
	private maxDepth = 2;

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
		this.webhookServer.on("recordingReady", async (webhookData: any) => {
			try {
				if (webhookData.id === this.activeCallId) {
					logger.info(
						`Processing webhook: ${JSON.stringify(webhookData)}`
					);

					switch (webhookData.status) {
						case "event_phone_call_connected":
							logger.info("Call connected");
							break;

						case "event_phone_call_ended":
							logger.info("Call ended");
							break;

						case "event_recording":
							if (
								this.currentNodeId &&
								webhookData.recording_available
							) {
								logger.info("Recording ready, processing...");
								try {
									await this.processRecordingWithRetry(
										webhookData.id
									);
								} catch (error) {
									logger.error(
										"Failed to process recording:",
										error
									);
								}
							}
							break;

						default:
							logger.info(
								`Unhandled status: ${webhookData.status}`
							);
					}
				}
			} catch (error) {
				logger.error("Error in webhook handler:", error);
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
		try {
			logger.info(`Getting recording for call ${callId}`);
			const recording = await this.callService.getRecording(callId);
			logger.info(`Got recording, size: ${recording.length} bytes`);

			logger.info("Starting transcription...");
			const transcript = await this.transcriptionService.transcribeAudio(
				recording
			);
			logger.info(
				`Transcription successful: ${JSON.stringify(transcript)}`
			);

			if (this.currentNodeId) {
				logger.info(
					`Processing response for node ${this.currentNodeId}`
				);
				this.callTree.addResponse(this.currentNodeId, transcript.text);
				this.callTree.markVisited(this.currentNodeId);
				await this.analyzeResponseAndGeneratePrompts(transcript.text);
				logger.info("Response processed, moving to next node");
			}

			await this.discoverNext();
		} catch (error) {
			logger.error("Detailed error in processRecording:", error);
			throw error;
		}
	}

	private async analyzeResponseAndGeneratePrompts(response: string) {
		if (!this.currentNodeId) return;

		const currentDepth = this.currentNodeId.split("-").length - 1;
		if (currentDepth >= this.maxDepth) {
			logger.info(
				`Max depth ${this.maxDepth} reached at node ${this.currentNodeId}`
			);
			return;
		}

		// define conversation branches
		const branches: Array<{
			trigger: RegExp;
			responses: BranchResponse[];
		}> = [
			{
				trigger: /member|gold|silver/i,
				responses: [
					{
						condition: /gold/i,
						prompt: "I'll transfer you to our Premium Concierge service right away.",
						isTerminal: true,
					},
					{
						condition: /silver/i,
						prompt: "Please describe your issue and I'll help you schedule an appointment.",
						isTerminal: false,
					},
					{
						condition: /no|not/i,
						prompt: "I'll help you collect some information to set up your membership.",
						isTerminal: false,
					},
				],
			},
			{
				trigger: /appointment|schedule/i,
				responses: [
					{
						prompt: "What day works best for you?",
						isTerminal: true,
					},
				],
			},
			{
				trigger: /issue|problem|help/i,
				responses: [
					{
						prompt: "Could you describe the issue you're experiencing?",
						isTerminal: false,
					},
				],
			},
		];

		// explore all matching branches
		for (const branch of branches) {
			if (branch.trigger.test(response)) {
				for (const branchResponse of branch.responses) {
					if (
						!branchResponse.condition ||
						branchResponse.condition.test(response)
					) {
						this.callTree.addChild(
							this.currentNodeId,
							branchResponse.prompt,
							branchResponse.isTerminal
						);
					}
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
			logger.info("\n=== Discovery Complete! ===");
			logger.info(`Total scenarios explored: ${this.getExploredCount()}`);
			logger.info(`Maximum depth reached: ${this.getMaxDepthReached()}`);
			this.callTree.printTree();
			return;
		}

		const depth = nextNode.id.split("-").length - 1;
		logger.info(`\n[Exploring Depth ${depth}] Node: ${nextNode.id}`);

		this.logProgress();

		try {
			this.currentNodeId = nextNode.id;
			this.activeCallId = await this.callService.startCall(
				this.phoneNumber,
				nextNode.prompt,
				config.webhookUrl
			);

			logger.info(
				`Started call ${this.activeCallId} with prompt: ${nextNode.prompt}`
			);
		} catch (error) {
			logger.error("Failed to start call:", error);
			if (this.currentNodeId) {
				this.callTree.markVisited(this.currentNodeId);
			}
			await this.discoverNext();
		}
	}

	public exportScenarios(): void {
		const scenarios = this.callTree.getScenarios();

		console.log("\n=== Discovered Conversation Scenarios ===\n");
		scenarios.forEach((scenario, index) => {
			console.log(`Scenario ${index + 1}:`);
			scenario.forEach((node) => {
				console.log(`  Agent: ${node.prompt}`);
				if (node.responses && node.responses.length > 0) {
					console.log(`  User: ${node.responses.join(", ")}`);
				}
				console.log();
			});
		});
	}

	private getExploredCount(): number {
		const countVisited = (node: CallNode): number => {
			let count = node.visited ? 1 : 0;
			node.children.forEach((child) => {
				count += countVisited(child);
			});
			return count;
		};
		return countVisited(this.callTree.getRoot());
	}

	private getMaxDepthReached(): number {
		const getDepth = (node: CallNode): number => {
			if (node.children.length === 0) {
				return node.id.split("-").length - 1;
			}
			return Math.max(...node.children.map((child) => getDepth(child)));
		};
		return getDepth(this.callTree.getRoot());
	}

	private logProgress() {
		const totalNodes = this.getTotalNodes(this.callTree.getRoot());
		const visitedNodes = this.getExploredCount();
		const progress = Math.round((visitedNodes / totalNodes) * 100);

		logger.info(
			`Progress: ${progress}% (${visitedNodes}/${totalNodes} nodes)`
		);
		logger.info(
			`Current depth: ${
				this.currentNodeId
					? this.currentNodeId.split("-").length - 1
					: 0
			}`
		);
	}

	private getTotalNodes(node: CallNode): number {
		let count = 1;
		node.children.forEach((child) => {
			count += this.getTotalNodes(child);
		});
		return count;
	}
}
