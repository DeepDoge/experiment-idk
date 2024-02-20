import { html } from '../html';
import { fastRandomId } from '../utils/randomId';
import { Counter } from './Counter';

export function Home() {
	return html`
		<div>${fastRandomId()}</div>
		<snippet-x src="/counter/"> ${Counter()} </snippet-x>
		<a is="anchor-x" href="/hello">Hello</a>
		<a is="anchor-x" href="/counter">Counter</a>
	`;
}
