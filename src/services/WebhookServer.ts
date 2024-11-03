import express from "express";
import { config } from "../utils/config";
import { logger } from "../utils/logger";
import { EventEmitter } from "events";

export interface WebhookPayload {
	id: string;
	status: string;
	recording_available: boolean;
}

export class WebhookServer extends EventEmitter {
	private app = express();

	constructor() {
		super();
		this.app.use(express.json());

		this.app.post("/webhook", (req, res) => {
			const payload = req.body as WebhookPayload;
			logger.info("Received webhook:", payload);

			if (payload.status === "completed" && payload.recording_available) {
				this.emit("recordingReady", payload.id);
			}

			res.sendStatus(200);
		});
	}

	start() {
		this.app.listen(config.webhookPort, () => {
			logger.info(
				`Webhook server listening on port ${config.webhookPort}`
			);
		});
	}
}
