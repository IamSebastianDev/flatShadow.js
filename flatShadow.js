/** @format */

/*

	FlatShadow.js
	--smallscale JS library for creating stylisticly long flat shadows
	--version: 1.0 - 27/03/2020

	see Examples at 

	MIT License

	---------------------------------------------------------------------------

	Copyright (c) 2020 Sebastian Heinz

	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in all
	copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
	SOFTWARE.

	---------------------------------------------------------------------------

*/

class FlatShadow {
	constructor(elementToAttachTo, options) {
		// Element the shadow will attach to
		this.elementToAttachTo = elementToAttachTo;

		// add id class
		this.fsid = Date.now().toString();
		this.elementToAttachTo.dataset.fsid = this.fsid;

		// check if the element is a text node
		// if the element is a text node, apply a textShadow instead of a boxShadow
		this.isTextNode = this.checkForTextNode();

		// extract the config atrributes from the attributes list if available
		const attributes = this.elementToAttachTo.attributes;

		// check for angle attribute, set default to 45;
		this.angle = attributes.getNamedItem('flatshadowangle')
			? parseInt(attributes.getNamedItem('flatshadowangle').value)
			: 45;

		// check for color attribute, set default to calculated darker color of bg.

		this.color = attributes.getNamedItem('flatshadowcolor')
			? attributes.getNamedItem('flatshadowcolor').value
			: this.calculateColor();

		// check for blur attribute, set default to 0
		this.blur = attributes.getNamedItem('flatshadowblur')
			? parseInt(attributes.getNamedItem('flatshadowblur').value)
			: 0;

		// check for length attribute, set default to 1
		this.shadowLength = attributes.getNamedItem('FlatShadowlength')
			? parseInt(attributes.getNamedItem('flatshadowlength').value)
			: 1000;

		// check for step attribute, set default to 1000
		this.step = attributes.getNamedItem('FlatShadowstepsize')
			? parseInt(attributes.getNamedItem('flatshadowstepsize').value)
			: 2;

		// check for tracking attribute, set default to false
		this.trackingEnabled = attributes.getNamedItem(
			'flatshadowenabletracking'
		)
			? attributes.getNamedItem('flatshadowenabletracking').value
			: false;

		// check for logging attribute, set default to false
		this.loggingEnabled = attributes.getNamedItem('flatshadowenablelogging')
			? attributes.getNamedItem('flatshadowenablelogging').value
			: false;

		this.hover = attributes.getNamedItem('flatshadowhover')
			? attributes.getNamedItem('flatshadowhover').value
			: false;

		this.forceText = attributes.getNamedItem('flatshadowforcetext')
			? attributes.getNamedItem('flatshadowforcetext').value
			: false;

		// if a options catalogue is provided, override the values provided in the catalogue
		if (options) {
			options.angle ? (this.angle = options.angle) : null;

			options.color ? (this.color = options.color) : null;

			options.blur ? (this.blur = options.blur) : null;

			options['length'] ? (this.shadowLength = options['length']) : null;

			options.stepSize ? (this.step = options.stepSize) : null;

			options.enableTracking
				? (this.trackingEnabled = options.enableTracking)
				: null;

			options.enableLogging
				? (this.trackingEnabled = options.enableLogging)
				: null;

			options.hover ? (this.hover = options.hover) : null;

			options.forceText ? (this.forceText = optios.forceText) : null;
		}

		// call the inital paint
		this.renderShadow();

		this.createTracker();

		if (this.loggingEnabled) {
			console.log(this);
		}

		this.elementDimensions = this.elementToAttachTo.getBoundingClientRect();

		window.addEventListener('scroll', () => {
			this.elementDimensions = this.elementToAttachTo.getBoundingClientRect();
		});
	}

	// method used to check for touch and stylus devices, to disable tracking shadows

	checkForTouchDevice() {
		return window.matchMedia('@media (any-hover: none)').matches;
	}

	// method checks if the node is a text node

	checkForTextNode() {
		let textNode = true;

		this.elementToAttachTo.childNodes.forEach(node => {
			if (node.nodeType != 3) {
				textNode = false;
			}
		});

		if (this.elementToAttachTo.childNodes.length === 0) {
			textNode = false;
		}

		return textNode;
	}

	// method to calculate shadow color

	calculateColor() {
		const color = window.getComputedStyle(
			this.elementToAttachTo.parentElement
		).backgroundColor;

		const colorValues = color.match(/\d+/gim);

		return `rgb(${colorValues[0] - 10}, ${colorValues[1] -
			10}, ${colorValues[2] - 10})`;
	}

