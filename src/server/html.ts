import type { LoadEvent } from './start';
import { fastRandomId } from './utils/randomId';
import { WeakRefMap } from './weakRefMap';

export type Action = ((event: LoadEvent) => unknown) | (() => unknown);

const actionsMap = new WeakRefMap<string, Action>();
export function getActionById(id: string): Action | null {
	return actionsMap.get(id) ?? null;
}

const actionIdMap = new WeakMap<Action, string>();
export function getActionId(action: Action): string | null {
	return actionIdMap.get(action) ?? null;
}

export function html(strings: TemplateStringsArray, ...values: unknown[]) {
	return String.raw(
		strings,
		...values.map((value) => {
			if (value instanceof Function) {
				const valueAsAction = value as Action;
				let id = getActionId(valueAsAction);
				if (!id) {
					id = `${value.name}-${fastRandomId()}`;
					actionsMap.set(id, valueAsAction);
					actionIdMap.set(valueAsAction, id);
				}

				return id;
			}

			return value;
		})
	);
}
