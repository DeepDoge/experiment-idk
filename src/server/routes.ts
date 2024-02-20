import { Counter, IsOdd } from './lib/Counter';
import { Bar, Foo, Hello } from './lib/Hello';
import { Home } from './lib/Home';
import { Layout } from './lib/Layout';
import type { LoadEvent } from './start';

export type Route = {
	page: (() => string) | ((event: LoadEvent) => string) | ((event: LoadEvent, slot: string) => string);
	[path: `/${string}`]: Route;
};

export const rootRoute = {
	page: Layout,
	'/': {
		page: Home
	},
	'/hello': {
		page: Hello,
		'/foo': {
			page: Foo
		},
		'/bar': {
			page: Bar
		}
	},
	'/counter': {
		page: Counter,
		'/is-odd': {
			page: IsOdd
		}
	}
} as const satisfies Route;
