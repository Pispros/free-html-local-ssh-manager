const prompt = require("prompt-sync")({ sigint: true });
const crypto = require('crypto');
const fs = require('fs');
const customPasswordYouCanEdit = "your_password_here"; // you can edit or not

const newServerName = prompt("What's your server name ? ");
const newIp = prompt("Enter VPS Ip ? ");
const newUser = prompt("Enter VPS User ? ");
const newPassword = prompt("Enter VPS Password ? ");
const newSalt = prompt("Enter your magic salt. Attention you need this to recover this VPS password ? ")

fs.readFile('assets/json/content.json', 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading the file:', err);
      return;
    }
    const parsedData = JSON.parse(data);
    const newData = [...parsedData, {
        server: newServerName,
        ip: newIp,
        user: newUser,
        pwd: encrypt(String(newPassword), customPasswordYouCanEdit, String(newSalt))
    }]

    fs.writeFile('assets/json/content.json', JSON.stringify(newData), 'utf8', (err) => {
        if (err) {
          console.error('Error writing to the file:', err);
          return;
        }
      
        console.log('server list has been updated successfully!');
        console.log('Reload your browser page!');
    });
});

// Simple Encryption section
// Function to generate a random initialization vector (IV)
function generateRandomIV() {
  return crypto.randomBytes(16);
}

// Function to encrypt a string
function encrypt(text, password, salt) {
  const iv = generateRandomIV();
  const key = crypto.pbkdf2Sync(password, salt, 10000, 32, 'sha256');
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text, 'utf-8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

// Function to decrypt an encrypted string
function decrypt(encryptedText, password, salt) {
  const [iv, encrypted] = encryptedText.split(':').map((part) => Buffer.from(part, 'hex'));
  const key = crypto.pbkdf2Sync(password, salt, 10000, 32, 'sha256');
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf-8');
  decrypted += decipher.final('utf-8');
  return decrypted;
}
