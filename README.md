# What is this?

This is some experimental idea to build web apps. It's inspired by HTMX, SvelteKit Form Actions and use:enhance.

- Gets idea of HTML as app state from HTMX.
- Also, uses the idea of form actions from SvelteKit to have a site both works with JS and without JS.

It's just an experiment, not a project or anything. I'm just trying to see if it's possible to build a web app with this idea. Proof of concept or something.

If works might make a proper project out of it.

This doesn't replace [cherry-ts](https://github.com/DeepDoge/cherry-ts). If it works, it will be a different thing. And both can be used together.

## Vision

Ok, so since there are no written down vision, I'll write it down here.
I'm gonna put some rules on what this should be.

- So we wanna have something that uses HTML as the app state. I think concept can is named "Resumability" by Qwik. But unlike Qwik, we don't use JSON to store the state. We use HTML. So it's more like HTMX.
- We want every action on the page to work without JS by default. And if JS is enabled, we want to enhance the experience. So this idea is inspired by SvelteKit's form actions and `use:enhance` directive. We should use `<form>`(s) and `<a>`(s) for actions. So when there is no JS, the browser can handle the action. And if there is JS, we can enhance the experience. To make working with `<forms>`(s) easier developers can use `form` attribute.
- So we don't wanna add things like event listeners to an element by finding element with `querySelectorAll`, or MutationObserver to observe some attributes.
  This approach is used widely by some projects, but it requires you to handle ShadowDOM too for example, and we don't know what future might bring.
  So we are gonna use the native way to handle this. We are gonna use custom elements (without ShadowDOM) with `is` attribute. For example we can do `<form is="enhanced-form">` and this will make the element enhanced/interactive using JS. This is equivalent to `<enhanced-form>`. So this is just native JS and HTML. We use `is` attribute to keep the semantics.

## Duck Typing

Alright so I started to see the idea of "Snippets" here. They are reactive parts of the page with a source. How they work atm is pretty much faulty. Just trying to figure out what is a "Snippet" and how it should work. It can be the only thing that is needed to make this work. I'm not sure yet.

What is snippet? snippet is a custom element with a `display: contents` style. It has a `src` attribute and it fetches the src and replaces it with its contents. It's like an iframe but it's just a part of the page. A snippet only fetches its content when it also has an `load` attribute, after loading, it removes the attribute. On SSR we can send it with the content and not add the `load` attribute. So it will not fetch the content again on the client. But if client wanna refresh the content, it can do it. So this is different than HTMX approach. HTMX can only update the fetched part of the page. But this can fetch the content again at multiple places.

So how do we decide when to refresh a snippet? well most of the time `<form>` itself will update the content of snippets itself. Because result of form action can be an HTML. There should be a `Map<string, SnippetElement[]>` so we can find Snippets with their src without `querySelectorAll`. So our job is deciding which snippets should update and how. Hmm maybe instead of having a map by `src`, we can make the map based on when they snippet update. For example /cart/count should update when ?/addCart action runs. But actions are not associted with paths so how, some how we should update every snippet that stars with `/cart/` or equal to `/cart` well `<form>` can be inside a snippet with a src of `/cart/add-button/abc-123itemId`.

But this still doesn't tell where to update, should it update `/cart/add-button` or `/cart` or `/`? Alright for now im just gonna have an attribute on the `<form>` element until i can find a better solution, this attribute will tell which snippets to update like update="/cart" so it will update every snippet that starts with `/cart` or equal to `/cart`. I think since with JS we get full page load anyway, all of our solution should be based on telling where to update specifically when there is JS. So snippets put themselves into a map when they are connected to the DOM. so `/cart/count` should put itself at `/cart/count` and `/cart` on the map. So map is just a listeners map for snippets. Tbh we don't even have to use a Map, we can emit events on the window, like `update:/cart` this makes more sense.

So same thing with routing? I believe I should first figure out routing before actions, it seems more complex. We should have a snippet for every route or something like that, we should or more like we should have a snippet for every slot. So let's say we have a path like this, with each page inside their parent with slots, `/a/b/c`. So HTML should be like this:

