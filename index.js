function ext(url) {
  return url.match(/\.\w+$/g)[0];
}



function makeAssetLoader() {
  let assets = {};
  return async function (url) {
    let asset = assets[url];
    if (asset) {
      return url;
    } else {
      let extension = ext(url);
      if ([".vert", ".frag"].includes(extension)) {
        return (await (await fetch(url)).text());
      }
    }
  }
}

let loadAsset = makeAssetLoader();



function createKeyHandler() {
  let keys = {
    singleTick: {}
  };
  document.addEventListener("keydown", function (e) {
    keys[e.key.toLowerCase()] = true;
    keys.singleTick[e.key.toLowerCase()] = true;
  });
  document.addEventListener("keyup", function (e) {
    keys[e.key.toLowerCase()] = false;
    keys.singleTick[e.key.toLowerCase()] = false;
  });
  return keys;
}



async function main() {

  const VERTEX_SHADER = await loadAsset("./shaders/vertex.vert");
  const FRAGMENT_SHADER = await loadAsset("./shaders/raymarcher.frag");
  
  let c = document.getElementById("canvas");
  let gl = c.getContext("webgl2");

  const sceneDataBuffer = gl.createBuffer();
  gl.bindBufferBase(gl.UNIFORM_BUFFER, 0, sceneDataBuffer);

  let sceneData = new Float32Array(4096);
  for (let i = 0; i < 20; i++) {
    sceneData[i*4] = (Math.random() - 0.5) * 4;
    sceneData[i*4+1] = (Math.random() - 0.5) * 4;
    sceneData[i*4+2] = (Math.random() - 0.5) * 4;
  }
  let randDirs = [];
  for (let i = 0; i < 60; i++) {
    randDirs.push((Math.random() - 0.5) * 0.1);
  }

  gl.bufferData(gl.UNIFORM_BUFFER, sceneData, gl.STREAM_DRAW);





  
  c.requestPointerLock = c.requestPointerLock ||
  c.mozRequestPointerLock;
  document.exitPointerLock = document.exitPointerLock ||
  document.mozExitPointerLock;

  c.onclick = function () {
    c.requestPointerLock();
  }

  var pointerLockEnabled = false;

  document.addEventListener('pointerlockchange', pointerLockHandler, false);
  document.addEventListener('mozpointerlockchange', pointerLockHandler, false);

  function pointerLockHandler(e) {
    pointerLockEnabled = document.pointerLockElement === c ||
    document.mozPointerLockElement === c;
  }




  let player = {
    position: [1, 1, 1],
    velocity: [0, 0, 1],
    rotation: [0, 1, 0, 0]
  };




    
  let mousePos = { x: 0, y: 0 };
  let smoothMousePos = { x: 0, y: 0 };
  document.addEventListener("mousemove", e => {
    mousePos = {
      x: e.clientX,
      y: e.clientY
    };
    let xRotation = quatAngleAxis(e.movementX * -0.01, vectorQuaternionMultiply(player.rotation, [0, 1, 0]));
    let yRotation = quatAngleAxis(e.movementY * -0.01, vectorQuaternionMultiply(player.rotation, [1, 0, 0]));

    //let rotations = scalarMultiply(player.rotation, rmSettings.values.cameraSmoothness);

    player.rotation = quatMultiply(xRotation, player.rotation);
    player.rotation = quatMultiply(yRotation, player.rotation);
    player.rotation = normalize(player.rotation);
  });



  let keyboard = createKeyHandler();

  window.addEventListener("resize", e => {
    c.width = window.innerWidth/2;
    c.height = window.innerHeight/2;
    gl.viewport(0, 0, c.width, c.height);
  });
  window.dispatchEvent(new Event("resize"));

  let shaderProgram = buildShaderProgram(
      gl,
      VERTEX_SHADER,
      FRAGMENT_SHADER
  );

  let fullscreenQuadBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, fullscreenQuadBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, FULLSCREEN_QUAD, gl.STATIC_DRAW);

  gl.useProgram(shaderProgram);

  let vertexPositionAttribLocation = gl.getAttribLocation(
      shaderProgram,
      "vertexPosition"
  );


  gl.enableVertexAttribArray(vertexPositionAttribLocation);
  gl.vertexAttribPointer(
      vertexPositionAttribLocation,
      2,
      gl.FLOAT,
      false,
      8,
      0
  );

