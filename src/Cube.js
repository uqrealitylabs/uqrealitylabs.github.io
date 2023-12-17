// Cube.js
import React, { useEffect } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass';

const Cube = () => {
  useEffect(() => {
    // Set up Three.js scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x888888); // Set gray background

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer();

    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Create a cube with adjusted size (twice as big)
    const geometry = new THREE.BoxGeometry();
    geometry.scale(2, 2, 2); // Scale the geometry

    // Create edges with a brighter purple color and five times thicker linewidth
    const edges = new THREE.EdgesGeometry(geometry);
    const edgesMaterial = new THREE.LineBasicMaterial({ color: new THREE.Color(0xb72fb7) }); // Brighter purple color
    const edgesCube = new THREE.LineSegments(edges, edgesMaterial);
    edgesCube.material.linewidth = 10; // Adjust the linewidth to be five times thicker
    scene.add(edgesCube);

    // Create faces with individual colors and 20% opacity
    const facesMaterial = [
      new THREE.MeshBasicMaterial({ color: 0x800080, transparent: true, opacity: 0.2, side: THREE.DoubleSide }), // Purple color, translucent (Face 0)
      new THREE.MeshBasicMaterial({ color: 0x800080, transparent: true, opacity: 0.2, side: THREE.DoubleSide }), // Purple color, translucent (Face 1)
      new THREE.MeshBasicMaterial({ color: 0x800080, transparent: true, opacity: 0.2, side: THREE.DoubleSide }), // Purple color, translucent (Face 2)
      new THREE.MeshBasicMaterial({ color: 0x800080, transparent: true, opacity: 0.2, side: THREE.DoubleSide }), // Purple color, translucent (Face 3)
      new THREE.MeshBasicMaterial({ color: 0x800080, transparent: true, opacity: 0.2, side: THREE.DoubleSide }), // Purple color, translucent (Face 4)
      new THREE.MeshBasicMaterial({ color: 0x800080, transparent: true, opacity: 0.2, side: THREE.DoubleSide }), // Purple color, translucent (Face 5)
    ];
    const facesCube = new THREE.Mesh(geometry, facesMaterial);
    scene.add(facesCube);

    // Store the original color of each face
    const originalColors = facesMaterial.map((material) => material.color.clone());

    // Assign numbers to each face
    const faceNumbers = [0, 1, 2, 3, 4, 5];

    // Handle face click event
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleFaceClick = (event) => {
        // Calculate mouse position in normalized device coordinates
        const canvasBounds = renderer.domElement.getBoundingClientRect();
        const fixedPosition = {
        left: 0, // Set the left offset based on your fixed position
        top: 0, // Set the top offset based on your fixed position
        };

        
      mouse.x = ((event.clientX - canvasBounds.left - fixedPosition.left) / canvasBounds.width) * 2 - 1;
      mouse.y = -((event.clientY - canvasBounds.top - fixedPosition.top) / canvasBounds.height) * 2 + 1;

      // Raycast from the camera to the faces
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObject(facesCube);

      if (intersects.length > 0) {
        const clickedFace = intersects[0].face; // Get the face that was clicked
        const clickedIndex = clickedFace.materialIndex; // Get the material index of the clicked face

        // Log a message with the face number when a face is clicked
        console.log(`Face ${faceNumbers[clickedIndex]} clicked!`);

        // Reset the color of all faces to the original color
        facesMaterial.forEach((material, index) => {
          material.color.copy(originalColors[index]);
        });

        // Change the color of the clicked face
        facesMaterial[clickedIndex].color.set(0xff0000); // Red color
      }
    };

    // Add click event listener
    window.addEventListener('click', handleFaceClick);

    // Set up outline pass
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    const outlinePass = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), scene, camera);
    outlinePass.edgeStrength = 5; // Adjust the edge strength

    composer.addPass(renderPass);
    composer.addPass(outlinePass);

    // Position the camera
    camera.position.z = 5;

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);

      // Rotate the cube
      edgesCube.rotation.x += 0.01;
      edgesCube.rotation.y += 0.01;
      facesCube.rotation.x += 0.01;
      facesCube.rotation.y += 0.01;

      // Update the outline pass
      composer.render();

      // Render the scene
      // renderer.render(scene, camera);
    };

    animate();

    // Clean up on component unmount
    return () => {
      window.removeEventListener('click', handleFaceClick);
      document.body.removeChild(renderer.domElement);
    };
  }, []); // Empty dependency array ensures the effect runs only once

  return null; // No need to render anything in the React component
};

export default Cube;
