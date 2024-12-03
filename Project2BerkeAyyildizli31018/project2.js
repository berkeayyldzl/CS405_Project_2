/**
 * @Instructions
 * 		@task1 : Complete the setTexture function to handle non power of 2 sized textures
 * 		@task2 : Implement the lighting by modifying the fragment shader, constructor,
 *      @task3: 
 *      @task4: 
 * 		setMesh, draw, setAmbientLight, setSpecularLight and enableLighting functions 
 */

// Berke Ayyildizli 31018 - CS405 Project 2 - 03.12.2024

function GetModelViewProjection(projectionMatrix, translationX, translationY, translationZ, rotationX, rotationY) {
	
	var trans1 = [
		1, 0, 0, 0,
		0, 1, 0, 0,
		0, 0, 1, 0,
		translationX, translationY, translationZ, 1
	];
	var rotatXCos = Math.cos(rotationX);
	var rotatXSin = Math.sin(rotationX);

	var rotatYCos = Math.cos(rotationY);
	var rotatYSin = Math.sin(rotationY);

	var rotatx = [
		1, 0, 0, 0,
		0, rotatXCos, -rotatXSin, 0,
		0, rotatXSin, rotatXCos, 0,
		0, 0, 0, 1
	]

	var rotaty = [
		rotatYCos, 0, -rotatYSin, 0,
		0, 1, 0, 0,
		rotatYSin, 0, rotatYCos, 0,
		0, 0, 0, 1
	]

	var test1 = MatrixMult(rotaty, rotatx);
	var test2 = MatrixMult(trans1, test1);
	var mvp = MatrixMult(projectionMatrix, test2);

	return mvp;
}


class MeshDrawer {
	// The constructor is a good place for taking care of the necessary initializations.
	constructor() {
		this.prog = InitShaderProgram(meshVS, meshFS);
		this.mvpLoc = gl.getUniformLocation(this.prog, 'mvp');
		this.showTexLoc = gl.getUniformLocation(this.prog, 'showTex');

		this.colorLoc = gl.getUniformLocation(this.prog, 'color');

		this.vertPosLoc = gl.getAttribLocation(this.prog, 'pos');
		this.texCoordLoc = gl.getAttribLocation(this.prog, 'texCoord');


		this.vertbuffer = gl.createBuffer();
		this.texbuffer = gl.createBuffer();

		this.numTriangles = 0;

		/**
		 * @Task2 : You should initialize the required variables for lighting here
		 */

		this.normalLoc = gl.getAttribLocation(this.prog, 'normal');
		this.normalBuffer = gl.createBuffer(); //i created a buffer for normal

		this.enableLightingLoc = gl.getUniformLocation(this.prog, 'enableLighting');
		this.lightPosLoc = gl.getUniformLocation(this.prog, 'lightPos');
		this.ambientLoc = gl.getUniformLocation(this.prog, 'ambient'); //this block gets the locations for the lightning
		this.enableLightingValue = false; //lightning option is closed by default
		this.ambientValue = 0.5;   

		/**
         * @Task3 : specular lightning part
         */

        this.specularIntensityLoc = gl.getUniformLocation(this.prog, 'specularIntensity');
        this.shininessLoc = gl.getUniformLocation(this.prog, 'shininess');

        this.specularIntensityValue = 0.5; //default values
        this.shininessValue = 50.0;        
		
	}

