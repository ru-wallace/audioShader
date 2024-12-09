#version 300 es

uniform float u_thickness;
uniform float u_polar;
uniform float u_aspect;
uniform mat4 u_modelMatrix;
uniform mat4 u_viewMatrix;
uniform mat4 u_projectionMatrix;
uniform float u_mouseIn;
uniform vec2 u_mouseCoords;
uniform float u_mouseMagnitude;
uniform float u_mouseArea;


in vec4 a_position;
in vec2 a_normal;
in float a_miter;

out vec2 v_pos;
out float nearMouse;


void main() {

    float polar = u_polar;

    vec2 position_xy = a_position.xy;
    
    float r = (position_xy.y+1.0)/2.0 + 0.2*(1.0-((position_xy.x+1.0)/2.0));
    float theta = position_xy.x * (8.0*3.14159) + 3.14159/2.0;


    position_xy.x = r * cos(theta);
    position_xy.y = r * sin(theta) * u_aspect;
    
    vec2 p = a_position.xy + vec2(a_normal * (u_thickness/2.0) * a_miter);

    float z = 0.0;

    v_pos = vec2((a_position.x+1.0)/2.0, (a_position.y+1.0)/2.0);

    nearMouse = 0.0;
    if (polar != 0.0) {
        p = position_xy + vec2(a_normal * u_thickness/2.0 * a_miter);
        z = 0.5 + 0.8 * (a_position.y+1.0)/2.0;

    }
    

    vec4 pos = u_projectionMatrix  * u_viewMatrix * u_modelMatrix * vec4(p.x, p.y, z, 1.0);
    vec4 mouseCoords4 = u_projectionMatrix  * u_viewMatrix * u_modelMatrix * vec4(u_mouseCoords.x, u_mouseCoords.y, 0.0, 1.0);

    if (u_mouseIn == 1.0 && polar != 0.0) {
    
        //vec2 mouseCoords = normalize(u_mouseCoords);
        //vec2 mouseCoords = normalize(u_mouseCoords);
        vec2 mouseCoords = mouseCoords4.xy;
        float dist = distance(pos.xy, mouseCoords);

        float distFunc = (u_mouseArea - dist);
        if (distFunc < 0.0) {
            distFunc = 0.0;
        } else {
            nearMouse = 1.0;
        }


        distFunc = distFunc*10.0;
        distFunc = distFunc*distFunc;
        
        vec2 dir = pos.xy - mouseCoords;
        pos.xy = pos.xy + dir * -0.1 * distFunc*u_mouseMagnitude;

    }   

    
    //gl_Position = vec4(a_position.x, a_position.y, 0,0);
    gl_Position = pos;//u_projectionMatrix * u_modelMatrix * u_viewMatrix * vec4(p, 1.0, 1.0);
    gl_PointSize = 1.0;
}