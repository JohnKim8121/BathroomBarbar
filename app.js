const webcamElement = document.getElementById('webcam');
const canvasElement = document.getElementById('faceCanvas');
const hairstyleOverlay = document.getElementById('hairstyleOverlay');
const faceShapeOutput = document.getElementById('faceShape');

const faceShapeRecommendations = {
    Round: "hairstyles/round_face_style.png",
    Oval: "hairstyles/oval_face_style.png",
    Square: "hairstyles/square_face_style.png",
    Rectangle: "hairstyles/rectangle_face_style.png",
    Heart: "hairstyles/heart_face_style.png",
};

let model;

// Load the face landmarks detection model from TensorFlow.js
async function loadModel() {
    model = await faceLandmarksDetection.load(
        faceLandmarksDetection.SupportedPackages.mediapipeFacemesh
    );
    startWebcam();
}

// Start the webcam feed and set up face detection
async function startWebcam() {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    webcamElement.srcObject = stream;

    webcamElement.onloadedmetadata = () => {
        webcamElement.play();
        detectFaces();
    };
}

// Function to classify face shape based on landmarks
function classifyFaceShape(landmarks) {
    const jawline = [landmarks[152], landmarks[234], landmarks[454], landmarks[10]]; // Example jawline points
    const jawWidth = distance(jawline[1], jawline[2]);
    const jawHeight = distance(jawline[0], jawline[3]);

    const ratio = jawWidth / jawHeight;

    if (ratio > 1.5) return "Round";
    if (ratio > 1.3) return "Oval";
    if (ratio > 1.1) return "Square";
    if (ratio > 0.9) return "Rectangle";
    return "Heart"; // Fallback shape
}

// Function to calculate distance between two points
function distance(point1, point2) {
    return Math.sqrt(
        Math.pow(point1[0] - point2[0], 2) + Math.pow(point1[1] - point2[1], 2)
    );
}

// Function to recommend hairstyle based on detected face shape
function recommendHairstyle(shape) {
    if (faceShapeRecommendations[shape]) {
        hairstyleOverlay.src = faceShapeRecommendations[shape];
        hairstyleOverlay.style.display = "block";
    } else {
        hairstyleOverlay.style.display = "none";
    }
}

// Main function to detect faces and apply filters
async function detectFaces() {
    const videoWidth = webcamElement.videoWidth;
    const videoHeight = webcamElement.videoHeight;

    // Set canvas dimensions
    canvasElement.width = videoWidth;
    canvasElement.height = videoHeight;

    const ctx = canvasElement.getContext("2d");

    // Run face detection continuously
    setInterval(async () => {
        if (model) {
            const faces = await model.estimateFaces({ input: webcamElement });

            // Clear the canvas
            ctx.clearRect(0, 0, videoWidth, videoHeight);

            if (faces.length > 0) {
                const face = faces[0];
                const landmarks = face.scaledMesh;

                // Draw landmarks on the canvas
                landmarks.forEach(([x, y]) => {
                    ctx.beginPath();
                    ctx.arc(x, y, 2, 0, 2 * Math.PI);
                    ctx.fillStyle = "red";
                    ctx.fill();
                });

                // Classify face shape
                const shape = classifyFaceShape(landmarks);
                faceShapeOutput.textContent = shape;

                // Recommend hairstyle
                recommendHairstyle(shape);
            }
        }
    }, 100); // Detect every 100ms
}

// Initialize the app
window.onload = () => {
    loadModel(); // Load face detection model
};
