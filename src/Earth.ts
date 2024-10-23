/* Assignment 3: Earthquake Visualization
 * Concept and C++ implementation by Daniel Keefe and TAs, 2012+
 * GopherGfx implementation by Evan Suma Rosenberg <suma@umn.edu> 2022
 * License: Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International
 * PUBLIC DISTRIBUTION OF SOURCE CODE OUTSIDE OF CSCI 4611 IS PROHIBITED
 */

import * as gfx from 'gophergfx'
import { EarthquakeMarker } from './EarthquakeMarker';
import { EarthquakeRecord } from './EarthquakeRecord';

export class Earth extends gfx.Node3
{
    private earthMesh: gfx.MorphMesh3;

    public globeMode: boolean;

    // Rotation variables for wizard functionality
    public naturalRotation: gfx.Quaternion;
    public mouseRotation: gfx.Quaternion;

    constructor()
    {
        // Call the superclass constructor
        super();

        this.earthMesh = new gfx.MorphMesh3();

        this.globeMode = false;

        // Default natural rotation is the earth's axial tilt
        this.naturalRotation = gfx.Quaternion.makeRotationZ(-23.4 * Math.PI / 180); 
        
        this.mouseRotation = new gfx.Quaternion();
    }

    public initialize(): void
    {
         // Initialize texture: you can change to a lower-res texture here if needed
        // Note that this won't display properly until you assign texture coordinates to the mesh
        this.earthMesh.material.texture = new gfx.Texture('./assets/earth-2k.png');

        // These parameters determine the appearance in the wireframe and vertex display modes
        this.earthMesh.material.ambientColor.set(0, 1, 1);
        this.earthMesh.material.pointSize = 10;
        
        // This disables mipmapping, which makes the texture appear sharper
        this.earthMesh.material.texture.setMinFilter(true, false);   

        // Add the mesh as a child of this node
        this.add(this.earthMesh);
    }


    // The flat map and sphere meshes should both have the same resolution.
    // The assignment handout uses n = number of columns, and m = number of rows.
    // In this routine, let's assume both values are the same:
    //   n = meshResolution
    //   m = meshResolution
    public createMesh(meshResolution: number): void
    {
        // Part 1: Creating the Flat Map Mesh
        // As part of your solution, please complete the convertLatLongToPlane() method
        // that comes later in this class, and use it here to help you calculate the
        // vertex positions for the flat map mesh. 
        const mapVertices: gfx.Vector3[] = [];
        const mapNormals: gfx.Vector3[] = [];
        const indices: number[] = [];
        const texCoords: number[] = [];

        const xinc = 360 / (meshResolution - 1);
        const yinc = 180 / (meshResolution - 1);
        
        for (let i = 0; i < meshResolution; i++) {
            const latitude = -90 + (i * yinc);
            for (let j = 0; j < meshResolution; j++) {
                const longitude = -180 + (j * xinc);
                const vertex = this.convertLatLongToPlane(latitude, longitude);
                mapVertices.push(vertex);
                mapNormals.push(new gfx.Vector3(0, 0, 1)); 
                texCoords.push(j / (meshResolution - 1));
                texCoords.push(1 - (i / (meshResolution - 1)));
            }
        }

        for (let i=0; i<meshResolution - 1; i++) {
            for (let j=0; j<meshResolution - 1; j++) {
                const topLeft = ((i + 1) * meshResolution) + j;
                const topRight = ((i + 1) * meshResolution) + j + 1;
                const bottomLeft = (i * meshResolution) + j;
                const bottomRight = (i * meshResolution) + j + 1;

                indices.push(topLeft);
                indices.push(bottomLeft);
                indices.push(topRight);

                indices.push(bottomLeft);
                indices.push(bottomRight);
                indices.push(topRight);
            }
        }
       



        // This saves the data arrays to the earth mesh
        this.earthMesh.setVertices(mapVertices, true);
        this.earthMesh.setNormals(mapNormals, true);
        this.earthMesh.setIndices(indices);
        this.earthMesh.setTextureCoordinates(texCoords);


        // Part 3: Creating the Globe Mesh
        // As part of your solution, please complete the convertLatLongToSphere() method
        // that comes later in this class, and use it here to help you calculate the
        // vertex positions for the flat map mesh. 

        // If you fill in these arrays to store the globe mesh data, you can use
        // the code below to save them in the globe mesh.  Note, the indices and
        // texture coordinates will be the same for both meshes.  So, we do not
        // need to recompute those.
        const globeVertices: gfx.Vector3[] = [];
        const globeNormals: gfx.Vector3[] = [];

        for (let i = 0; i < meshResolution; i++) {
            const latitude = -90 + (i * yinc);
            for (let j = 0; j < meshResolution; j++) {
                const longitude = -180 + (j * xinc);
                const vertex = this.convertLatLongToSphere(latitude, longitude);
                globeVertices.push(vertex);
                const vertexNormal = gfx.Vector3.normalize(vertex);
                globeNormals.push(vertexNormal);
            }
        }




        // This saves the data arrays to the earth mesh
        this.earthMesh.setMorphTargetVertices(globeVertices, true);
        this.earthMesh.setMorphTargetNormals(globeNormals, true);

        // Recompute the wireframe after the mesh geometry is updated
        this.earthMesh.material.updateWireframeBuffer(this.earthMesh);
    }


