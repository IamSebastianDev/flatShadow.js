/** @format */

import { rgbaColorString } from './rgbaColorString';

export type FlatShadowInit = {
    angle?: number;
    color?: string | rgbaColorString;
    blur?: number;
    shadowLength?: number;
    stepLength?: number;
    enableHover?: boolean;
    enableTracking?: boolean;
    forceText?: boolean;
};
