import { html } from '../html';

let count = 0;

function add(request: Request) {
	count++;
}
function sub(request: Request) {
	count--;
}

export function Counter() {
	return html`
		<div>
			<form id="${add}" hidden action="?/${add}" method="post" is="form-x"></form>
			<form id="${sub}" hidden action="/counter?/${sub}" method="post" is="form-x"></form>
			<button form="${sub}">-</button>
			<span>${count}</span>
			<button form="${add}">+</button>
		</div>
	`;
}
