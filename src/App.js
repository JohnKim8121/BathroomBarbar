import * as faceLandmarksDetection from "@tensorflow-models/face-landmarks-detection";
import "@tensorflow/tfjs-backend-webgl"; // WebGL backend
import * as tf from "@tensorflow/tfjs-core"; // Core TensorFlow.js
import React, { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";

const faceShapeRecommendations = {
  Round: "hairstyles/round_face_style.png",
  Oval: "hairstyles/oval_face_style.png",
  Square: "hairstyles/square_face_style.png",
  Rectangle: "hairstyles/rectangle_face_style.png",
  Heart: "hairstyles/heart_face_style.png",
};

const FaceLandmarksApp = () => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [model, setModel] = useState(null);
  const [faceShape, setFaceShape] = useState("");
  const [recommendedStyle, setRecommendedStyle] = useState(null);

  useEffect(() => {
    const loadModel = async () => {
      await tf.setBackend("webgl"); // Switch to WebGL backend
      await tf.ready(); // Ensure backend is ready
      const detector = await faceLandmarksDetection.createDetector(
        faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
        {
          runtime: "mediapipe",
          refineLandmarks: true,
          solutionPath: `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh`,
        }
      );
      setModel(detector);
    };

    loadModel();
  }, []);

  const detectFaces = async () => {
    if (
      typeof webcamRef.current !== "undefined" &&
      webcamRef.current !== null &&
      webcamRef.current.video.readyState === 4 &&
      model !== null
    ) {
      const video = webcamRef.current.video;
      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;

      canvasRef.current.width = videoWidth;
      canvasRef.current.height = videoHeight;

      // Convert video frame to tensor (to avoid WebGL issues)
      const input = tf.browser.fromPixels(video);
      const faces = await model.estimateFaces({ input });

      if (faces.length > 0) {
        const landmarks = faces[0].scaledMesh;
        const shape = classifyFaceShape(landmarks);
        setFaceShape(shape);
        recommendHairstyle(shape);
      }
    }
  };

  const classifyFaceShape = (landmarks) => {
    const jawline = [landmarks[152], landmarks[234], landmarks[454], landmarks[10]];
    const jawWidth = distance(jawline[1], jawline[2]);
    const jawHeight = distance(jawline[0], jawline[3]);

    const ratio = jawWidth / jawHeight;
    if (ratio > 1.5) return "Round";
    if (ratio > 1.3) return "Oval";
    if (ratio > 1.1) return "Square";
    if (ratio > 0.9) return "Rectangle";
    return "Heart";
  };

  const distance = (point1, point2) => {
    return Math.sqrt(
      Math.pow(point1[0] - point2[0], 2) + Math.pow(point1[1] - point2[1], 2)
    );
  };

  const recommendHairstyle = (shape) => {
    if (faceShapeRecommendations[shape]) {
      setRecommendedStyle(faceShapeRecommendations[shape]);
    } else {
      setRecommendedStyle(null);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      detectFaces();
    }, 100);
    return () => clearInterval(interval);
  }, [model]);

  return (
    <div>
      <h1>Face Shape & Hairstyle Recommender</h1>
      <div style={{ position: "relative", width: "640px", height: "480px" }}>
        <Webcam
          ref={webcamRef}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
          }}
        />
        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
          }}
        />
        {recommendedStyle && (
          <img
            src={recommendedStyle}
            alt="Recommended Hairstyle"
            style={{
              position: "absolute",
              top: "0px",
              left: "0px",
              width: "100%",
              height: "100%",
              pointerEvents: "none",
            }}
          />
        )}
      </div>
      {faceShape && (
        <div>
          <p>
            Detected Face Shape: <strong>{faceShape}</strong>
          </p>
        </div>
      )}
    </div>
  );
};

export default FaceLandmarksApp;
