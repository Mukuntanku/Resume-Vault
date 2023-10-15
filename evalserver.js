const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

const crypto = require('crypto');
const path = require('path');

const multer = require('multer');
const { Storage } = require('@google-cloud/storage');

const app = express();

// Set up middleware to parse JSON and form data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors());

// jwt seceret key
const secretKey = 'strong_seceret_key';

// Initialize Google Cloud Storage client
const storage = new Storage({ keyFilename: 'cloudcomputing-397915-a1ee532785f2.json' });
const BucketName = 'mukuntan-new';
const bucket = storage.bucket(BucketName);

// Set up multer to handle file uploads
const upload = multer({
    storage: multer.memoryStorage()
});

// Create a MySQL connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'eval'
})

// Connect to MySQL
db.connect(function(err) {
    if (err) {
        console.error('MySQL Connection Error:', err);
        console.log("Error in Connection");
    } else {
        console.log("Database Connected Successfully!!");
    }
});

function generateEncryptionKey() {
    const buffer = crypto.randomBytes(32);
    const encodedKey = buffer.toString('base64');
    console.log(`Base 64 encoded encryption key: ${encodedKey}`);
    return encodedKey;
}

// Serve the HTML form
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/Signup.html');
});

// Serve static HTML files from a directory (assuming login.html is in the same directory as your server script)
app.use(express.static(__dirname));

// Handle the form submission
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    const sql = "SELECT * FROM users WHERE email = ?";
    
    db.query(sql, [email], (err, result) => {
        if (err) {
            console.error('MySQL query error:', err);
            res.status(500).send('Server error');
            return;
        }
        
        if (result.length === 0) {
            res.send('Invalid credentials');
        } else {
            const hashedPassword = result[0].password;

            // Verify the password using bcrypt.compare
            bcrypt.compare(password, hashedPassword, (compareErr, isMatch) => {
                if (compareErr) {
                    console.error('Error comparing passwords:', compareErr);
                    res.status(500).send('Server error');
                    return;
                }

                if (isMatch) {
                    // req.session.user = result[0];
                    const token = jwt.sign(
                        {
                          email: result[0].email,
                          firstName: result[0].firstName,
                          lastName: result[0].lastName,
                        },
                        secretKey,
                        { expiresIn: '1d' }
                    );
                    res.cookie('token', token);

                    res.send({ "status": "success", "message": "Success! You are logged in" });
                } else {
                    res.send('Invalid credentials');
                }
            });
        }
    });
});

app.post('/signup', (req, res) => {
    const { firstName, lastName, email, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
        res.status(400).send('Passwords do not match');
        return;
    }

    const checkEmailQuery = "SELECT * FROM users WHERE email = ?";
    db.query(checkEmailQuery, [email], (err, result) => {
        if (err) {
            console.error('MySQL query error:', err);
            res.status(500).send('Server error');
            return;
        }
        if (result.length > 0) {
            res.status(400).send('Email already exists');
            return;
        }

        // Hash the user's password before storing it in the database
        bcrypt.hash(password, 10, (hashErr, hash) => {
            if (hashErr) {
                console.error('Error hashing password:', hashErr);
                res.status(500).send('Server error');
                return;
            }

            const insertUserQuery = "INSERT INTO users (firstName, lastName, email, password) VALUES (?, ?, ?, ?)";
            db.query(insertUserQuery, [firstName, lastName, email, hash], (insertErr, insertResult) => {
                if (insertErr) {
                    console.error('MySQL query error:', insertErr);
                    res.status(500).send('Server error');
                    return;
                }
                res.send({ "status": "success", "message": "Success! You are registered" });
            });
        });
    });
});

const verifyUser = (req, res, next) => {
    const token = req.cookies.token;
    if(!token) {
        return res.json({Error: "You are not Authenticated"});
    } else {
        jwt.verify(token, secretKey, (err, decoded) => {
            if(err) return res.json({Error: "Invalid wrong"});
            req.email = decoded.email;
            req.firstName = decoded.firstName;
            req.lastName = decoded.lastName;
            next();
        } )
    }
}

app.post('/upload', verifyUser, upload.single('resumeFile'), async (req, res) => {
    // Get the uploaded file from req.file
    const uploadedFile = req.file;
    if (!uploadedFile) {
        return res.status(400).send('No file uploaded.');
    }

    const userEmail = req.email.split('@')[0];
    const fileFormat = path.extname(uploadedFile.originalname);
    const originalname = req.body.resumeName;
    const destFileName = req.body.resumeName + '_' + userEmail + fileFormat;

    const [files] = await bucket.getFiles();
    const userFiles = files.filter(file => file.name.includes(userEmail));
    let fileExists = false;
    userFiles.forEach(file => {
        if (file.name.split('_')[0] === originalname) {
            fileExists = true;
        }
    });

    if (fileExists) {
        return res.status(400).send('File already exists.');
    }

    try {
        const blob = bucket.file(destFileName);
        const blobStream = blob.createWriteStream();
    
        blobStream.on('error', (err) => {
            console.error('Error:', err);
            res.status(500).send('Failed to upload file.');
        });
    
        blobStream.on('finish', () => {
            console.error('Success uploading file to Google Cloud Storage');
            res.status(200).send('File uploaded successfully.');
        });
    
        blobStream.end(req.file.buffer);
    } catch (err) {
        console.error('Error uploading file to Google Cloud Storage:', err);
        res.status(500).send('Server error.');
    }    
});

app.get('/getUserDetails', verifyUser, (req, res) => {
    data = {
        email: req.email,
        firstName: req.firstName,
        lastName: req.lastName
    }
    console.log(data);
    res.json({ status: 'success', user: data });
});

app.get('/listFiles', verifyUser, async (req, res) => {
    const userEmail = req.email.split('@')[0];
    const [files] = await bucket.getFiles();

    const userFiles = files.filter(file => file.name.includes(userEmail));
    const fileData = userFiles.map(file => ({
        name: file.name,
        publicLink: file.publicUrl(),
    }));
    res.json({ status: 'success', files: fileData });
});

async function deleteFile(fileName) {
    await bucket.file(fileName).delete();
    console.log(`gs://${BucketName}/${fileName} deleted`);
}

app.delete('/deleteFile', (req, res) => {
    const { fileName } = req.body;

    deleteFile(fileName)
        .then(() => {
            res.json({ status: 'success', message: 'File deleted successfully' });
        })
        .catch(error => {
            console.error('Error deleting file:', error);
            res.status(500).json({ status: 'error', message: 'Failed to delete the file' });
        });
});

app.get('/logout', (req, res) => {
    // Clear the user's token to log them out
    res.clearCookie('token');
    res.redirect('/');
});

const port = 8081;
app.listen(port, async () => {
    console.log(`Server is running on port ${port}`);
    
    const [exists] = await storage.bucket(BucketName).exists();

    if (exists) {
      console.log(`Bucket ${BucketName} already exists.`);
    } else {
      await storage.createBucket(BucketName);

      await new Promise((resolve) => setTimeout(resolve, 5000));
      try {
        const bucket = storage.bucket(BucketName);
        await bucket.makePublic();
        console.log(`Bucket ${bucket.name} create and is now publicly readable.`);
      } catch (err) {
        console.error('Error setting bucket ACL:', err);
      }
    }
});