	// create shadow element
	renderShadow() {
		// calculates the shadow

		const shadow = () => {
			let s = `0px 0px 0px ${this.color}`;

			const angleS = Math.sin(this.angle * (Math.PI / 180)).toFixed(2);
			const angleC = Math.cos(this.angle * (Math.PI / 180)).toFixed(2);

			for (let i = 0; i < this.shadowLength; i += this.step) {
				s += `, ${i * angleS}px ${i * angleC}px ${this.blur}px ${
					this.color
				}`;
			}

			return s;
		};

		if (document.querySelector(`[data-stylefsid="${this.fsid}"]`)) {
			document.querySelector(
				`[data-stylefsid="${this.fsid}"]`
			).textContent = `[data-fsid="${this.fsid}"]${
				this.hover ? ':hover' : ''
			}{
						 ${
								this.isTextNode || this.forceText
									? 'text-shadow: '
									: 'box-shadow: '
							}${shadow()} !important;
				 }`;
		} else {
			let style = document.createElement('style');
			style.dataset.stylefsid = `${this.fsid}`;
			style.textContent = `[data-fsid="${this.fsid}"]${
				this.hover ? ':hover' : ''
			}{
						 ${
								this.isTextNode || this.forceText
									? 'text-shadow: '
									: 'box-shadow: '
							}${shadow()} !important;
				 }`;
			document.querySelector('body').appendChild(style);
		}

		// adding and updating the css as data uri is apparently the most performant way, i found in testing?
		// doesnt work in safari though
	}

	// method to create the tracker

	createTracker() {
		if (this.trackingEnabled && !this.checkForTouchDevice()) {
			window.addEventListener(
				'mousemove',
				event => {
					window.requestAnimationFrame(
						this.trackMouseMovement.bind(this, event)
					);
				},
				true
			);
		}
	}

	trackMouseMovement(event) {
		// get the mousePos
		const mousePos = { x: event.clientX, y: event.clientY };

		// get the element center
		const elem = this.elementDimensions;

		const elementCenter = {
			x: elem.left + elem.width / 2,
			y: elem.top + elem.height / 2
		};

		// get the screen center
		const screenCenter = {
			x: elementCenter.x,
			y: mousePos.y
		};

		// if the elements is not visible, terminate function
		if (elem.bottom < 0 || elem.top > window.innerHeight) {
			return;
		}

		// function to calculate line distance

		const calculateLength = (point1, point2) => {
			return Math.sqrt(
				Math.pow(point2.x - point1.x, 2) +
					Math.pow(point2.y - point1.y, 2)
			);
		};

		const sideMouseToCenter = calculateLength(mousePos, elementCenter);
		const sideCenterToAnchor = calculateLength(elementCenter, screenCenter);

		const acos =
			Math.acos(sideCenterToAnchor / sideMouseToCenter) * (180 / Math.PI);

		// quadrant calculation
		if (mousePos.y < elementCenter.y) {
			if (mousePos.x < elementCenter.x) {
				this.angle = acos;
			} else {
				this.angle = acos * -1 + 360;
			}
		} else {
			if (mousePos.x < elementCenter.x) {
				this.angle = acos * -1 + 180;
			} else {
				this.angle = acos - 180;
			}
		}

		// if the elements is visible, call for a repaint
		if (elem.bottom > 0 && elem.top < window.innerHeight) {
			this.renderShadow();
		}
	}

	/* Methods for programmatically updating values */
	/* calling one of the methods will also trigger an automatic repaint of the shadow */

	/**
	 * @param {number} angle
	 */

	setAngle(angle) {
		this.angle = angle;
		this.renderShadow();
	}

	/**
	 * @param {string} color
	 */

	setColor(color) {
		this.color = color;
		this.renderShadow();
	}

	/**
	 * @param {number} blur
	 */

	setBlur(blur) {
		this.blur = blur;
		this.renderShadow();
	}

	/**
	 * @param {number} step
	 */

	setStepSize(step) {
		this.step = step;
		this.renderShadow();
	}

	/**
	 * @param {number} length
	 */

	setLength(length) {
		this.shadowLength = length;
		this.renderShadow();
	}
}

// attach the shadows for all elements with a "flatShadow" classname
window.addEventListener('DOMContentLoaded', event => {
	document
		.querySelectorAll('.flatShadow')
		.forEach(elem => new FlatShadow(elem));
});
