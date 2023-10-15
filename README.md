# Resume Vault

Resume Vault is a web application that allows users to securely upload, manage, and access their resumes. It provides a user-friendly interface to store and organize resumes in the cloud.

## Features

- User Registration: Allows users to sign up by providing their first name, last name, email, and password.
- User Login: Registered users can log in to access their resume vault.
- Resume Upload: Users can upload their resumes with custom names.
- Resume File Types: Supported resume file types include PDF, Word (doc, docx).
- Resume Management: Users can view, download, and delete their uploaded resumes.
- User Details: Displays user details, such as their name and email, after login.
- Security: Uses JWT tokens for user authentication and bcrypt for password hashing.
- Google Cloud Storage: Stores resumes in a Google Cloud Storage bucket for secure and scalable file storage.

## Setup

1. Clone the repository to your local machine.
2. Install the required Node.js packages using `npm install`.
3. Set up a MySQL database and provide the connection details in the `db` variable in your `app.js`.
4. Create a Google Cloud Storage bucket and update the `BucketName` variable in `app.js` and keyFilename of the Storage().
5. Update the `secretKey` variable with a strong secret key for JWT in `app.js`.
6. Run the application using `npm start`.

## Usage

- Access the application by opening your web browser and navigating to the server URL.
- Register for an account or log in with your credentials.
- Upload your resumes with custom names.
- Manage your resumes, including viewing, downloading, and deleting them.

## Contributing

Welcome contributions from the community. Feel free to open issues, submit pull requests, or provide suggestions for improvements.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

- [Your Name](https://github.com/yourusername)

## Acknowledgments

- [Express.js](https://expressjs.com/) - The web framework used.
- [MySQL](https://www.mysql.com/) - The database management system.
- [Google Cloud Storage](https://cloud.google.com/storage) - Cloud storage for resume files.
- [bcrypt](https://www.npmjs.com/package/bcrypt) - Library for password hashing.
- [jsonwebtoken](https://www.npmjs.com/package/jsonwebtoken) - Library for handling JWT tokens.
- [Multer](https://www.npmjs.com/package/multer) - Middleware for file uploads.

Thank you for using Resume Vault!
