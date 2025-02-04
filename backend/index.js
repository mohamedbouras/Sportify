const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const mysql = require('mysql2');
const  uuid = require('uuid');
const nodemailer = require("nodemailer");
const { google } = require('googleapis');
const OAuth2 = google.auth.OAuth2;
const app = express()
const Port = 3000
app.use(cors())
app.use(express.urlencoded({extended:true}))
app.use(express.json())
app.use(bodyParser.json());
const connection = require('./database/index');
const { getAll, add } = require('./controllers/user');

app.get('/api/users/getAll',(req,res)=>{
  getAll((err,result)=>{
      if(err){
          res.status(500).json(err)
      }
      else {
          res.status(200).json(result)
      }
  })
})

app.post('/updateHeight', (req, res) => {
  console.log(req.body);
  const email = req.body.email;
  const height = req.body.height;
  console.log(email,height);

  const updateQuery = 'UPDATE Users SET user_heigth = ? WHERE user_email = ?';
  connection.query(updateQuery, [height, email], (err, result) => {
    if (err) {
      console.error('Error updating user height: ' + err);
      res.status(500).json({ error: 'Error updating user height' });
    } else {
      res.json(result);
    }
  });
});
app.post('/gender', (req, res) => {
  const { email, gender } = req.body;
  const updateQuery = 'UPDATE Users SET user_gender = ? WHERE user_email = ?';
  connection.query(updateQuery, [gender, email], (err, result) => {
    if (err) {
      console.error('Error updating user height: ' + err);
      res.sendStatus(500);
    } else {
      res.json(result);
    }
  });
});
app.post('/weight', (req, res) => {
  const { email, weight } = req.body;
  const updateQuery = 'UPDATE Users SET user_weight = ? WHERE user_email = ?';
  connection.query(updateQuery, [weight, email], (err, result) => {
    if (err) {
      console.error('Error updating user height: ' + err);
      res.sendStatus(500);
    } else {
      res.json(result);
    }
  });
});
app.post('/goal', (req, res) => {
  const { email, goal } = req.body;
  const updateQuery = 'UPDATE Users SET user_goal = ? WHERE user_email = ?';
  connection.query(updateQuery, [goal, email], (err, result) => {
    if (err) {
      console.error('Error updating user height: ' + err);
      res.sendStatus(500);
    } else {
      res.json(result);
    }
  });
});
app.post('/register', (req, res) => {
  const { username, password, email, type } = req.body;
  const query = 'SELECT * FROM users WHERE user_email = ?';
  connection.query(query, [email], (err, rows) => {
    if (err) {
      console.error('Error checking for existing email: ' + err);
      res.sendStatus(500);
      return;
    }
    if (rows.length > 0) {
      res.status(400).send('Email address already in use');
      return;
    }
    if (!password) {
      res.status(400).send('Password is required');
      return;
    }
    bcrypt.genSalt(10, (err, salt) => {
      if (err) {
        console.error('Error generating salt: ' + err);
        res.sendStatus(500);
        return;
      }
      bcrypt.hash(password, salt, (err, hash) => {
        if (err) {
          console.error('Error hashing password: ' + err);
          res.sendStatus(500);
          return;
        }
        const insertQuery = 'INSERT INTO Users (user_name, user_password, user_email, user_type) VALUES (?, ?, ?, "user")';
        connection.query(insertQuery, [username, hash, email], (err, result) => {
          if (err) {
            console.error('Error inserting user into database: ' + err);
            res.sendStatus(500);
          } else {
            res.sendStatus(200);
      
          }
        });
      });
    });
  });
});





app.get('/protected', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    res.sendStatus(401);
    return;
  }
  jwt.verify(token, 'my_secret_key', (err, decoded) => {
    if (err) {
      console.error('Error verifying JWT token: ' + err);
      res.sendStatus(500);
      return;
    }

    res.json({ message: 'Authenticated user: ' + decoded.username });
  });
});

const secretKey = 'mysecretkey';

// app.post('/loginn', (req, res) => {
//   const { email, password } = req.body;
//   const query = 'SELECT * FROM Users WHERE user_email = ?';
//   connection.query(query, [email], (err, results) => {
//     if (err) {
//       console.error('Error retrieving user from database: ' + err);
//       res.sendStatus(500);
//       return;
//     }
//     if (results.length === 0) {
//       res.status(401).send({ message: 'Invalid email or password' });
//     }

//     const user = results[0];
//     console.log(results,'the user');
//     bcrypt.compare(password, user.user_password, (err, isMatch) => {
//       if (err) {
//         console.error('Error comparing passwords: ' + err);
//         res.sendStatus(500);
//         return;
//       }

