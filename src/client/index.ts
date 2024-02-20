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
}
declare global {
	interface HTMLElementTagNameMap {
		'snippet-x': SnippetElement;
		'snippet-x[src]': SnippetElement & { src: NonNullable<SnippetElement['src']> };
	}
}
customElements.define('snippet-x', SnippetElement);

async function onSubmit(event: SubmitEvent) {
	const self = event.target as HTMLFormElement;
	const actionUrl = new URL(self.action, location.href);
	if (actionUrl.origin !== location.origin) return;
	event.preventDefault();
	let fetchUrl;
	if (actionUrl.pathname === location.pathname) {
		const closestSnippet = self.closest('snippet-x[src]');
		fetchUrl = new URL(closestSnippet ? closestSnippet.src : '', location.href);
		fetchUrl.search = actionUrl.search;
	} else {
		fetchUrl = new URL(actionUrl);
	}
	const response = await fetch(fetchUrl, {
		method: self.method,
		headers: {
			'X-Sushi-Request': 'true'
		},
		body: new FormData(self, event.submitter)
	});
	if (!response.ok) {
		throw new Error(response.statusText);
	}
	const html = await response.text();
	const dom = new DOMParser().parseFromString(html, 'text/html');
	updateSlots(dom, fetchUrl.pathname);
	pushState(actionUrl.pathname);
}

class EnhancedFormElement extends HTMLFormElement {
	constructor() {
		super();
		this.addEventListener('submit', onSubmit);
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
	const slots = document.querySelectorAll(`snippet-x[src^="${slotPath}"]`) as NodeListOf<SnippetElement>;

	for (let slot of slots) {
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
