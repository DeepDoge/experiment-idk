import type { Server } from 'bun';
import { getActionById, html, type Action } from './html';
import { rootRoute, type Route } from './routes';

type URL = InstanceType<typeof URL>; // Ok this is fucking weird

export type LoadEvent = {
	url: URL;
	request: Request;
	server: Server;
	action?: LoadEvent.ActionEvent;
};
export namespace LoadEvent {
	export type ActionEvent<T extends Action = Action> = {
		call: T;
		data: Awaited<ReturnType<T>>;
	};
}

export function actionData<T extends Action>(event: LoadEvent, action: T) {
	if (event.action?.call === action) {
		return event.action.data as Awaited<ReturnType<T>>;
	}
	return null;
}

function renderRoute(event: LoadEvent, route: Route, pathname: string, offset = 1): string | null {
	let end = pathname.indexOf('/', offset);
	if (end === -1) {
		end = pathname.length;
	}

	const segment = pathname.slice(offset, end);
	const nextRoute = route[`/${segment}` as const];

	if (event.request.headers.get('X-Sushi-Request') === 'true') {
		if (nextRoute) return renderRoute(event, nextRoute, pathname, end + 1);
		return route.page(event, html` <snippet-x src="${pathname.slice(0, end)}/"></snippet-x> `);
	}

	const slot = nextRoute ? renderRoute(event, nextRoute, pathname, end + 1) : null;
	return route.page(event, html` <snippet-x src="${pathname.slice(0, end)}">${slot ?? ''}</snippet-x> `);
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

		const event: LoadEvent = {
			url,
			request,
			server
		};

		if (url.search.startsWith('?/')) {
			const actionName = url.search.slice(2);
			const action = getActionById(actionName);
			if (action) {
				const data = await action(event);
				event.action = { call: action, data };
			}
			/* if (request.headers.get('X-Sushi-Request') !== 'true') {
				return new Response('', {
					status: 302,
					headers: {
						Location: url.pathname,
						'Content-Type': 'text/plain'
					}
				});
			} */
		}

		let page = renderRoute(event, rootRoute, url.pathname);
		if (page !== null) {
			return new Response(page, { headers: { 'Content-Type': 'text/html' } });
		}

		return new Response('Not Found', { status: 404 });
	}
});
