/** @format */

/**

	@license MIT

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
	/** 

        @description: The constructor is called to instantiate a shadow. It needs to be provided with a targetElement and a options object to style the shadow beyond the defaults.

        @param { HTMLElement } targetElement - the Element the shadow will be attached to.
        @param { Object } options - the options object to customize the shadow. For all values @see _internalDefaults
    
    
    */

	constructor(targetElement, options) {
		// check if a targetElement was supplied, if not, terminate and warn

		if (!targetElement) {
			console.error('FlatShadow: No target has been given.');
			return;
		}

		/**

            The _internalDefaults property descibes the default settings of the shadow. For code readabilty, the defaults are provided as a property rather than constructor arguments.

            @property { Number } angle - the angle of the shadow, defaults to 45deg. 
            @property { String } color - the color of the shadow, given as a rgba color value. defaults to the color of the element, but slighty darker
            @property { Number } blur - the amount of blur the shadow has, defaults to 0.
            @property { Number } shadowLength - the length of the Shadow in pixel, defaults to 1000. 
            @property { Number } step - the step size describes how many pixels are between each shadow instance, defaults to 2.
            @property { Boolean } trackingEnabled - enabling tracking will allow the shadow to move around, seing the mousepointer as lightsource. Defaults to false for perfomance reasons.
            @property { Boolean } hover - enabling hover will show the shadow only on hover over the element. Defaults to false.
            @property { Boolean } forceText - enabling forceText will force the shadow to be only executed on text elements. this will default to false. 
            @property { Boolean } debug - enabling debug will log the created shadow class object to the console for debugging. Will default to false. 
        */

		this._internalDefaults = {
			angle: 45,
			color: this._calulateColor(targetElement),
			blur: 0,
			shadowLength: 1000,
			step: 2,
			trackingEnabled: false,
			hover: false,
			forceText: false,
			debug: false,
		};

		/**
            
            the options for the shadow can be provided via the options object or directly through attributes on the shadow. Attributes have priority over options, which have priority over defaults. The shadow attribute object is created by merging all three objects. @see _parseTargetForAttributes 

        */

		this._shadowAttributes = Object.assign(
			{},
			this._internalDefaults,
			options,
			this._parseTargetForAttributes(targetElement)
		);

		// internalize the target element and add a fsid attribute which will be used for styling only the target element.

		this.targetElement = targetElement;

		this._fsid = this._createUUID();
		this.targetElement.setAttribute('fsid', this._fsid);

		// create and data uri stylesheet link, that the css can later be attached to

		this._dataURL = document.createElement('link');
		this._dataURL.rel = 'stylesheet';
		this._dataURL.setAttribute('fsid', this._fsid);
		document.head.appendChild(this._dataURL);

		/*

			Check if the element is a textnode, if yes, force a text-shadow

		*/

		if (!this._shadowAttributes.forceText) {
			this._shadowAttributes.forceText = this._checkForTextNode(
				this.targetElement
			);
		}

		/*

            Tracking shadows should be disabled on touch and stylus devices for compatability reasons. (Especially multitouch). 
            Check for this type of device, and if found, disable the tracking. If the debug option is set, log a warning to the console

        */

		if (
			this._shadowAttributes.trackingEnabled &&
			window.matchMedia('@media(any-hover:none)').matches
		) {
			this._shadowAttributes.trackingEnabled = false;

			// if debug is enabled, log a warning to the console

			if (this._shadowAttributes.debug) {
				console.warn(
					'FlatShadow: Tracking shadows are disabled on touch and stylus devices for compatability reasons. trackingEnabled was set to "false".'
				);
			}
		}

		// call the first paint
		this._renderShadow();

		// if tracking is enabled, create the tracker

		if (this._shadowAttributes.trackingEnabled) {
			this._createTracker();
		}

		// if debug is enabled, log the shadow to the console

		if (this._shadowAttributes.debug) {
			console.log(this);
		}
	}

	/**
    
        @description - The parseTargetForAttributes method is used to parse the targetElement for the attributes used by flatShadow to describe the shadow to be created. The attributes take priority over provided options. 

        @param { HTMLElement } targetElement - the Element that should be parsed for attributes.

        @returns { Object } an object containing the values of the attributes of the targetElement
    */

	_parseTargetForAttributes(targetElement) {
		// create the return object

		const Attributes = {};

		/* 
        
        An array of attribute names to be checked for availables values. This will ensure only the values concering flat shadow will be extracted, and other values will not pollute the object.

        */

		const ListOfAppilcableProperties = [
			'angle',
			'color',
			'blur',
			'shadowLength',
			'step',
			'trackingEnabled',
			'hover',
			'forceText',
			'debug',
		];

		// itterate over the list and add all values that are not undefined to the object.

		ListOfAppilcableProperties.forEach((prop) => {
			// look up the property

			let result = targetElement.getAttribute(`flatshadow-${prop}`);

			// if the property is not undefined, add it to the Attributes object

			if (result != undefined && result != null) {
				// check if the result is numeric, if yes, parse it as integer

				if (!isNaN(parseFloat(result))) {
					result = parseFloat(result);
				}

				// assign the attribute

				Attributes[prop] = result;
			}
		});

		// return the Attributes object

		return Attributes;
	}

	/**
	
		@description the _checkForTextNode method checks if the element is a pure textNode

		@param { HTMLElement } targetElement
		
		@returns { Boolean } a boolean indicating if the element is a pure textNode or not.
	
	*/

	_checkForTextNode(targetElement) {
		let textNode = true;

		targetElement.childNodes.forEach((node) => {
			if (node.nodeType != 3) {
				textNode = false;
			}
		});

		if (targetElement.childNodes.length === 0) {
			textNode = false;
		}

		return textNode;
	}

	/**
	
        @description: the _calculateColor method will return the background color property of the Element's Parent as a rgb value string, modified to be slightly darker.

	    @param { HTMLElement } targetElement - the element that the color should be extracted from.
		@param { Number } proposedOpacity - the proposed opacity of the shadow

        @returns { String } a rgb color value string	

    */

	_calulateColor(targetElement) {
		// get the parent Element & it's background color
		const Parent = targetElement.parentElement;
		const Color = window.getComputedStyle(Parent).backgroundColor;

		// background color will always be returned as an rgb string.

		const ColorValues = Color.match(/\d+/gim);

		// create a new darker valid rgb string and return it.

		return `rgba(${ColorValues[0] - 10}, ${ColorValues[1] - 10}, ${
			ColorValues[2] - 10
		}, 0.3)`;
	}

	/**
    
        @description the _renderShadow method calculated and renders the shadow to the page using a DataURL.
    
    */

	_renderShadow() {
		/**
        
            @description the calculateShadow function calculates the shadow string and returns it
        
            @returns { String } the shadow string
        
        */

		const calculateShadow = () => {
			// the inital shadow string
			let shadow = `0px 0px 0px ${this._shadowAttributes.color}`;

			// get the used properties in advance to streamline the property lookups.

			const AngleDeg = this._shadowAttributes.angle;
			const Length = this._shadowAttributes.shadowLength;
			const Step = this._shadowAttributes.step;
			const Blur = this._shadowAttributes.blur;
			const Color = this._shadowAttributes.color;

			// calculate the Angles of the shadow for the X & Y coordinate

			const AngleX = Math.sin(AngleDeg * (Math.PI / 180)).toFixed(2);
			const AngleY = Math.cos(AngleDeg * (Math.PI / 180)).toFixed(2);

			// Create the full shadow string using a for loop by itterating by step until the length of the shadow is reached.

			for (let i = 0; i < Length; i += Step) {
				shadow += `, ${i * AngleX}px ${
					i * AngleY
				}px ${Blur}px ${Color}`;
			}

			return shadow;
		};

		/**
        
            @description - the createStyle function creates the complete style out of the provided options and the calculated shadow.

            @return { String } a CSS String that contains the selector and the calculated shadow
        */

		const createStyle = () => {
			const Style = `*[fsid="${this._fsid}"]${
				this._shadowAttributes.hover ? ':hover' : ''
			} {
                ${
					this._shadowAttributes.forceText
						? 'text-shadow: '
						: 'box-shadow: '
				}${calculateShadow()};
            }`;

			return Style;
		};

		// encode the style link as base 64

		const Encoded = btoa(createStyle());

		// update the href of the created dataURI

		this._dataURL.href = `data:text/css;base64,${Encoded}`;
	}

	/**
    
        @description - the _updateElementOnScroll method is called on a scroll event, and updates the elementDimension property as well as the visibility of the element

    */

	_updateElementOnScroll() {
		this._elementDimension = this.targetElement.getBoundingClientRect();
		this._isCurrentlyVisible = this._checkForVisibilty();
	}

	/**
     
        @description the _checkForVisibilty method is used to determine if a element is currently inside the viewport or not. This is a internal method used to improve performance of tracking shadows. 
    
        @returns { Boolean } - a boolean indicating if the element is currently inside the viewport or not.
    */

	_checkForVisibilty() {
		let visibilty = true;

		// check if element dimensions exist, if not create them
		if (!this._elementDimension) {
			this._elementDimension = this.targetElement.getBoundingClientRect();
		}

		// get the current bounding client rect values
		const { top, bottom } = this._elementDimension;

		// check if the element's bounds are within the top / bottom viewport
		if (bottom < 0 || top > window.innerHeight) {
			visibilty = false;
		}

		// return the boolean
		return visibilty;
	}

	/**
	
		@description the _createTracker method is used to create the ev listeners used for tracking shadows.
	 
	*/

	_createTracker() {
		// the mouse move ev listener will call the tracking update

		// check if the tracker property already exists if yes, return early, if no, create the properties
		if (!this._tracker) {
			this._tracker = {};
		} else {
			return;
		}

		this._tracker.move = window.addEventListener('mousemove', (ev) => {
			this._trackShadow(ev);
		});

		// the scroll ev listener is used to determine if the element is currently visible. The reasoning being, that only a scroll can change the visibilty, not a mouse move.

		this._tracker.scroll = window.addEventListener('scroll', (ev) => {
			this._updateElementOnScroll();
		});

		// set the trackerEnabled property to true;

		this._trackerEnabled = true;
	}

	/**
	 
		@description the _removeTracker method is used to remove trackers created by the @see _createTracker method.
	
	*/

	_removeTracker() {
		// if there are no trackers, return early
		if (!this._trackers) {
			return;
		}

		window.removeEventListener('mousemove', this._tracker.move);
		window.removeEventListener('scroll', this._tracker.scroll);

		this._trackers = undefined;
	}
	/**
    
        @description the _trackShadow method is used to create and update a tracking shadow that moves with the mouse as light source

        @param { Object } ev - the event object emitted by the event listener 
    */

	_trackShadow(ev) {
		// check if the element is visibile, if not, return early
		if (!this._isCurrentlyVisible) {
			return;
		}

		// get the mousePosition from the ev
		const mousePos = { x: ev.clientX, y: ev.clientY };

		// destructure the elementDimensions for later use

		const { top, left, width, height } = this._elementDimension;

		// calculate the center of the element

		const elementCenter = {
			x: left + width / 2,
			y: top + height / 2,
		};

		/**

            Get the screen center
            @note - I do not know why the screenCenter.y coordinate is the mousePos.y coordinate. This is legacy code i struggle to understand. :(

        */

		const screenCenter = {
			x: elementCenter.x,
			y: mousePos.y,
		};

		/**
         
            @description helper function to calculate line distance between to given points

            @param { Object } p1 - The coordinate object for the first point
            @param { Object } p2 - The coordinate object for the second point

            @returns { Number } the distance between 2 points

        */

		const calculateLineDistance = (p1, p2) =>
			Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));

		// calculate the lengths of the triangle between mouse position and element to get the angle of the shadow

		const sideMouseToCenter = calculateLineDistance(
			mousePos,
			elementCenter
		);

		const sideCenterToAnchor = calculateLineDistance(
			elementCenter,
			screenCenter
		);

		// calculate the acos
		const acos =
			Math.acos(sideCenterToAnchor / sideMouseToCenter) * (180 / Math.PI);

		// calculate the quadrants
		if (mousePos.y < elementCenter.y) {
			if (mousePos.x < elementCenter.x) {
				this._shadowAttributes.angle = acos;
			} else {
				this._shadowAttributes.angle = acos * -1 + 360;
			}
		} else {
			if (mousePos.x < elementCenter.x) {
				this._shadowAttributes.angle = acos * -1 + 180;
			} else {
				this._shadowAttributes.angle = acos - 180;
			}
		}

		// request an animation frame to update the shadow
		window.requestAnimationFrame(this._renderShadow.bind(this));
	}

	/**
	 
	 	@description the _createUUID method creates a 12 charactler long unique string usable as id.
	 
		@returns { String } a 12 character long uuid string usable as unique id
	
	*/

	_createUUID() {
		// list of usable characters
		const chars =
			'aAbBcCdDeEfFgGhHiIjJkKlLmMnNoOpPqQrRsStTuUvVwWxXyYzZ0123456789';

		let uuid = [];

		// randomly look up 12 of those chars and create a output string
		for (let i = 0; i < 12; i++) {
			uuid.push(chars[Math.floor(Math.random() * chars.length) * 1]);
		}

		return uuid.join('');
	}

	/** 
    
        @note the following section contains setters for the basic properties of the element. setting a property will cause a immediate rerender to keep the shadow up to date.

    */

	_setValue(prop, value) {
		if (!isNaN(parseFloat(value))) {
			this._shadowAttributes[prop] = parseFloat(Math.abs(value));
			this._renderShadow();
		} else if (this._shadowAttributes.debug) {
			console.warn(
				`FlatShadow: ${value} for ${prop} is not an Integer or Float. This value should be parseable to type Number.`
			);
		}
	}

	/**
    
        @param { Number } value - the new angle to set on the element.

    */

	set angle(value) {
		this._setValue('angle', value);
	}

	/**
    
        @param { String } value - the new color of the shadow.

    */

	set color(value) {
		this._shadowAttributes.color = value;
		this._renderShadow();
	}

	/**
    
        @param { Number } value - the new value for the shadow blur.

    */

	set blur(value) {
		this._setValue('blur', value);
	}

	/**
    
        @param { Number } value - the new value for the shadow step.

    */

	set step(value) {
		if (value == 0) {
			if (this._shadowAttributes.debug) {
				console.warn(
					`FlatShadow: ${value} for step should not be set to 0.`
				);
			}

			return;
		}

		this._setValue('step', value);
	}

	/**
    
        @param { Number } value - the new value for the shadow length.

    */

	set shadowLength(value) {
		this._setValue('shadowLength', value);
	}

	/**
    
        @param { Boolean } value - the new value of the hover property.

    */

	set hover(value) {
		this._shadowAttributes.hover = value;
		this._renderShadow();
	}

	/**
    
        @param { Boolean } value - the new value of the tracking property

    */

	set trackingEnabled(value) {
		this._shadowAttributes.trackingEnabled = value;

		if (value) {
			this._createTracker();
		} else {
			this._removeTracker();
		}
	}
}

/**

    Add a ev listener, that will on window load automatically create a shadow on all elements with the flatShadow class.

*/

window.addEventListener('DOMContentLoaded', (ev) => {
	document
		.querySelectorAll('.flatShadow')
		.forEach((elem) => new FlatShadow(elem));
});
