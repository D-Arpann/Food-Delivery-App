const https = require('https');
const fs = require('fs');
const path = require('path');

const fontsDir = path.join(__dirname, 'packages', 'ui', 'assets', 'fonts');
if (!fs.existsSync(fontsDir)){
    fs.mkdirSync(fontsDir, { recursive: true });
}

const fontUrls = {
  'Outfit-Regular.ttf': 'https://raw.githubusercontent.com/expo/google-fonts/master/font-packages/outfit/Outfit_400Regular.ttf',
  'Outfit-Medium.ttf': 'https://raw.githubusercontent.com/expo/google-fonts/master/font-packages/outfit/Outfit_500Medium.ttf',
  'Outfit-SemiBold.ttf': 'https://raw.githubusercontent.com/expo/google-fonts/master/font-packages/outfit/Outfit_600SemiBold.ttf',
  'Outfit-Bold.ttf': 'https://raw.githubusercontent.com/expo/google-fonts/master/font-packages/outfit/Outfit_700Bold.ttf'
};

Object.entries(fontUrls).forEach(([filename, url]) => {
  https.get(url, (res) => {
    if (res.statusCode === 200) {
      const file = fs.createWriteStream(path.join(fontsDir, filename));
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log('Downloaded', filename);
      });
    } else {
      console.log('Failed to download', filename, res.statusCode);
    }
  }).on('error', (err) => {
    console.error('Error downloading', filename, err.message);
  });
});
