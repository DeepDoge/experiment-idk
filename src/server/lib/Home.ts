import { html } from '../html';
import type { LoadEvent } from '../start';
import { fastRandomId } from '../utils/randomId';
import { Counter } from './Counter';

export function Home(event: LoadEvent) {
	return html`
		<div>${fastRandomId()}</div>
		<snippet-x src="/counter/"> ${Counter(event)} </snippet-x>
		<snippet-x src="/counter/"> ${Counter(event)} </snippet-x>
		<a is="anchor-x" href="/hello">Hello</a>
		<a is="anchor-x" href="/counter">Counter</a>
	`;
}