    public update(deltaTime: number) : void
    {
        // Part 4: Morphing Between the Map and Globe
        // this.earthMesh is a GopherGfx MorphMesh object.  So, it already knows how to morph
        // between the two sets of vertices using lerp.  However, we need to set the current
        // state for the morph by setting the this.earthMesh.morphAlpha value.
        
        // this.earthMesh.morphAlpha should be set to 0 when in flat map mode and 1 when in 
        // globe mode.  However, to get a smooth morph, you will want to adjust the value
        // gradually based on the elapsed time.
        const currentAlpha = this.earthMesh.morphAlpha;
        if (this.globeMode) {
            // globe mode is active
            if (currentAlpha < 1) {
                this.earthMesh.morphAlpha = currentAlpha + deltaTime;
            }
        } 
        else {
            // flat map mode is active
            if (currentAlpha > 0) {
                this.earthMesh.morphAlpha = currentAlpha - deltaTime;
            }
        }

    }


    public createEarthquake(record: EarthquakeRecord)
    {
        // Part 5: Creating the Earthquake Markers
        // This shows how to create an earthquake and add it to the Earth, but you will still
        // need to set the quake's positions for the map and globe and set its color based on
        // the quake's magnitude.
        const duration = 12 * 30 * 24 * 60 * 60;  // approx number of milliseconds in 1 year
        const planePosition = this.convertLatLongToPlane(record.latitude, record.longitude);
        const spherePosition = this.convertLatLongToSphere(record.latitude, record.longitude);
        
        const red = new gfx.Vector3(1, 1, 0);
        const yellow = new gfx.Vector3(1, 0, 0);
        
        const earthquake = new EarthquakeMarker(planePosition, spherePosition, record, duration);
        
        const lerpVector = gfx.Vector3.lerp(red, yellow, earthquake.normalizedMagnitude);
        const lerpColor = new gfx.Color(lerpVector.x, lerpVector.y, lerpVector.z);
        earthquake.material.setColor(lerpColor);

        const scale = record.normalizedMagnitude + 0.2;
        earthquake.scale = new gfx.Vector3(scale, scale, scale);
        this.add(earthquake);
    }


    public animateEarthquakes(currentTime : number)
    {
        // This code removes earthquake markers after their life has expired
        this.children.forEach((quake: gfx.Node3) => {
            if (quake instanceof EarthquakeMarker) {
                const playbackLife = (quake as EarthquakeMarker).getPlaybackLife(currentTime);
                if (quake.scale instanceof gfx.Vector3) {
                    const alpha = gfx.MathUtils.clamp(playbackLife * 0.05, 0, 1);
                    const scale = gfx.Vector3.lerp(quake.scale, gfx.Vector3.ZERO, alpha);
                    quake.scale = scale;
                }
                if (playbackLife >= 1) {
                    // The earthquake has exceeded its lifespan and should be moved from the scene
                    quake.remove();
                }
                else {
                    const currentAlpha = this.earthMesh.morphAlpha;
                    // Part 6: Morphing the Earthquake Positions
                    if (this.globeMode) {
                        const globePos = gfx.Vector3.lerp(quake.mapPosition, quake.globePosition, currentAlpha);
                        quake.position = globePos;
                    } else {
                        const mapPos = gfx.Vector3.lerp(quake.mapPosition, quake.globePosition, currentAlpha);
                        quake.position = mapPos;
                    }
                }
            }
        });
    }


    // Fill in this method to convert from latitude and longitude (in degrees) to a point
    // in the flat map coordinate system.
    public convertLatLongToPlane(latitude: number, longitude: number): gfx.Vector3
    {
        const x = longitude * (Math.PI / 180);
        const y = latitude * (Math.PI / 180);

        return new gfx.Vector3(x, y, 0);
    }


    // Fill in this method to convert from latitude and longitude (in degrees) to a point
    // in the globe coordinate system.
    public convertLatLongToSphere(latitude: number, longitude: number): gfx.Vector3
    {
        const latRadians = latitude * (Math.PI / 180);
        const longRadians = longitude * (Math.PI / 180);
        const x = Math.cos(latRadians) * Math.sin(longRadians);
        const y = Math.sin(latRadians);
        const z = Math.cos(latRadians) * Math.cos(longRadians);

        return new gfx.Vector3(x, y, z);
    }


    public changeDisplayMode(displayMode : string)
    {
        if (displayMode == 'Textured') {
            this.earthMesh.material.materialMode = gfx.MorphMaterialMode.SHADED;
        }
        else if (displayMode == 'Wireframe') {
            this.earthMesh.material.materialMode = gfx.MorphMaterialMode.WIREFRAME; 
        }
        else if (displayMode == 'Vertices') {
            this.earthMesh.material.materialMode = gfx.MorphMaterialMode.VERTICES;
        }
    }
}