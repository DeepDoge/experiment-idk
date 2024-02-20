import { fastRandomId } from './utils/randomId';
import { WeakRefMap } from './weakRefMap';

export type Action = Function | ((request: Request) => unknown);

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
				let id = getActionId(value);
				if (!id) {
					id = `${value.name}-${fastRandomId()}`;
					actionsMap.set(id, value);
					actionIdMap.set(value, id);
				}

				return id;
			}

			return value;
		})
	);
}