	setMesh(vertPos, texCoords, normalCoords) {
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertbuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);

		
		gl.bindBuffer(gl.ARRAY_BUFFER, this.texbuffer); // updates texture coordinates
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);

		this.numTriangles = vertPos.length / 3;

		/**
		 * @Task2 : You should update the rest of this function to handle the lighting
		 */

		gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
   		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normalCoords), gl.STATIC_DRAW);
	}

	// This method is called to draw the triangular mesh.
	// The argument is the transformation matrix, the same matrix returned
	// by the GetModelViewProjection function above.
	draw(trans) {
		gl.useProgram(this.prog);

		gl.uniformMatrix4fv(this.mvpLoc, false, trans);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertbuffer);
		gl.enableVertexAttribArray(this.vertPosLoc);
		gl.vertexAttribPointer(this.vertPosLoc, 3, gl.FLOAT, false, 0, 0);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.texbuffer);
		gl.enableVertexAttribArray(this.texCoordLoc);
		gl.vertexAttribPointer(this.texCoordLoc, 2, gl.FLOAT, false, 0, 0);

		/**
		 * @Task2 : You should update this function to handle the lighting
		 */
		
		gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
		gl.enableVertexAttribArray(this.normalLoc);
		gl.vertexAttribPointer(this.normalLoc, 3, gl.FLOAT, false, 0, 0);
	
		gl.uniform1i(this.enableLightingLoc, this.enableLightingValue); //lightning uniforms are set here
		gl.uniform1f(this.ambientLoc, this.ambientValue);
		gl.uniform3f(this.lightPosLoc, lightX, lightY, 1.0); //i assume the light is at(lightX, lightY, 1.0)
		gl.uniform1f(this.specularIntensityLoc, this.specularIntensityValue);
        gl.uniform1f(this.shininessLoc, this.shininessValue);

		///////////////////////////////

		updateLightPos();
		gl.drawArrays(gl.TRIANGLES, 0, this.numTriangles);


	}

	// This method is called to set the texture of the mesh.
	// The argument is an HTML IMG element containing the texture data.
	setTexture(img) {
		const texture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, texture);

		// You can set the texture image data using the following command.
		gl.texImage2D(
			gl.TEXTURE_2D,
			0,
			gl.RGB,
			gl.RGB,
			gl.UNSIGNED_BYTE,
			img);

		// Set texture parameters 
		if (isPowerOf2(img.width) && isPowerOf2(img.height)) {
			gl.generateMipmap(gl.TEXTURE_2D);
		} else {
			//console.error("Task 1: Non power of 2, you should implement this part to accept non power of 2 sized textures");
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		}

		gl.useProgram(this.prog);
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, texture);
		const sampler = gl.getUniformLocation(this.prog, 'tex');
		gl.uniform1i(sampler, 0);
	}

	showTexture(show) {
		gl.useProgram(this.prog);
		gl.uniform1i(this.showTexLoc, show);
	}

	enableLighting(show) {
		//console.error("Task 2: You should implement the lighting and implement this function ");
		/**
		 * @Task2 : You should implement the lighting and implement this function
		 */
		this.enableLightingValue = show;
	}
	
	setAmbientLight(ambient) {
		//console.error("Task 2: You should implement the lighting and implement this function ");
		/**
		 * @Task2 : You should implement the lighting and implement this function
		 */
		this.ambientValue = ambient;
	}
	setSpecularLight(intensity) {
        /**
         * @Task3 :i implemented the same methods like the top 2
         */
        this.specularIntensityValue = intensity;
    }
}


function isPowerOf2(value) {
	return (value & (value - 1)) == 0;
}

function normalize(v, dst) {
	dst = dst || new Float32Array(3);
	var length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
	// make sure we don't divide by 0.
	if (length > 0.00001) {
		dst[0] = v[0] / length;
		dst[1] = v[1] / length;
		dst[2] = v[2] / length;
	}
	return dst;
}

// Vertex shader source code
const meshVS = `
    attribute vec3 pos; 
    attribute vec2 texCoord; 
    attribute vec3 normal;

    uniform mat4 mvp; 

    varying vec2 v_texCoord; 
    varying vec3 v_normal; 
    varying vec3 v_position;

    void main()
    {
        v_texCoord = texCoord;
        v_normal = normal;
        v_position = pos;

        gl_Position = mvp * vec4(pos,1);
    }`;


// Fragment shader source code
/**
 * @Task2 : You should update the fragment shader to handle the lighting
 */
// Fragment shader source code
const meshFS = `
    precision mediump float;

    uniform bool showTex;
    uniform bool enableLighting;
    uniform sampler2D tex;
    uniform vec3 color; 
    uniform vec3 lightPos;
    uniform float ambient;
    uniform float specularIntensity;
    uniform float shininess;

    varying vec2 v_texCoord;
    varying vec3 v_normal;
    varying vec3 v_position;

    void main()
    {
        if(showTex && enableLighting){
            vec4 baseColor = texture2D(tex, v_texCoord);

            vec3 N = normalize(v_normal); //this section normalizes the vectors
            vec3 L = normalize(lightPos - v_position);
            vec3 V = normalize(-v_position); 
            vec3 ambientComponent = ambient * baseColor.rgb; //i calculated the ambient component

            float diff = max(dot(N, L), 0.0); //i calculated the diffuse component
            vec3 diffuse = diff * baseColor.rgb;

            vec3 R = reflect(-L, N); //i calculated the specular component for task 3
            float spec = pow(max(dot(R, V), 0.0), shininess);
            vec3 specular = specularIntensity * spec * vec3(1.0); 

            vec3 finalColor = ambientComponent + diffuse + specular; //i combined the components
            gl_FragColor = vec4(finalColor, baseColor.a); //color set
        }
        else if(showTex){
            gl_FragColor = texture2D(tex, v_texCoord);
        }
        else{
            gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
        }
    }`;

// Light direction parameters for Task 2
var lightX = 1;
var lightY = 1;

const keys = {};
function updateLightPos() {
	const translationSpeed = 1;
	if (keys['ArrowUp']) lightY -= translationSpeed;
	if (keys['ArrowDown']) lightY += translationSpeed;
	if (keys['ArrowRight']) lightX -= translationSpeed;
	if (keys['ArrowLeft']) lightX += translationSpeed;
}
///////////////////////////////////////////////////////////////////////////////////