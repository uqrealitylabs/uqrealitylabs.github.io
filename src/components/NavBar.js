// yes the jquery sucks, stripped straight from public/assets/js/util

import $ from 'jquery';
import { useEffect } from 'react';

export default function NavBar() {
	var func = () => {
		var $this = $("nav");
		var $a = $this.find('a');
		var b = [];

		$a.each(function () {

			var $this = $(this),
				indent = Math.max(0, $this.parents('li').length - 1),
				href = $this.attr('href'),
				target = $this.attr('target');

			b.push(
				'<a ' +
				'class="link depth-' + indent + '"' +
				((typeof target !== 'undefined' && target != '') ? ' target="' + target + '"' : '') +
				((typeof href !== 'undefined' && href != '') ? ' href="' + href + '"' : '') +
				'>' +
				'<span class="indent-' + indent + '"></span>' +
				$this.text() +
				'</a>'
			);

		});

		return b.join('');

	};

	useEffect(() => {
		func();
	}, [])

	return <nav id="nav">
		<ul>

			<li><a href="/">Home</a></li>
			<li><a href="/about">About</a></li>
			<li><a href="/events">Events</a></li>
			<li><a href="/news">News</a></li>
			{/* <li><a href="/resources">Resources</a></li> */}
			<li><a href="/join">Join</a></li>
		</ul>
	</nav>
}
