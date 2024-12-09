#version 300 es

precision highp float;

in vec2 v_pos;

out vec4 outColor;

void main() {
    outColor = vec4(v_pos.x, 1.0-v_pos.x, 1.0-v_pos.y, 1.0);
}