//       if (!isMatch) {
//         res.status(401).send({ message: 'Invalid email or password' });
//         return;
//       }
//       const token = jwt.sign({ userId: user.User_Id }, secretKey, { expiresIn: '1h' });
//       res.send({ token });
//     });
//   });
// });
app.post('/loginn', (req, res) => {
  const { email, password } = req.body;
  const query = 'SELECT * FROM Users WHERE user_email = ?';
  connection.query(query, [email], (err, results) => {
    if (err) {
      console.error('Error retrieving user from database: ' + err);
      res.sendStatus(500);
      return;
    }
    if (results.length === 0) {
      res.status(401).send({ message: 'Invalid email or password' });
      return; // Add this line to return from the function
    }

    const user = results[0];
    console.log(results,'the user');
    bcrypt.compare(password, user.user_password, (err, isMatch) => {
      if (err) {
        console.error('Error comparing passwords: ' + err);
        res.sendStatus(500);
        return;
      }

      if (!isMatch) {
        res.status(401).send({ message: 'Invalid email or password' });
        return;
      }
      const token = jwt.sign({ userId: user.User_Id }, secretKey, { expiresIn: '1h' });
      res.send({ token });
    });
  });
});


const CLIENT_ID = "258481515920-rvekh1dpr2hp2tjq9qamjcr6ui2t63r7.apps.googleusercontent.com"
const CLIENT_SECRET = "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";
const REDIRECT_URI = "https://developers.google.com/oauthplayground";
const REFRESH_TOKEN = "1//04sl12Qp47j6-CgYIARAAGAQSNwF-L9IrrwEMvr2wjkyhWRS4SYwTbfmFc2lpsNq5096tngR_rRLx_zMqyeArVXMubUgBSvjmI0w";

const oAuth2Client = new OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);
oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    type: "OAuth2",
    user: "medb0748@gmail.com",
    clientId: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
    refreshToken: REFRESH_TOKEN,
    accessToken: oAuth2Client.getAccessToken(),
  },
});
const verificationCodeMap = new Map();

// app.post("/forget-password-email", async (req, res) => {
//   const { email } = req.body;
//   const verificationCode = Math.floor(100000 + Math.random() * 900000);

//   const mailOptions = {
//     from: "medb0748@gmail.com",
//     to: email,
//     subject: "Reset Password Code",
//     text: `Your reset password code is ${verificationCode}`,
//   };

//   transporter.sendMail(mailOptions, (error, info) => {
//     if (error) {
//       console.log(error);
//       res.status(500).send("Could not send email");
//     } else {
//       console.log("Email sent: " + info.response);
//       res.status(200).send("Email sent successfully");
//       verificationCodeMap.set(email, verificationCode);
//       console.log("Verification code for", email, "is", verificationCode);

//     }
//   });
// });
app.post("/forget-password-email", async (req, res) => {
  const { email } = req.body;

  // Retrieve all users from the database
  getAll((err, users) => {
    if (err) {
      res.status(500).json(err);
    } else {
      // Check if the requested email is present in the list of users
      const user = users.find((user) => user.user_email === email);
      if (!user) {
        res.status(400).send("Email not found");
        return;
      }

      // Generate verification code and send email
      const verificationCode = Math.floor(100000 + Math.random() * 900000);
      const mailOptions = {
        from: "medb0748@gmail.com",
        to: email,
        subject: "Reset Password Code",
        text: `Your reset password code is ${verificationCode}`,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log(error);
          res.status(500).send("Could not send email");
        } else {
          console.log("Email sent: " + info.response);
          res.status(200).send("Email sent successfully");
          verificationCodeMap.set(email, verificationCode);
          console.log("Verification code for", email, "is", verificationCode);
        }
      });
    }
  });
});




app.post("/verify-code", (req, res) => {
  const { email, code } = req.body;
  console.log("email:", email);
  console.log("code:", code);
  const verificationCode = verificationCodeMap.get(email);
  console.log("verificationCode:", verificationCode);
  if (verificationCode == code) {
    res.status(200).send("Code verified successfully");
  } else {
    res.status(400).send("Invalid code");
  }
});





app.put('/change-password', (req, res) => {
  const { email, password } = req.body
  const salt = bcrypt.genSaltSync(10)
  const hash = bcrypt.hashSync(password, salt)

  const sql = 'UPDATE Users SET user_password = ? WHERE user_email = ?'

  connection.query(sql, [hash, email], (err, result) => {
    if (err) {
      console.error(err)
      res.status(500).send('Could not update password');
    } else if (result.affectedRows === 0) {
      res.status(404).send('User not found')
    } else {
      res.send('Password updated successfully')
    }
  });
});


            
app.listen(Port,()=>{console.log('listenning on port ,',Port);})