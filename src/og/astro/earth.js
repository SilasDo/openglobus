/**
 * @module og/astro/earth
 */

'use strict';

import * as jd from './jd.js';
import * as math from '../math.js';
import * as astro from './astro.js';
import { Quat } from '../math/Quat.js';
import { Vec3 } from '../math/Vec3.js';

/**
 * Returns Moon position in the geocentric coordinate system by the time.
 * @param {Number} jDate - Julian date time.
 * @returns {og.Vec3} - Moon geocentric coordinates.
 */
export function getMoonPosition(jDate) {
    // http://stjarnhimlen.se/comp/tutorial.html
    var d = jDate - jd.J2000;
    //d = -3543 //test
    var N = math.rev(125.1228 - 0.0529538083  * d);    //(Long asc. node)
    var i =   5.1454;                                  //(Inclination)
    var w = math.rev(318.0634 + 0.1643573223  * d);    //(Arg. of perigee)
    var a =  60.2666;                                  //(Mean distance)
    var e = 0.054900;                                  //(Eccentricity)
    var M = math.rev(115.3654 + 13.0649929509 * d);    //(Mean anomaly)

    //eccentric anomaly.
    var E1 = M + (180/Math.PI) * e * Math.sin(M*math.RADIANS) * (1 + e * Math.cos(M*math.RADIANS));
    do{
    var E0 =E1;
    E1 = E0 - (E0 - (180/Math.PI) * e * Math.sin(E0*math.RADIANS) - M) / (1 - e * Math.cos(E0*math.RADIANS));
    }while(Math.abs(E0-E1)>0.005);

    var E = E1;

    var x = a * (Math.cos(E*math.RADIANS) - e);
    var y = a * Math.sqrt(1- e*e) *Math.sin(E*math.RADIANS);

    //convert this to distance and true anonaly
    var r = Math.sqrt(x*x+ y*y);
    var v = Math.atan2(y,x)*math.DEGREES;

    //the Moon's position in ecliptic coordinates
    var xeclip = r * ( Math.cos(N*math.RADIANS) * Math.cos((v+w)*math.RADIANS) - Math.sin(N*math.RADIANS) * Math.sin((v+w)*math.RADIANS) * Math.cos(i*math.RADIANS) );
    var yeclip = r * ( Math.sin(N*math.RADIANS) * Math.cos((v+w)*math.RADIANS) + Math.cos(N*math.RADIANS) * Math.sin((v+w)*math.RADIANS) * Math.cos(i*math.RADIANS) );
    var zeclip = r * Math.sin((v+w)*math.RADIANS) * Math.sin(i*math.RADIANS);

    var long =  Math.atan2( yeclip, xeclip ) *math.DEGREES;
    var lat  =  Math.atan2( zeclip, Math.sqrt( xeclip*xeclip + yeclip*yeclip ) )*math.DEGREES;
    var re    =  Math.sqrt( xeclip*xeclip + yeclip*yeclip + zeclip*zeclip );


    var ws = 282.9404 + 4.70935E-5 * d; //Sun's longitude of perihelion
    var Ms = math.rev(356.0470 + 0.9856002585 * d); //Sun mean anomaly
    var Ls =  math.rev(ws + Ms);//Sun's mean longitude
    var Lm = math.rev(N+w+M); //Moon's mean longitude
    var Mm = M; // Moon's mean anomaly
    var D = math.rev(Lm -Ls); //Moon's mean elongation
    var F = math.rev(Lm - N); //Moon's argument of latitude

    //Perturbations in longitude (degrees):
    long += -1.274 * Math.sin((Mm - 2*D)*math.RADIANS)  //(Evection)
        + 0.658 * Math.sin(2*D*math.RADIANS)  //(Variation)
        -0.186 * Math.sin((Ms)*math.RADIANS)          //(Yearly equation)
        -0.059 * Math.sin((2*Mm - 2*D)*math.RADIANS)
        -0.057 * Math.sin((Mm - 2*D + Ms)*math.RADIANS)
        +0.053 * Math.sin((Mm + 2*D)*math.RADIANS)
        +0.046 * Math.sin((2*D - Ms)*math.RADIANS)
        +0.041 * Math.sin((Mm - Ms)*math.RADIANS)
        -0.035 * Math.sin((D)*math.RADIANS)            //(Parallactic equation)
        -0.031 * Math.sin((Mm + Ms)*math.RADIANS)
        -0.015 * Math.sin((2*F - 2*D)*math.RADIANS)
        +0.011 * Math.sin((Mm - 4*D)*math.RADIANS);
    // Perturbations in latitude (degrees):
    lat  += -0.173 * Math.sin((F - 2*D)*math.RADIANS)
            -0.055 * Math.sin((Mm - F - 2*D)*math.RADIANS)
            -0.046 * Math.sin((Mm + F - 2*D)*math.RADIANS)
            +0.033 * Math.sin((F + 2*D)*math.RADIANS)
            +0.017 * Math.sin((2*Mm + F)*math.RADIANS);
    // Perturbations in lunar distance (Earth radii):
    re += -0.58 * Math.cos((Mm - 2*D)*math.RADIANS)
          -0.46 * Math.cos(2*D*math.RADIANS);
        
    re *= 6371000; //* Earth radii

    var oblecl= 23.4393 - 3.563E-7 * d;

    xeclip = re * Math.cos(long*math.RADIANS) * Math.cos(lat*math.RADIANS)
    yeclip = re * Math.sin(long*math.RADIANS) * Math.cos(lat*math.RADIANS)
    zeclip = re * Math.sin(lat*math.RADIANS)

    //x-rotation
    var xequat = xeclip
    var yequat = yeclip * Math.cos(oblecl*math.RADIANS) - zeclip * Math.sin(oblecl*math.RADIANS)
    var zequat = yeclip * Math.sin(oblecl*math.RADIANS) + zeclip * Math.cos(oblecl*math.RADIANS)

    //var RA = Math.atan2(yequat, xequat) * math.DEGREES;
    //var Decl = Math.atan2(zequat, Math.sqrt(xequat * xequat + yequat * yequat)) * math.DEGREES;
    return (new Vec3(-yequat,zequat,-xequat));
}

