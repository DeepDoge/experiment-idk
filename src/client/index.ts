// TODO: Make history API back button work
class SnippetElement extends HTMLElement {
	static get observedAttributes() {
		return ['src', 'load'];
	}

	constructor() {
		super();
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

class EnhancedFormElement extends HTMLFormElement {
	constructor() {
		super();
		this.addEventListener('submit', async (event) => {
			const actionUrl = new URL(this.action, location.href);
			if (actionUrl.origin !== location.origin) return;
			event.preventDefault();

			let fetchUrl: URL;
			if (actionUrl.pathname === location.pathname) {
				let closestSnippet = this.closest('snippet-x[src]');

				console.log({ closestSnippet: closestSnippet?.url.href });
				fetchUrl = new URL(closestSnippet ? closestSnippet.url : location.href);
				fetchUrl.search = actionUrl.search;

				console.log({ fetchUrl: fetchUrl.href });
			} else {
				fetchUrl = new URL(actionUrl);
			}

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
			const dom = new DOMParser().parseFromString(html, 'text/html');
			updateSlots(dom, fetchUrl.pathname);
			pushState(actionUrl.pathname);
		});
	}
}
customElements.define('form-x', EnhancedFormElement, {
	extends: 'form'
});
declare global {
	interface HTMLElementTagNameMap {
		'form-x': EnhancedFormElement;
	}
}

function pushState(pathname: string) {
	if (pathname === location.pathname) return;
	history.pushState(pathname, '', pathname);
}
history.scrollRestoration = 'auto';
window.addEventListener('load', () => {
	history.replaceState(location.pathname, '', location.pathname);
});
window.addEventListener('popstate', (event) => {
	const pathname = event.state as unknown;
	if (typeof pathname !== 'string') return;
	console.log({ pathname });
	goto(pathname);
});

async function handleGoto(event: MouseEvent) {
	const url = new URL((event.target as HTMLAnchorElement).href, location.href);
	if (url.origin !== location.origin) return;
	event.preventDefault();
	return await goto(url);
}

export async function goto(to: string | URL) {
	const url = new URL(to, location.href);

	const response = await fetch(to, {
		headers: {
			'X-Sushi-Request': 'true'
		}
	});
	if (!response.ok) {
		throw new Error(response.statusText);
	}

	const html = await response.text();
	const dom = new DOMParser().parseFromString(html, 'text/html');

	updateSlots(dom, url.pathname);
	pushState(url.pathname);
}

function updateSlots(dom: Document, pathname: string) {
	const slotPath = `${pathname.slice(0, pathname.lastIndexOf('/'))}/`;
	console.log({ slotPath });
	const slots = document.querySelectorAll(`snippet-x[src^="${slotPath}"]`) as NodeListOf<SnippetElement>;

	for (const slot of slots) {
		console.log(slot);
		slot.replaceChildren(...dom.body.cloneNode(true).childNodes);
		slot.src = pathname;
	}
}

class EnhancedAnchorElement extends HTMLAnchorElement {
	constructor() {
		super();
		this.addEventListener('click', handleGoto);
	}
}
customElements.define('anchor-x', EnhancedAnchorElement, {
	extends: 'a'
});
declare global {
	interface HTMLElementTagNameMap {
		'anchor-x': EnhancedAnchorElement;
	}
}
