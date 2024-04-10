/**
 * Welcome to Cloudflare Workers!
 *
 * This is a template for a Queue consumer: a Worker that can consume from a
 * Queue: https://developers.cloudflare.com/queues/get-started/
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */
import puppeteer from "@cloudflare/puppeteer";

type Message = {
	url: string;
};

export interface Env {
	// Example binding to a Queue. Learn more at https://developers.cloudflare.com/queues/javascript-apis/
	MILL: Queue<Message>;
	BROWSER: Fetcher;
}

export default {

	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		// Return a URL redirect with instructions on how to use this worker
		return new Response("Redirecting...", {
			status: 301,
			headers: {
				"Location": "https://workers.quacksire.dev/mill"
			}
		});
	},

	// The queue handler is invoked when a batch of messages is ready to be delivered
	// https://developers.cloudflare.com/queues/platform/javascript-apis/#messagebatch
	async queue(batch: MessageBatch<Message>, env: Env): Promise<void> {
		let browser: puppeteer.Browser | null = null;
		try {
			// @ts-ignore
			browser = await puppeteer.launch(env.BROWSER);
		} catch {
			batch.retryAll();
			return;
		}

		for (const message of batch.messages) {
			const { url } = message.body;
			const page = await (browser as puppeteer.Browser).newPage();

			// Load the page
			await page.goto(url, {
				waitUntil: "load",
			});

			message.ack()
		}

		await browser.close();
	},
};
