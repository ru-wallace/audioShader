#version 300 es

uniform float u_thickness;
uniform mat4 u_modelMatrix;
uniform mat4 u_viewMatrix;
uniform mat4 u_projectionMatrix;

in vec4 a_position;
in vec2 a_normal;
in float a_miter;


void main() {
    vec2 p = a_position.xy + vec2(a_normal * u_thickness/2.0 * a_miter);
    vec4 pos = u_projectionMatrix  * u_viewMatrix * u_modelMatrix * vec4(p.x, p.y, 0.0, 1.0);
    //gl_Position = vec4(a_position.x, a_position.y, 0,0);
    gl_Position = pos;//u_projectionMatrix * u_modelMatrix * u_viewMatrix * vec4(p, 1.0, 1.0);
    gl_PointSize = 1.0;
}