import type { Stroke } from './drawing/types.js';

export type SyncMessage =
	| { type: 'nav'; slide: number; step: number }
	| { type: 'draw'; slide: number; strokes: Stroke[] }
	| { type: 'draw-clear'; slide: number };

export class PresenterSync {
	private channel: BroadcastChannel;
	private navCallback: ((msg: Extract<SyncMessage, { type: 'nav' }>) => void) | null = null;
	private drawCallback: ((msg: SyncMessage) => void) | null = null;

	constructor() {
		this.channel = new BroadcastChannel('reslides-presenter-sync');
		this.channel.onmessage = (e: MessageEvent<SyncMessage>) => {
			const msg = e.data;
			if (!msg?.type) return;
			if (msg.type === 'nav' && this.navCallback) {
				this.navCallback(msg);
			} else if ((msg.type === 'draw' || msg.type === 'draw-clear') && this.drawCallback) {
				this.drawCallback(msg);
			}
		};
	}

	send(slide: number, step: number): void {
		this.channel.postMessage({ type: 'nav', slide, step } satisfies SyncMessage);
	}

	sendDrawing(slide: number, strokes: Stroke[]): void {
		this.channel.postMessage({ type: 'draw', slide, strokes } satisfies SyncMessage);
	}

	sendDrawClear(slide: number): void {
		this.channel.postMessage({ type: 'draw-clear', slide } satisfies SyncMessage);
	}

	onReceive(callback: (msg: Extract<SyncMessage, { type: 'nav' }>) => void): void {
		this.navCallback = callback;
	}

	onDrawReceive(callback: (msg: SyncMessage) => void): void {
		this.drawCallback = callback;
	}

	destroy(): void {
		this.channel.close();
	}
}
