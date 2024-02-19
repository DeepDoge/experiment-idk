let count = 0;

function html(strings: TemplateStringsArray, ...values: unknown[]) {
	return String.raw(strings, ...values);
}

function randomId() {
	return Math.random().toString(36).slice(2);
}

function App() {
	return html`
		<!doctype html>
		<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
			<head>
				<meta charset="UTF-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
				<title>Document</title>
				<script type="module" src="/sushi.js"></script>
				<style>
					sushi-snippet {
						display: contents;
					}
				</style>
			</head>
			<body>
				<div>${randomId()}</div>
				<sushi-snippet src="/counter"> ${Counter()} </sushi-snippet>
				<sushi-snippet>
					<div>
						<a is="boosted-anchor" href="/counter">Load Counter</a>
						<a is="boosted-anchor" href="/hello">Load Hello</a>
						<style>
							@scope {
								:scope {
									display: grid;
								}
							}
						</style>
					</div>
				</sushi-snippet>
			</body>
		</html>
	`;
}

function Counter() {
	const counterAdd = randomId();
	const counterSub = randomId();
	return html`
		<div>
			<form id="${counterAdd}" hidden action="?/counter-add" method="post" is="boosted-form"></form>
			<form id="${counterSub}" hidden action="?/counter-sub" method="post" is="boosted-form"></form>
			<button form="${counterSub}">-</button>
			<span>${count}</span>
			<button form="${counterAdd}">+</button>
		</div>
	`;
}

function Hello() {
	return html`<div>Hello</div>`;
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

		if (url.search) {
			const form = await request.formData();

			if (url.search === '?/counter-add') {
				count++;
			}
			if (url.search === '?/counter-sub') {
				count--;
			}

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

		if (url.pathname === '/') {
			return new Response(App(), {
				headers: { 'Content-Type': 'text/html' }
			});
		}

		if (url.pathname === '/hello') {
			return new Response(Hello(), {
				headers: { 'Content-Type': 'text/html' }
			});
		}

		if (url.pathname === '/counter') {
			return new Response(Counter(), {
				headers: { 'Content-Type': 'text/html' }
			});
		}

		return new Response('Not Found', { status: 404 });
	}
});
