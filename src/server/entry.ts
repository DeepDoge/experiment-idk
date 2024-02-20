let count = 0;

function html(strings: TemplateStringsArray, ...values: unknown[]) {
	return String.raw(strings, ...values);
}

function randomId() {
	return Math.random().toString(36).slice(2);
}

function Layout(innerHTML: string) {
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
				<snippet-x src="/"> ${innerHTML} </snippet-x>
			</body>
		</html>`;
}
function App() {
	return html`
		<div>${randomId()}</div>
		<snippet-x src="/counter"> ${Counter()} </snippet-x>
		<a is="anchor-x" href="/hello">Load Hello</a>
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

function Hello() {
	return html`
		<div>Hello</div>
		<a is="anchor-x" href="/">Back</a>
	`;
}

function PageResponse(pageHTML: string, request: Request) {
	if (request.headers.get('X-Sushi-Request') !== 'true') {
		return new Response(Layout(pageHTML), {
			headers: { 'Content-Type': 'text/html' }
		});
	}
	return new Response(pageHTML, {
		headers: { 'Content-Type': 'text/html' }
	});
}

Bun.serve({
	async fetch(request, server) {
		const url = new URL(request.url);

		if (url.pathname === '/sushi.js') {
			// const sushiPath = new URL('../../out/index.js', import.meta.url).pathname;
			return new Response(Bun.file('./out/index.js'), {
				headers: { 'Content-Type': 'application/javascript' }
			});
		}

		if (url.search === '?/add') {
			count++;
		}
		if (url.search === '?/sub') {
			count--;
		}

		if (url.search && request.headers.get('X-Sushi-Request') !== 'true') {
			return new Response('', {
				status: 303,
				headers: {
					Location: url.pathname,
					'Content-Type': 'text/plain'
				}
			});
		}

		let page: (() => string) | null = null;
		if (url.pathname === '/') {
			page = App;
		}

		if (url.pathname === '/hello') {
			page = Hello;
		}

		if (url.pathname === '/counter') {
			page = Counter;
		}

		if (page) {
			return PageResponse(page(), request);
		}

		return new Response('Not Found', { status: 404 });
	}
});
