#version 300 es

uniform float u_thickness;
uniform float u_polar;
uniform float u_aspect;
uniform mat4 u_modelMatrix;
uniform mat4 u_viewMatrix;
uniform mat4 u_projectionMatrix;


in vec4 a_position;
in vec2 a_normal;
in float a_miter;

out vec2 v_pos;


void main() {

    float polar = u_polar;

    vec2 position_xy = a_position.xy;
    
    float r = (position_xy.y+1.0)/2.0 + 0.2*(1.0-((position_xy.x+1.0)/2.0));
    float theta = position_xy.x * (8.0*3.14159) + 3.14159/2.0;


    position_xy.x = r * cos(theta);
    position_xy.y = r * sin(theta) * u_aspect;
    
    vec2 p = position_xy + vec2(a_normal * u_thickness/2.0 * a_miter);
    if (polar == 0.0) {
    p = a_position.xy + vec2(a_normal * u_thickness/2.0 * a_miter);
    }
    vec4 pos = u_projectionMatrix  * u_viewMatrix * u_modelMatrix * vec4(p.x, p.y, 0.0, 1.0);

    v_pos = a_position.xy;
    //gl_Position = vec4(a_position.x, a_position.y, 0,0);
    gl_Position = pos;//u_projectionMatrix * u_modelMatrix * u_viewMatrix * vec4(p, 1.0, 1.0);
    gl_PointSize = 1.0;
}