```html
Root
<snippet-x src="/">
	<!-- This is the slot -->
	<snippet-x src="/a">
		A
		<snippet-x src="/a/">
			<!-- This is the slot -->
			<snippet-x src="/a/b">
				B
				<snippet-x src="/a/b/">
					<!-- This is the slot -->
					<snippet-x src="/a/b/c"> C </snippet-x>
				</snippet-x>
			</snippet-x>
		</snippet-x>
	</snippet-x>
</snippet-x>
```

So snippet for slot should always be there even if the slot is empty. That way we know where to place the inner page. Since HTML is the state we have to specify where the slot is.
So if we are at '/', html should be like this:

```html
Root <snippet-x src="/"></snippet-x>
```

Then we go to `/a/b`:

```html
Root
<snippet-x src="/">
	<!-- This is the slot -->
	<snippet-x src="/a">
		A
		<snippet-x src="/a/">
			<!-- This is the slot -->
			<snippet-x src="/a/b"> B </snippet-x>
		</snippet-x>
	</snippet-x>
</snippet-x>
```

Ok this doesn't make sense because if we tell `src="/a"` to update it will remove B. or it will have 2 Root text if we tell `src="/"` to update. I think we can just use `<slot>`.
Or umm, updating the snippet src on page change somehow can be better. But this pratically would have a single snippet- for all routes. Which would cause everything to update.
Ok snippets are not made for routing. we need `<slot>` maybe. or `<slot-x>`.

With slots `/a/b/c` should be like this:

```html
Root
<slot-x src="/">
	A
	<slot-x src="/a/">
		B
		<slot-x src="/a/b/"> C </slot-x>
	</slot-x>
</slot-x>
```

if we goto `/` it should be like this:

```html
Root <slot-x src="/"></slot-x>
```

So we find the slot '/' and placed the new content at its parent.

then we go to `/a/b`:

```html
Root
<slot-x src="/">
	A
	<slot-x src="/a/"> B </slot-x>
</slot-x>
```

So we search for the slot `/a/` doesn't exist, so we search for `/` and place the content at its parent.

then we go to `/a/b/c`:

```html
Root
<slot-x src="/">
	A
	<slot-x src="/a/">
		B
		<slot-x src="/a/b/"> C </slot-x>
	</slot-x>
</slot-x>
```

So we search for the slot `/a/b/`, it doesn't exist, so we search for `/a/` ...
Ok so something weird, i think we should first find the slot then fetch. because if we go from `/` to `/a/b/c`, we need a, b and c.
And currently server would only give c, so we either have to tell server give me between these routes. Or fetch them one by one.
Gonna look more into HTMX boost, brb...

We don't want so many seperated logic on server side, server side should be simple, include layout or not include layout thats it.
Server side shouldn't think about more. So we should fetch them one by one.

Or not HTMX adds an header saying the current-url so based current url and requested url, server can decide what to send.
So we can just send the current url.

HTMX changes are based on element `id` we don't wanna abuse global id space. So that's why we do everything based on path. So we can have multiple snippets with same path. Or `<form>` can say, my result should also update snippets that listens changes on this path.

This way everything is more url related.
A snippet is saying to client that, "so if you wanna update this part of the html, you can get an updated version from this url/src".

Ok, also we said `<form>` can have an `data-update="/cart"` or similar attribute telling it which snippets should be updated after this form action. So `/cart` can mean only update the `/cart` and `/cart/` can mean update `/cart` and its child paths. I mean since snippets listen for events, they can listen their parent paths with `/` suffix.

But working routing is the first thing to do. So we have slots as shown above. And we should send the current url to server, so it can decide which parts to send. As you can see we use slots with paths. no random element with random id.

We make sure everything works without JS, not to make site work on older browsers, thats a side effect. We make sure site also works without JS, so it's using correct html elements for correct jobs. I was thinking seperating slots from snippets, can be problematic. Now we both have to update snippets and the slots based on form action. hmm. Maybe i can make snippets work in a way that they work like slots.
Ok so a slot path ends with `/`, so if a snippet src endsWith `/` it acts like `<slot>` perhaphs? yeah makes sense maybe... So if we try to update snippet with a src ending with `/` maybe it can only update its child snippets or not update at all. idk.

Writing snippet is kinda hard, so im just gonna call it snip. maybe i call the whole library snip and framework snip-kit.

All we have is a new element called `snip`. (and enhanced, version of `a` and `form`)
