import { html } from '../html';

export function Layout(slot: string) {
	return html`<!doctype html>
		<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
			<head>
				<meta charset="UTF-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
				<title>Document</title>
				<script type="module" src="/sushi.js"></script>
				<style>
					snippet-x {
						display: contents;
					}

					:root {
						zoom: 500%;
					}
				</style>
			</head>
			<body>
				${slot}
			</body>
		</html>`;
}
