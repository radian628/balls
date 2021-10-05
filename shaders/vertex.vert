#version 300 es

precision mediump float;

in vec2 vertexPosition;

out vec2 texCoord;

void main() {
    texCoord = vertexPosition * 0.5 + 0.5;
    gl_Position = vec4(vertexPosition, 0.0, 1.0);
}