let t = 0;
  
  loop = () => {
    t++;

    for (let i = 0; i < 20; i++) {
      sceneData[i*4] += randDirs[i*3];
      sceneData[i*4+1] += randDirs[i*3+1];
      sceneData[i*4+2] += randDirs[i*3+2];
      for (let j = 0; j < 3; j++) {
        while (sceneData[i*4+j]>2) { 
          sceneData[i*4+j] -= 4;
        }
        while (sceneData[i*4+j]<-2) {
          sceneData[i*4+j] += 4;
        }
      }
    }
    player.position = player.position.map(v => {
      let outV = v;
      while (outV>2) { 
        outV -= 4;
      }
      while (outV<-2) {
        outV += 4;
      }
      return outV;
    });
    gl.bufferData(gl.UNIFORM_BUFFER, sceneData, gl.STREAM_DRAW);

    const cameraAccel = 0.003;
    const playerSmoothness = 0.9;

    var acceleration = [0, 0, 0];
            
    //let xRotation = quatAngleAxis(player.rotation[0] * -cameraAccel, vectorQuaternionMultiply(player.quatRotation, [0, 0, 1]));
    //let yRotation = quatAngleAxis(player.rotation[1] * -cameraAccel, vectorQuaternionMultiply(player.quatRotation, [1, 0, 0]));

    //player.rotation = scalarMultiply(player.rotation, 0.5);

    //player.quatRotation = quatMultiply(xRotation, player.quatRotation);
    //player.quatRotation = quatMultiply(yRotation, player.quatRotation);
    //player.quatRotation = normalize(player.quatRotation);

    if (keyboard.s) {
        acceleration[2] += 0.01;
    }
    if (keyboard.a) {
        acceleration[0] += -0.01;
    }
    if (keyboard.w) {
        acceleration[2] += -0.01;
    }
    if (keyboard.d) {
        acceleration[0] += 0.01;
    }
    if (keyboard.shift) {
        acceleration[1] += -0.01;
    }
    if (keyboard[" "]) {
        acceleration[1] += 0.01;
    }

    acceleration = acceleration.map(e => { return e * 1.1; });

    acceleration = vectorQuaternionMultiply(player.rotation, acceleration);
    player.velocity = player.velocity.map((e, i) => { return e + acceleration[i]; });
    player.position = player.position.map((e, i) => { return e + player.velocity[i]; });
    player.velocity = player.velocity.map(e => { return e * playerSmoothness; });


    //let p = [Math.cos(t / 100) * 0.13 + 0.5, Math.sin(t / 100) * 0.13 - 0.5]
        smoothMousePos = {
          x: smoothMousePos.x + (mousePos.x - smoothMousePos.x) * 0.06,
          y: smoothMousePos.y + (mousePos.y - smoothMousePos.y) * 0.06,
        };
    let p = [
      smoothMousePos.x / c.width * 1.0 + -0.0,
      -smoothMousePos.y / c.height * 1.0 + -0.0
    ];
    // setUniform(gl, shaderProgram, "p", "2fv", p);
    setUniform(gl, shaderProgram, "aspect", "1f", c.height / c.width);
    setUniform(gl, shaderProgram, "fov", "1f", 6);

    setUniform(gl, shaderProgram, "raymarchingSteps", "1i", 32);
    setUniform(gl, shaderProgram, "normalRaymarchingSteps", "1i", 4);
    setUniform(gl, shaderProgram, "normalDelta", "1f", 0.001);

    setUniform(gl, shaderProgram, "position", "3fv", player.position);
    setUniform(gl, shaderProgram, "rotation", "4fv", player.rotation);

    setUniform(gl, shaderProgram, "sphereCount", "1i", 10);


    
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    requestAnimationFrame(loop);
  }
  loop();
}
main();