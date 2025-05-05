// setup-face-models.mjs
import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the models to download
const models = [
  {
    name: 'ssd_mobilenetv1_model',
    files: [
      'weights_manifest.json',
      'shard1'
    ]
  },
  {
    name: 'face_landmark_68_model',
    files: [
      'weights_manifest.json',
      'shard1'
    ]
  },
  {
    name: 'face_recognition_model',
    files: [
      'weights_manifest.json',
      'shard1',
      'shard2'
    ]
  }
];

// Ensure the models directory exists
const modelsDir = path.join(__dirname, 'models');
if (!fs.existsSync(modelsDir)) {
  fs.mkdirSync(modelsDir, { recursive: true });
  console.log('Created models directory at:', modelsDir);
}

// Download a file
function downloadFile(url, destination) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destination);
    
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log(`Downloaded: ${destination}`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(destination, () => {}); // Delete the file if there was an error
      reject(err);
    });
  });
}

// Download all model files
async function downloadModels() {
  const baseUrl = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';
  
  for (const model of models) {
    for (const file of model.files) {
      const filename = file === 'weights_manifest.json' 
        ? `${model.name}-${file}`
        : `${model.name}-${file}`;
      
      const fileUrl = `${baseUrl}/${filename}`;
      const destination = path.join(modelsDir, filename);
      
      try {
        await downloadFile(fileUrl, destination);
      } catch (error) {
        console.error(`Error downloading ${fileUrl}:`, error);
      }
    }
  }
  
  console.log('All model files have been downloaded!');
}

downloadModels().catch(console.error);