//=============================== LINEAR ALGEBRA =================================
function matMultiply(vec, mat) {
  return [
      vec[0] * mat[0] + vec[1] * mat[3] + vec[2] * mat[6],
      vec[0] * mat[1] + vec[1] * mat[4] + vec[2] * mat[7],
      vec[0] * mat[2] + vec[1] * mat[5] + vec[2] * mat[8]
  ];
}

function matMultiplyMat(mat1, mat2) {
  return [
      dotProduct([mat1[0], mat1[1], mat1[2]], [mat2[0], mat2[3], mat2[6]]), dotProduct([mat1[0], mat1[1], mat1[2]], [mat2[1], mat2[4], mat2[7]]), dotProduct([mat1[0], mat1[1], mat1[2]], [mat2[2], mat2[5], mat2[8]]),
      dotProduct([mat1[3], mat1[4], mat1[5]], [mat2[0], mat2[3], mat2[6]]), dotProduct([mat1[3], mat1[4], mat1[5]], [mat2[1], mat2[4], mat2[7]]), dotProduct([mat1[3], mat1[4], mat1[5]], [mat2[2], mat2[5], mat2[8]]),
      dotProduct([mat1[6], mat1[7], mat1[8]], [mat2[0], mat2[3], mat2[6]]), dotProduct([mat1[6], mat1[7], mat1[8]], [mat2[1], mat2[4], mat2[7]]), dotProduct([mat1[6], mat1[7], mat1[8]], [mat2[2], mat2[5], mat2[8]]),
  ]
}

function rotateX(angle) {
  return [
      1, 0, 0,
      0, Math.cos(angle), -Math.sin(angle),
      0, Math.sin(angle), Math.cos(angle)
  ];
}

function rotateY(angle) {
  return [
      Math.cos(angle), 0, Math.sin(angle),
      0, 1, 0,
      -Math.sin(angle), 0, Math.cos(angle)
  ];
}

function rotateZ(angle) {
  return [
      Math.cos(angle), -Math.sin(angle), 0,
      Math.sin(angle), Math.cos(angle), 0,
      0, 0, 1
  ];
}

function getValue(elemID) {
  return Number(document.getElementById(elemID).value);
}

function vectorAdd(v1, v2) {
  return v1.map((e, i) => { return e + v2[i]; });
}

function dotProduct(v1, v2) {
  var sum = 0;
  for (var i = 0; v1.length > i; i++) {
      sum += v1[i] * v2[i];
  }
  return sum;
}

function crossProduct(v1, v2) {
  return [
      v1[1] * v2[2] - v1[2] * v2[1],
      v1[2] * v2[0] - v1[0] * v2[2],
      v1[0] * v2[1] - v1[1] * v2[0]
  ]
}

function norm(v) {
  return v.reduce((acc, cur) => { return acc + cur * cur }, 0);
}

function normalize(v) {
  return scalarDivide(v, Math.hypot(...v));
}

function scalarMultiply(v, s) {
  return v.map(e => { return e * s });
}

function scalarDivide(v, s) {
  return v.map(e => { return e / s });
}

function quatConjugate(q) {
  return [q[0], -q[1], -q[2], -q[3]];
}

function quatInverse(q) {
  return scalarDivide(quatConjugate(q), norm(q));
}

function quatMultiply(q1, q2) {
  var w1 = q1[0];
  var w2 = q2[0];
  var v1 = [q1[1], q1[2], q1[3]];
  var v2 = [q2[1], q2[2], q2[3]];
  return [w1 * w2 - dotProduct(v1, v2), ...vectorAdd(vectorAdd(crossProduct(v1, v2), scalarMultiply(v2, w1)), scalarMultiply(v1, w2))]
}

function quatAngleAxis(angle, axis) {
  return [Math.cos(angle / 2), ...scalarMultiply(axis, Math.sin(angle / 2))];
}

function vectorQuaternionMultiply(q, v) {
  let qi = [q[1], q[2], q[3]];
  return vectorAdd(v, crossProduct(qi, vectorAdd(crossProduct(qi, v), v.map(comp => comp * q[0]))).map(comp => comp * 2));
}

function quatToMatrix(q) {
  var w = q[0];
  var x = q[1];
  var y = q[2];
  var z = q[3];

  var w2 = w * w;
  var x2 = x * x;
  var y2 = y * y;
  var z2 = z * z;
  
  var wx = w * x;
  var wy = w * y;
  var wz = w * z;
  
  var xy = x * y;
  var xz = x * z;

  var yz = y * z;

  return [
      1 - 2 * y2 - 2 * z2, 2 * xy - 2 * wz, 2 * xz + 2 * wy,
      2 * xy + 2 * wz, 1 - 2 * x2 - 2 * z2, 2 * yz - 2 * wx,
      2 * xz - 2 * wy, 2 * yz + 2 * wx, 1 - 2 * x2 - 2 * y2
  ];
}

function matrixTranspose(m) {
  return [
      m[0], m[3], m[6],
      m[1], m[4], m[7],
      m[2], m[5], m[8]
  ];
}

function quatToEuler(q) {
  return [
      Math.atan2(2*q[2] * q[0] - 2 * q[1] * q[3], 1 - 2 * q[2] * q[2] - 2 * q[3] * q[3]),
      Math.asin(2 * q[1] * q[2] + 2 * q[3] * q[0]),
      Math.atan2(2*q[1] * q[0] - 2 * q[2] * q[3], 1 - 2 * q[1] * q[1] - 2 * q[3] * q[3])
  ]
}

//=========================================== GL UTILS ======================================

function compileShader(gl, shaderCode, type) {
  var shader = gl.createShader(type);

  gl.shaderSource(shader, shaderCode);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.log(`Error compiling ${type === gl.VERTEX_SHADER ? "vertex" : "fragment"} shader:`);
      console.log(gl.getShaderInfoLog(shader));
  }
  return shader;
}

//Builds the shader program.
function buildShaderProgram(gl, vert, frag) {

  var shaderProgram = gl.createProgram();

  gl.attachShader(shaderProgram, compileShader(gl, vert, gl.VERTEX_SHADER));

  gl.attachShader(shaderProgram, compileShader(gl, frag, gl.FRAGMENT_SHADER));

  gl.linkProgram(shaderProgram);

  return shaderProgram;
}


function setUniform(
gl,
program,
uniformName,
uniformType,
uniformValue
) {
gl["uniform" + uniformType](
  gl.getUniformLocation(program, uniformName),
  uniformValue
);
}

const FULLSCREEN_QUAD = new Float32Array([
  -1, 1, 1, 1, 1, -1, -1, 1, 1, -1, -1, -1,
]);
