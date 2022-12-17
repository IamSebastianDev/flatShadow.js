/** @format */

import type { FlatShadowInit, rgbaColorString } from '../types';
import { uuid } from '../utils';
import { fsDefaultInit } from './fsDefaultInit';

export class FlatShadow {
    #target: Element;
    #config?: FlatShadowInit;
    fsid: string = uuid();

    constructor(target: Element, init?: FlatShadowInit) {
        // check and assign the target element
        if (!target || !(target instanceof Element)) {
            throw new TypeError(`[FlatShadow] Target element must be an instance of Element / HTMLElement.`);
        }

        this.#target = target;
        this.#target.setAttribute('fs-id', this.fsid);

        this.#config = {
            ...fsDefaultInit,
            color: this.#calculateShadowColor(),
            ...this.#getAttributeConfig(),
            ...(init || {}),
        };
    }

    #getAttributeConfig(): Record<string, unknown> {
        const res = Object.fromEntries(
            ['angle', 'color', 'blur', 'shadowLength', 'stepLength', 'enableHover', 'enableTracking', 'forceText']
                .map((key) => {
                    let parsed;
                    const attribute = this.#target.getAttribute(`fs-${key}`);

                    if (attribute !== null && !Number.isNaN(parseFloat(attribute))) {
                        parsed = parseFloat(attribute);
                    }

                    return [key, parsed];
                })
                .filter(([, parsed]) => parsed !== null && parsed !== undefined)
        );

        console.log({ res });
        return res;
    }

    #calculateShadowColor(): rgbaColorString {
        const parent = this.#target.parentElement;

        if (!parent || !(parent instanceof Element)) {
            return `rgba(155, 155, 155 / 0.3)`;
        }

        const { backgroundColor } = window.getComputedStyle(parent);
        const [r, g, b] = backgroundColor.match(/\d+/gim) as [string, string, string];

        return `rgba(${+r - 10}, ${+g - 10}, ${+b - 10} / 0.3)`;
    }
}
