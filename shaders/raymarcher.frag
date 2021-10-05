#version 300 es

precision highp float;

in vec2 texCoord;
out vec4 fragColor;

uniform int normalRaymarchingSteps;
uniform int raymarchingSteps;
uniform float normalDelta;

uniform float fov;
uniform float aspect;

uniform vec3 position;

uniform vec4 rotation;

const float universeSize = 4.0;
uniform int sphereCount;

struct SceneObject {
  vec3 position;
  uint type;
};

layout(std140) uniform SceneData {
  SceneObject sceneObjects[1024];
};

vec3 rotateQuat(vec3 position, vec4 q)
{ 
  vec3 v = position.xyz;
  return v + 2.0 * cross(q.yzw, cross(q.yzw, v) + q.x * v);
}

vec4 quatAngleAxis(float angle, vec3 axis) {
    return vec4(cos(angle), axis * sin(angle));
}

vec4 quatInverse(vec4 q) {
    vec4 conj;
    conj.yzwx = vec4(-q.yzw, q.x);
    return conj / dot(q, q);
}



float cubeSDF(vec3 position, vec3 cubePosition, float cubeSize) {
  vec3 d = abs(position - cubePosition) - vec3(cubeSize);
  return min(max(d.x,max(d.y,d.z)),0.0) + length(max(d,0.0));

}

float sphereSDF(vec3 position, vec3 spherePosition, float sphereSize) {
  return length(position - spherePosition) - sphereSize;
}



float signedDistanceFunction(vec3 position) {
  vec3 d = mod(position + universeSize/2.0, universeSize) - universeSize/2.0;
  float dist = 999999.9;
  vec3 offset;
  vec3 offset2 = vec3(
    (d.x > 0.0) ? universeSize : 0.0,
    (d.y > 0.0) ? universeSize : 0.0,
    (d.z > 0.0) ? universeSize : 0.0
  );
  for (offset.x = -universeSize; offset.x < 1.0 * universeSize; offset.x += universeSize) {
    for (offset.y = -universeSize; offset.y < 1.0 * universeSize; offset.y += universeSize) {
      for (offset.z = -universeSize; offset.z < 1.0 * universeSize; offset.z += universeSize) {
        for (int i = 0; i < sphereCount; i++) {
          dist = min(dist, sphereSDF(d - offset - offset2, sceneObjects[i].position, 0.25));
        }
      }
    }
  }
  return dist;
}

vec3 marchRay(vec3 start, vec3 direction, int iterations, float thresholdFactor, out int iterationsTilHit, out float totalDistanceTraveled) {
  vec3 rayPos = start;
  totalDistanceTraveled = 0.0;
  iterationsTilHit = iterations;
  for (int i = 0; i < iterations; i++) {
    float signedDistance = signedDistanceFunction(rayPos);
    totalDistanceTraveled += signedDistance;
    rayPos += direction * signedDistance;
    if (signedDistance < thresholdFactor * totalDistanceTraveled) {
      iterationsTilHit = i;
      break;
    }
  }
  return rayPos;
}

vec3 getNormal(vec3 position, vec3 direction) {
  vec3 dirNormal1 = normalize(cross(direction, vec3(1.0)));
  vec3 dirNormal2 = normalize(cross(direction, dirNormal1));
  int iterationsTilHit;
  float totalDistanceTraveled;
  vec3 pos1 = marchRay(position + dirNormal1 * normalDelta, direction, normalRaymarchingSteps, 0.001, iterationsTilHit, totalDistanceTraveled);
  vec3 pos2 = marchRay(position + dirNormal2 * normalDelta, direction, normalRaymarchingSteps, 0.001, iterationsTilHit, totalDistanceTraveled);
  return -normalize(cross(position - pos1, position - pos2));
}

void main() {
  vec3 direction = rotateQuat(normalize(vec3((texCoord - 0.5) * fov * vec2(1.0, aspect), -1.0)), rotation);
  int iterationsTilHit;
  float totalDistanceTraveled;
  vec3 endPos = marchRay(position, direction, raymarchingSteps, 0.0001, iterationsTilHit, totalDistanceTraveled);
  vec3 normal = getNormal(endPos, direction);
  if (iterationsTilHit == raymarchingSteps) {
    fragColor = vec4(vec3(0.0), 1.0);
  } else {
    fragColor = vec4(vec3(1.0 - float(iterationsTilHit) / float(raymarchingSteps) * 1.0) * (0.5 + 0.5 * dot(normal, vec3(1.0, 0.0, 0.0))), 1.0);
  }
  //fragColor = vec4(endPos * 0.5 + 0.5, 1.0);
}