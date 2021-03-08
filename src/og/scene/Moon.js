/**
 * @module og/scene/Moon
 */
'use strict';
import { RenderNode } from './RenderNode.js';
import { Program } from '../webgl/Program.js';
import * as math from '../math.js';
import { Mat4 } from '../math/Mat4.js';
import { Vec3 } from '../math/Vec3.js';
import { Sphere } from '../shapes/Sphere.js';
import * as shaders from '../shaders/shape.js';
import { getMoonPosition } from '../astro/earth.js';

/** 
 * @param {object} options - Options:
 * @param {number} [options.radius=17375000] - initial moon radius.
 * @param {number} [options.scaleDistance=1] - scale distance to earth (default =1)
 * @param {number} [options.jDateOffset=0] - offset for current Jdate (default =0)
 * @param {boolean} [options.lightEnabled=true] - light enabled
 * @param {string} options.texture - texture (path).
 */

class Moon extends RenderNode {
    constructor(options) {
        super("Moon");
        options = options || {};

        this._currDate = 0;
        this._prevDate = 0;
        this.jDateOffset = options.jDateOffset || 0;
        this.lightEnabled = options.lightEnabled == null ? true : options.lightEnabled;
        this.scaleDist = options.scaleDistance || 1;
        this.prevScaleDist =options.scaleDistance || 1;
        this.texture = options.texture || '../../res/moonmap4k.jpg';
        this.sphere = new Sphere({
            "radius": options.radius || 1737500,
            "src": this.texture,
            "latBands": 32,
            "lonBands": 32
        });

    }

    init() {
        this.sphere.setRenderNode(this);
        if (this.lightEnabled) {
            this.renderer.handler.addProgram(shaders.shape_wl(), true)
        }
        else {
            this.renderer.handler.addProgram(shaders.shape_nl(), true)
        }
    }

    frame() {
        this._currDate = this.renderer.handler.defaultClock.currentDate + this.jDateOffset;
        if ((Math.abs(this._currDate - this._prevDate) > 0.00034) || this.scaleDist != this.prevScaleDist) {
            this.sphere.setPosition3v(getMoonPosition(this._currDate).mul(new Vec3(this.scaleDist, this.scaleDist, this.scaleDist)));
            this._prevDate = this._currDate;
            this.prevScaleDist = this.scaleDist;
        }
        this.transformLights();
        this.sphere.draw();
    }
}

export { Moon };