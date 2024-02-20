// TODO: Make history API back button work
class SnippetElement extends HTMLElement {
	static get observedAttributes() {
		return ['src', 'load'];
	}

	constructor() {
		super();
		const root = this.attachShadow({ mode: 'open' });
		root.innerHTML = `<slot></slot>`;
	}

	get src(): string | null {
		return this.getAttribute('src');
	}
	set src(value: string | null) {
		if (value === null) this.removeAttribute('src');
		else this.setAttribute('src', value);
	}

	#url = this.#getUrl();
	#getUrl() {
		return this.src ? new URL(this.src, location.href) : null;
	}
	get url() {
		return this.#url as this['src'] extends string ? URL : null;
	}

	attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
		switch (name) {
			case 'src':
				this.#url = this.#getUrl();
				break;
			case 'load':
				if (newValue !== null) this.#load().then(() => this.removeAttribute('load'));
				break;
		}
	}

	async #load() {
		const src = this.getAttribute('src');
		if (src) {
			await fetch(src)
				.then((response) => response.text())
				.then((html) => (this.innerHTML = html));
		}
	}
}
declare global {
	interface HTMLElementTagNameMap {
		'snippet-x': SnippetElement;
		'snippet-x[src]': SnippetElement & { src: NonNullable<SnippetElement['src']> };
	}
}
customElements.define('snippet-x', SnippetElement);

class BoostedFormElement extends HTMLFormElement {
	constructor() {
		super();
		this.addEventListener('submit', async (event) => {
			const actionUrl = new URL(this.action, location.href);
			if (actionUrl.origin !== location.origin) return;
			event.preventDefault();

			let closestSnippet = this.closest('snippet-x[src]');

			if (actionUrl.pathname !== location.pathname) {
				while (true) {
					if (!closestSnippet) break;
					if (actionUrl.pathname.startsWith(closestSnippet.url.pathname)) break;
					closestSnippet = closestSnippet.parentElement?.closest('snippet-x[src]') ?? null;
				}
			}
			const fetchUrl = new URL(closestSnippet ? closestSnippet.url : location.href);
			fetchUrl.search = actionUrl.search;

			const response = await fetch(fetchUrl, {
				method: this.method,
				headers: {
					'X-Sushi-Request': 'true'
				},
				body: new FormData(this, event.submitter)
			});
			if (!response.ok) {
				throw new Error(response.statusText);
			}

			const html = await response.text();
			const body = closestSnippet ?? document.body;
			const dom = new DOMParser().parseFromString(html, 'text/html');
			body.replaceChildren(...dom.body.childNodes);
			// document.head.replaceWith(dom.head);
		});
	}
}
customElements.define('form-x', BoostedFormElement, {
	extends: 'form'
});
declare global {
	interface HTMLElementTagNameMap {
		'form-x': BoostedFormElement;
	}
}

class BoostedAnchorElement extends HTMLAnchorElement {
	constructor() {
		super();
		this.addEventListener('click', async (event) => {
			const anchorUrl = new URL(this.href, location.href);
			if (anchorUrl.origin !== location.origin) return;
			event.preventDefault();

			let closestSnippet = this.closest('snippet-x[src]');
			if (anchorUrl.pathname !== location.pathname) {
				while (true) {
					if (!closestSnippet) break;
					if (anchorUrl.pathname.startsWith(closestSnippet.url.pathname)) break;
					closestSnippet = closestSnippet.parentElement?.closest('snippet-x[src]') ?? null;
				}
			}

			const response = await fetch(anchorUrl, {
				headers: {
					'X-Sushi-Request': 'true'
				}
			});
			if (!response.ok) {
				throw new Error(response.statusText);
			}

			const html = await response.text();
			const body = closestSnippet ?? document.body;
			const dom = new DOMParser().parseFromString(html, 'text/html');
			body.replaceChildren(...dom.body.childNodes);

			history.pushState({}, '', anchorUrl.href);
		});
	}
}
customElements.define('anchor-x', BoostedAnchorElement, {
	extends: 'a'
});
declare global {
	interface HTMLElementTagNameMap {
		'anchor-x': BoostedAnchorElement;
	}
}
