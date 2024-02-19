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

	get url() {
		return this.src ? new URL(this.src, location.href) : null;
	}

	attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
		if (name === 'load') {
			if (newValue !== null) {
				this.#load().then(() => this.removeAttribute('load'));
			}
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
		'sushi-snippet': SnippetElement;
	}
}
customElements.define('sushi-snippet', SnippetElement);

class BoostedFormElement extends HTMLFormElement {
	constructor() {
		super();
		this.addEventListener('submit', async (event) => {
			const actionUrl = new URL(this.action, location.href);
			if (actionUrl.host !== location.host) return;
			event.preventDefault();

			let closestSnippet = this.closest('sushi-snippet');
			if (actionUrl.pathname !== location.pathname) {
				while (true) {
					if (!closestSnippet?.url) break;
					if (actionUrl.pathname.startsWith(closestSnippet.url.pathname)) break;
					closestSnippet = closestSnippet.parentElement?.closest('sushi-snippet') ?? null;
				}
			}

			const fetchUrl = new URL(closestSnippet ? closestSnippet.url ?? actionUrl : location.href);
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

			if (closestSnippet) {
				closestSnippet.innerHTML = html;
			} else {
				const dom = new DOMParser().parseFromString(html, 'text/html');
				document.body.replaceWith(dom.body);
				document.head.replaceWith(dom.head);
			}
		});
	}
}
customElements.define('boosted-form', BoostedFormElement, {
	extends: 'form'
});
declare global {
	interface HTMLElementTagNameMap {
		'boosted-form': BoostedFormElement;
	}
}

class BoostedAnchorElement extends HTMLAnchorElement {
	constructor() {
		super();
		this.addEventListener('click', async (event) => {
			const anchorUrl = new URL(this.href, location.href);
			if (anchorUrl.host !== location.host) return;
			event.preventDefault();

			let closestSnippet = this.closest('sushi-snippet');
			if (anchorUrl.pathname !== location.pathname) {
				while (true) {
					if (!closestSnippet?.url) break;
					if (anchorUrl.pathname.startsWith(closestSnippet.url.pathname)) break;
					closestSnippet = closestSnippet.parentElement?.closest('sushi-snippet') ?? null;
				}
			}

			const fetchUrl = new URL(closestSnippet ? closestSnippet.url ?? anchorUrl : location.href);
			fetchUrl.search = anchorUrl.search;

			const response = await fetch(anchorUrl, {
				headers: {
					'X-Sushi-Request': 'true'
				}
			});
			if (!response.ok) {
				throw new Error(response.statusText);
			}

			const html = await response.text();

			if (closestSnippet) {
				if (!closestSnippet.src) {
					closestSnippet.src = anchorUrl.pathname;
				}
				closestSnippet.innerHTML = html;
			} else {
				const dom = new DOMParser().parseFromString(html, 'text/html');
				document.body.replaceWith(dom.body);
				document.head.replaceWith(dom.head);
			}
		});
	}
}
customElements.define('boosted-anchor', BoostedAnchorElement, {
	extends: 'a'
});
declare global {
	interface HTMLElementTagNameMap {
		'boosted-anchor': BoostedAnchorElement;
	}
}
