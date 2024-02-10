// Cube.js
import { useEffect } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { OutlinePass } from "three/examples/jsm/postprocessing/OutlinePass";
import logo from "../images/logo-solid.png";
// import { click } from '@testing-library/user-event/dist/click';

export default function Cube() {
  useEffect(() => {
    // Set up Three.js scene
    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true });

    renderer.setSize(window.innerWidth, window.innerHeight);

    // create DOM elements
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '10%';
    document.body.appendChild(container);
    container.appendChild(renderer.domElement);

    // Create a cube with adjusted size (twice as big)
    const geometry = new THREE.BoxGeometry();
    geometry.scale(2, 2, 2); // Scale the geometry

    const edgesCube = textureEdges(geometry);
    scene.add(edgesCube);

    const facesMaterial = textureFaces();
    const facesCube = new THREE.Mesh(geometry, facesMaterial.flat());
    scene.add(facesCube);

    var isDragging = false;
    var autoRotate = true;
    var previousMousePosition = {
      x: 0,
      y: 0
    }

    const handleMouseDown = (event) => {
      isDragging = true;
      previousMousePosition = {
        x: event.clientX,
        y: event.clientY
      };
    };

    const handleMouseMove = (event) => {
      if (!isDragging) return;

      const deltaMove = {
        x: event.clientX - previousMousePosition.x,
        y: event.clientY - previousMousePosition.y
      };

      // Rotate the cube based on mouse movement
      facesCube.rotation.x += deltaMove.y * 0.01;
      facesCube.rotation.y += deltaMove.x * 0.01;

      // Rotate the cube based on mouse movement
      edgesCube.rotation.x += deltaMove.y * 0.01;
      edgesCube.rotation.y += deltaMove.x * 0.01;

      previousMousePosition = {
        x: event.clientX,
        y: event.clientY
      };
    };

    const handleMouseUp = () => {
      isDragging = false;
    };


    const handleFaceMouseover = (event) => {
      const face = identifyFace(renderer, event, camera, facesCube);

      // Reset the color of all faces to the original color
      facesMaterial.forEach((material, index) => {
        material.opacity = 0.2;
      });

      // Change the color of the clicked face
      if (face != null) {
        facesMaterial[face].opacity = 0.7;
        document.body.style.cursor = "pointer";
      } else {
        document.body.style.cursor = "default";
      }
    };

    const handleFaceClick = (event) => {
      if (isDragging) return;
      const face = identifyFace(renderer, event, camera, facesCube)
      switch (face) {
        case 4:
          break;
        case 0:
          window.location.pathname = "/about";
          break;
        case 1:
          window.location.pathname = "/events";
          break;
        case 2:
          window.location.pathname = "/news";
          break;
        case 3:
          window.location.pathname = "/resources";
          break;
        case 5:
          window.location.pathname = "/join";
          break;
        default:
          break;
      }
    };

    // Add mouse event listeners
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    // Add click event listener
    window.addEventListener("mousemove", handleFaceMouseover);
    window.addEventListener("click", handleFaceClick);

    // Set up outline pass
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    const outlinePass = new OutlinePass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      scene,
      camera
    );
    outlinePass.edgeStrength = 5; // Adjust the edge strength

    composer.addPass(renderPass);
    composer.addPass(outlinePass);

    // Position the camera
    camera.position.z = 5;

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      
      if (!autoRotate) {
        edgesCube.rotation.x += 0.01;
        edgesCube.rotation.y += 0.01;
        facesCube.rotation.x += 0.01;
        facesCube.rotation.y += 0.01;
      }

      // Update the outline pass
      composer.render();

      // Render the scene
      // renderer.render(scene, camera);
    };

    animate();

    // Clean up on component unmount
    return () => {
      window.removeEventListener("click", handleFaceClick);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      container.removeChild(renderer.domElement);
      document.body.removeChild(container);
    };
  }, []); // Empty dependency array ensures the effect runs only once

  return null; // No need to render anything in the React component
}

function textureFaces() {
  const facesMaterial = Array.from({ length: 6 }, (_, index) => {
    if (index === 4) {
      // Use image texture for the first face, and keep others with solid colors
      const texture = new THREE.TextureLoader().load(logo);
      const textureMaterial = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 0.2,
        side: THREE.DoubleSide,
      });

      return textureMaterial;
    } else {
      const backgroundMaterial = new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.2,
        side: THREE.DoubleSide,
      });

      return backgroundMaterial;
    }
  });
  return facesMaterial;
}

function textureEdges(geometry) {
  // Create edges with a brighter purple color and five times thicker linewidth
  const edges = new THREE.EdgesGeometry(geometry);
  const edgesMaterial = new THREE.LineBasicMaterial({
    color: new THREE.Color(0x666666),
  }); // Brighter purple color
  const edgesCube = new THREE.LineSegments(edges, edgesMaterial);
  edgesCube.material.linewidth = 10; // Adjust the linewidth to be five times thicker
  return edgesCube;
}

function identifyFace(renderer, event, camera, facesCube) {
  // Handle face click event
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  const canvasBounds = renderer.domElement.getBoundingClientRect();
  const fixedPosition = {
    left: 0, // Set the left offset based on your fixed position
    top: 0, // Set the top offset based on your fixed position
  };

  mouse.x =
    ((event.clientX - canvasBounds.left - fixedPosition.left) /
      canvasBounds.width) *
    2 -
    1;
  mouse.y =
    -(
      (event.clientY - canvasBounds.top - fixedPosition.top) /
      canvasBounds.height
    ) *
    2 +
    1;

  // Raycast from the camera to the faces
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObject(facesCube);
  if (intersects.length > 0) {
    const clickedFace = intersects[0].face; // Get the face that was clicked
    console.log("Clicked on ", clickedFace.materialIndex);
    return clickedFace.materialIndex;
  }
  return null;
}