import { html } from '../html';
import { isAction, type LoadEvent } from '../start';

let count = 0;

function add() {
	count++;
}
function sub() {
	count--;
}

export function Counter(event: LoadEvent) {
	const added = isAction(event, add);

	return html`
		<div>
			<form id="${add}" hidden action="?/${add}" method="post" is="form-x"></form>
			<form id="${sub}" hidden action="/counter?/${sub}" method="post" is="form-x"></form>
			<button form="${sub}">-</button>
			<span>${count}</span>
			<button form="${add}">+</button>
			${added ? `<div>Added</div>` : ``}
		</div>
	`;
}
