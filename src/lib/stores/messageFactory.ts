// message creation helpers
import { nanoid } from 'nanoid';
import type { ChatMessage, ChatOption, Therapist, EditableField } from '$lib/types';

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export interface MessageFactoryState {
	messages: ChatMessage[];
	isTyping: boolean;
}

export function createKarlMessage(opts: {
	content?: string;
	contentKey?: string;
	contentParams?: Record<string, unknown>;
	options?: ChatOption[];
	multiSelect?: boolean;
	inputType?: 'text' | 'plz';
	therapists?: Therapist[];
}): ChatMessage {
	return {
		id: nanoid(),
		role: 'karl',
		content: opts.content ?? '',
		contentKey: opts.contentKey,
		contentParams: opts.contentParams,
		options: opts.options,
		multiSelect: opts.multiSelect,
		inputType: opts.inputType,
		therapists: opts.therapists,
		timestamp: Date.now()
	};
}

export function createUserMessage(
	content: string,
	field?: EditableField,
	contentKey?: string
): ChatMessage {
	return {
		id: nanoid(),
		role: 'user',
		content,
		contentKey,
		field,
		timestamp: Date.now()
	};
}

// typing simulation
export async function simulateTyping(
	setTyping: (typing: boolean) => void
): Promise<void> {
	setTyping(true);
	await delay(800 + Math.random() * 400);
	setTyping(false);
}

export { delay };
