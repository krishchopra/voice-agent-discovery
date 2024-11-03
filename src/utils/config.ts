import dotenv from "dotenv";

dotenv.config();

export const config = {
	apiToken: process.env.API_TOKEN!,
	webhookPort: parseInt(process.env.WEBHOOK_PORT || "3000"),
	webhookUrl: process.env.WEBHOOK_URL!,
	deepgramApiKey: process.env.DEEPGRAM_API_KEY!,
	apiBaseUrl: process.env.API_BASE_URL!,
	testPhoneNumber: process.env.TEST_PHONE_NUMBER!,
};
