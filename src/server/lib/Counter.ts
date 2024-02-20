import { html } from '../html';
import { actionData, type LoadEvent } from '../start';

let count = 0;

function add(event: LoadEvent) {
	count++;
	return {
		date: new Date()
	};
}
function sub() {
	count--;
}

export function Counter(event: LoadEvent) {
	const addData = actionData(event, add);

	return html`
		<div>
			<form id="${add}" hidden action="?/${add}" method="post" is="form-x"></form>
			<form id="${sub}" hidden action="/counter?/${sub}" method="post" is="form-x"></form>
			<button form="${sub}">-</button>
			<span>${count}</span>
			<button form="${add}">+</button>
			${addData ? html`<div>Added at: ${addData.date}</div>` : ``}
		</div>
	`;
}
