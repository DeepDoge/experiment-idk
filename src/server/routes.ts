import { Counter } from './lib/Counter';
import { Bar, Foo, Hello } from './lib/Hello';
import { Home } from './lib/Home';
import { Layout } from './lib/Layout';

export type Route = {
	page(slot?: string): string;
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
		page: Counter
	}
} as const satisfies Route;
