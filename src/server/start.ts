import { getActionById, html } from './html';
import { rootRoute, type Route } from './routes';

function renderRoute(request: Request, route: Route, pathname: string, offset = 1): string | null {
	let end = pathname.indexOf('/', offset);
	if (end === -1) {
		end = pathname.length;
	}

	const segment = pathname.slice(offset, end);
	const nextRoute = route[`/${segment}` as const];

	if (request.headers.get('X-Sushi-Request') === 'true') {
		if (nextRoute) return renderRoute(request, nextRoute, pathname, end + 1);
		return route.page(html` <snippet-x src="${pathname.slice(0, offset)}/"></snippet-x> `);
	}

	const slot = nextRoute ? renderRoute(request, nextRoute, pathname, end + 1) : null;
	return route.page(html` <snippet-x src="${pathname.slice(0, offset)}">${slot ?? ''}</snippet-x> `);
}

Bun.serve({
	async fetch(request, server) {
		const url = new URL(request.url);
		console.log(`${request.method} ${url.pathname}${url.search}`);

		if (url.pathname === '/sushi.js') {
			const sushiPath = new URL('../../out/index.js', import.meta.url).pathname;
			return new Response(Bun.file(sushiPath), {
				headers: { 'Content-Type': 'application/javascript' }
			});
		}

		if (url.search.startsWith('?/')) {
			const actionName = url.search.slice(2);
			const action = getActionById(actionName);
			await action?.(request);
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