/**
 * Returns Sun position in the geocentric coordinate system by the time.
 * @param {Number} jDate - Julian date time.
 * @returns {og.Vec3} - Sun geocentric coordinates.
 */
export function getSunPosition(jDate) {
    // http://stjarnhimlen.se/comp/tutorial.html
    // a  Mean distance, or semi-major axis
    // e  Eccentricity
    // T  Time at perihelion

    // q  Perihelion distance  = a * (1 - e)    
    // Q  Aphelion distance    = a * (1 + e)

    // i  Inclination, i.e. the "tilt" of the orbit relative to the
    //    ecliptic.  The inclination varies from 0 to 180 degrees. If
    //    the inclination is larger than 90 degrees, the planet is in
    //    a retrogade orbit, i.e. it moves "backwards".  The most
    //    well-known celestial body with retrogade motion is Comet Halley.

    // N  (usually written as "Capital Omega") Longitude of Ascending
    //    Node. This is the angle, along the ecliptic, from the Vernal
    //    Point to the Ascending Node, which is the intersection between
    //    the orbit and the ecliptic, where the planet moves from south
    //    of to north of the ecliptic, i.e. from negative to positive
    //    latitudes.

    // w  (usually written as "small Omega") The angle from the Ascending
    //    node to the Perihelion, along the orbit.

    // P  Orbital period       = 365.256898326 * a**1.5/sqrt(1+m) days,
    //    where m = the mass of the planet in solar masses (0 for
    //    comets and asteroids). sqrt() is the square root function.

    // n  Daily motion         = 360_deg / P    degrees/day

    // t  Some epoch as a day count, e.g. Julian Day Number. The Time
    //    at Perihelion, T, should then be expressed as the same day count.

    // t - T   Time since Perihelion, usually in days

    // M  Mean Anomaly         = n * (t - T)  =  (t - T) * 360_deg / P
    //    Mean Anomaly is 0 at perihelion and 180 degrees at aphelion

    // L  Mean Longitude       = M + w + N

    // E  Eccentric anomaly, defined by Kepler's equation:   M = E - e * sin(E)
    //    An auxiliary angle to compute the position in an elliptic orbit

    // v  True anomaly: the angle from perihelion to the planet, as seen
    //    from the Sun

    // r  Heliocentric distance: the planet's distance from the Sun.

    // x,y,z  Rectangular coordinates. Used e.g. when a heliocentric
    //        position (seen from the Sun) should be converted to a
    //        corresponding geocentric position (seen from the Earth).

    var d = jDate - jd.J2000;

    var w = 282.9404 + 4.70935E-5 * d; // longitude of perihelion
    // var a = 1.000000; // mean distance, a.u.
    var e = 0.016709 - 1.151E-9 * d; // eccentricity
    var M = math.rev(356.0470 + 0.9856002585 * d); // mean anomaly

    var oblecl = astro.J2000_OBLIQUITY - 3.563E-7 * d; // obliquity of the ecliptic

    // var L = math.rev(w + M); // Sun's mean longitude

    var E = M + math.DEGREES * e * Math.sin(M * math.RADIANS) * (1 + e * Math.cos(M * math.RADIANS)); // eccentric anomaly

    // Sun rectangular coordiantes, where the X axis points towards the perihelion
    var x = Math.cos(E * math.RADIANS) - e;
    var y = Math.sin(E * math.RADIANS) * Math.sqrt(1 - e * e);

    var r = Math.sqrt(x * x + y * y); // distance
    var v = Math.atan2(y, x) * math.DEGREES; // true anomaly

    var lon = math.rev(v + w); // longitude of the Sun

    // the Sun's ecliptic rectangular coordinates
    x = r * Math.cos(lon * math.RADIANS);
    y = r * Math.sin(lon * math.RADIANS);

    // We use oblecl, and rotate these coordinates
    var xequat = x;
    var yequat = y * Math.cos(oblecl * math.RADIANS);
    var zequat = y * Math.sin(oblecl * math.RADIANS);

    var theta = math.TWO_PI * (d * 24.0 / 23.9344694 - 259.853 / 360.0); // Siderial spin time

    return Quat.yRotation(-theta).mulVec3(new Vec3(-yequat * astro.AU_TO_METERS,
        zequat * astro.AU_TO_METERS, -xequat * astro.AU_TO_METERS));

    // Convert to RA and Decl
    // var RA = Math.atan2(yequat, xequat) * math.DEGREES;
    // var Decl = Math.atan2(zequat, Math.sqrt(xequat * xequat + yequat * yequat)) * math.DEGREES;
};
