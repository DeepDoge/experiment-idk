import type { Server } from 'bun';
import { html } from './html'; /* assert { type: 'macro' }; */

let count = 0;
let foo = 'foo';

function randomId() {
	return Math.random().toString(36).slice(2);
}

function Layout(slot: string) {
	return html` <!doctype html>
		<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
			<head>
				<meta charset="UTF-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
				<title>Document</title>
				<script type="module" src="/sushi.js"></script>
				<style>
					snippet-x {
						display: contents;
					}

					:root {
						zoom: 500%;
					}
				</style>
			</head>
			<body>
				${slot}
			</body>
		</html>`;
}
function App() {
	return html`
		<div>${randomId()}</div>
		<snippet-x src="/counter"> ${Counter()} </snippet-x>
		<a is="anchor-x" href="/hello">Hello</a>
		<a is="anchor-x" href="/counter">Counter</a>
	`;
}

function Counter() {
	const counterAdd = randomId();
	const counterSub = randomId();
	return html`
		<div>
			<form id="${counterAdd}" hidden action="?/add" method="post" is="form-x"></form>
			<form id="${counterSub}" hidden action="?/sub" method="post" is="form-x"></form>
			<button form="${counterSub}">-</button>
			<span>${count}</span>
			<button form="${counterAdd}">+</button>
		</div>
	`;
}

function Hello(slot: string) {
	return html`
		<div>Hello</div>
		<a is="anchor-x" href="/">Back</a>
		${slot ?? html`<a is="anchor-x" href="/hello/foo">Foo</a>`}
	`;
}

function Foo() {
	return html`
		<form action="?/setFoo" method="post" is="form-x">
			<input name="foo" value="${foo}" />
			<button type="submit">Set</button>
		</form>
		<div>${foo}</div>
	`;
}

type Route = {
	page(slot?: string): string;
	[path: `/${string}`]: Route;
};

const rootRoute = {
	page: Layout,
	'/': {
		page: App
	},
	'/hello': {
		page: Hello,
		'/foo': {
			page: Foo
		}
	},
	'/counter': {
		page: Counter
	}
} as const satisfies Route;

type Action = (request: Request, server: Server) => void | Promise<void>;
type Actions = Record<string, Action>;

const actions = {
	add(request, server) {
		count++;
	},
	sub(request, server) {
		count--;
	},
	async setFoo(request, server) {
		const value = await request.formData().then((data) => data.get('foo'));
		foo = String(value);
	}
} satisfies Actions;

const actionsMap = new Map<string, Action>(Object.entries(actions));
function renderRoute(request: Request, route: Route, pathname: string, offset = 1): string | null {
	let end = pathname.indexOf('/', offset);
	if (end === -1) {
		end = pathname.length;
	}

	const segment = pathname.slice(offset, end);
	const nextRoute = route[`/${segment}` as const];

	if (request.headers.get('X-Sushi-Request') === 'true') {
		if (nextRoute) return renderRoute(request, nextRoute, pathname, end + 1);
		return route.page();
	}

	const slot = nextRoute ? renderRoute(request, nextRoute, pathname, end + 1) : null;
	if (slot === null) return route.page();
	return route.page(html` <snippet-x src="${pathname.slice(0, end)}"> ${slot} </snippet-x> `);
}

Bun.serve({
	async fetch(request, server) {
		const url = new URL(request.url);
		console.log(`${request.method} ${url.pathname}${url.search}`);

		if (url.pathname === '/sushi.js') {
			// const sushiPath = new URL('../../out/index.js', import.meta.url).pathname;
			return new Response(Bun.file('./out/index.js'), {
				headers: { 'Content-Type': 'application/javascript' }
			});
		}

		if (url.search.startsWith('?/')) {
			const actionName = url.search.slice(2);
			const action = actionsMap.get(actionName);
			await action?.(request, server);
			if (request.headers.get('X-Sushi-Request') !== 'true') {
				return new Response('', {
					status: 303,
					headers: {
						Location: url.pathname,
						'Content-Type': 'text/plain'
					}
				});
			}
		}

		let page = renderRoute(request, rootRoute, url.pathname);
		if (page !== null) {
			return new Response(page, { headers: { 'Content-Type': 'text/html' } });
		}

		return new Response('Not Found', { status: 404 });
	}
});
