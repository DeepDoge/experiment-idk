import { html } from '../html';
import { fastRandomId } from '../utils/randomId';

export function Hello(slot: string) {
	return html`
		<div>Hello ${fastRandomId()}</div>
		<a is="anchor-x" href="/">Home</a>
		<div>
			<a is="anchor-x" href="/hello/foo">Foo</a>
			<a is="anchor-x" href="/hello/bar">Bar</a>
		</div>
		${slot ?? ``}
	`;
}

export function Foo() {
	return html` <div>Foo</div> `;
}

export function Bar() {
	return html` <div>Bar</div> `;
}
