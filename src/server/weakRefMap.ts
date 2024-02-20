export class WeakRefMap<K extends PropertyKey, V extends WeakKey> {
	#cacheMap = new Map();
	#finalizer = new FinalizationRegistry((key) => this.#cacheMap.delete(key));

	set(key: K, value: V) {
		const cache = this.get(key);
		if (cache) {
			if (cache === value) return;
			this.#finalizer.unregister(cache);
		}
		this.#cacheMap.set(key, new WeakRef(value));
		this.#finalizer.register(value, key, value);
	}

	get(key: K) {
		return this.#cacheMap.get(key)?.deref() ?? null;
	}
}
