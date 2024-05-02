const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql2");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const session = require("express-session");
const flash = require("connect-flash");
const ejs = require("ejs");
const path = require("path");
const bcrypt = require("bcrypt");
const fs = require('fs');

const app = express();
const port = 3000;

const admin = [{ id: 1, username: "Manikanta", password: "0000" }];

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root",
  database: "paytmapp",
});

db.connect((err) => {
  if (err) throw err;
  console.log("connected to mysql database");
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

app.use(
  session({
    secret: "your-secret-key",
    resave: true,
    saveUninitialized: true,
    cookie: {
      maxAge: 300000,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, "public")));
app.use(flash());

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

passport.use(
  new LocalStrategy(function (username, password, done) {
    const ad = admin.find(
      (u) => u.username === username && u.password === password
    );
    if (ad) {
      return done(null, ad);
    } else {
      return done(null, false, { message: "Incorrect username or password" });
    }
  })
);

passport.serializeUser(function (ad, done) {
  done(null, ad.id);
});

passport.deserializeUser(function (id, done) {
  db.query("SELECT * FROM admin_account WHERE id = ?", [id], (err, results) => {
    if (err) {
      return done(err);
    }
    const ad = results[0];
    if (!ad) {
      return done(new Error("User not found"));
    }
    done(null, ad);
  });
});

const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  req.flash("error", "please log in to access this page");
  res.redirect("/admin/login");
};

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

app.get("/admin/login", (req, res) => {
  res.render("adminLogin", { message: req.flash("error") });
});

app.post(
  "/admin/login",
  passport.authenticate("local", {
    successRedirect: "/admin/dashboard",
    failureRedirect: "/admin/login",
    failureFlash: true,
  })
);

app.get("/admin/balance", isAuthenticated, (req, res) => {
  const adminBalance = req.user.balance;
  res.json({ balance: adminBalance });
});

app.get("/admin/dashboard", isAuthenticated, (req, res) => {
  // Fetch admin account details
  db.query(
      "SELECT account_number, balance, username FROM admin_account WHERE username = ?",
      [req.user.username],
      (err, results) => {
          if (err) throw err;

          const adminAccount = results[0];
          const walletImageUrl = "/wallet.jpeg";
          const notificationImageUrl = "/notification.jpeg";
          const profileImageUrl = "/profile.jpeg";
          const searchImageUrl = "/search.jpeg";

          // Fetch admin transaction history
          db.query(
              "SELECT * FROM admin_transaction_history WHERE admin_id = ? ORDER BY transaction_date DESC",
              [req.user.username],
              (historyErr, historyResults) => {
                  if (historyErr) throw historyErr;

                  // Render the adminDashboard view with admin account and transaction history
                  res.render("adminDashboard", {
                      walletImageUrl: walletImageUrl,
                      notificationImageUrl: notificationImageUrl,
                      profileImageUrl: profileImageUrl,
                      searchImageUrl: searchImageUrl,
                      adminAccount: adminAccount,
                      adminTransactionHistory: historyResults,
                  });
              }
          );
      }
  );
});

app.get("/user/login", (req, res) => {
  res.render("userLogin");
});

app.get("/user/register", (req, res) => {
  res.render("userRegistration");
});

app.post("/user/register", (req, res) => {
  const { fname, mobile_number, username, password } = req.body;

  // Validation: Check if required fields are provided
  if (!fname || !mobile_number || !username || !password) {
    res.status(400).json({ message: "All fields are required" });
    return;
  }

  // Check if the username or mobile number already exists
  const checkExistingQuery =
    "SELECT COUNT(*) AS count FROM user_logins WHERE username = ? OR mobile_number = ?";
  db.query(checkExistingQuery, [username, mobile_number], (err, result) => {
    if (err) {
      console.error("Error executing MySQL query: ", err);
      res.status(500).json({ message: "Internal Server Error" });
      return;
    }
    const userCount = result[0].count;
    if (userCount > 0) {
      // User already exists
      res.status(409).json({ message: "User already exists" });
    } else {
      // Insert new user
      const insertQuery =
        "INSERT INTO user_logins (fullname, mobile_number, username, password) VALUES (?, ?, ?, ?)";
      db.query(
        insertQuery,
        [fname, mobile_number, username, password],
        (err, result) => {
          if (err) {
            console.error("Error executing MySQL query: ", err);
            res.status(500).json({ message: "Internal Server Error" });
            return;
          }
          if (result.affectedRows > 0) {
            console.log("User registered successfully");
            res.status(200).json({ message: "User registered successfully" });
          } else {
            console.error("Error registering user");
            res.status(500).json({ message: "Internal Server Error" });
          }
        }
      );
    }
  });
});

app.get("/showusers", (req, res) => {
  // Fetch all users from the database
  db.query("SELECT * FROM user_logins", (err, results) => {
    if (err) {
      console.error("Error fetching users from database: ", err);
      res.status(500).send("Internal Server Error");
      return;
    }
    // Render the user data in a table
    const userTable =
      '<table border="1"><tr><th>Id</th><th>Full Name</th><th>Mobile Number</th><th>Username</th></tr>' +
      results
        .map(
          (user) =>
            `<tr><td>${user.id}</td><td>${user.fullname}</td><td>${user.mobile_number}</td><td>${user.username}</td></tr>`
        )
        .join("") +
      "</table>";
    // Send the HTML content as the response
    res.send(userTable);
  });
});

app.get("/search", (req, res) => {
  const searchQuery = req.query.query;
  // Perform a SELECT query to fetch user details based on the search query
  const sql =
    "SELECT * FROM user_logins WHERE username LIKE ? OR fullname LIKE ?";
  db.query(sql, [`%${searchQuery}%`, `%${searchQuery}%`], (err, results) => {
    if (err) {
      console.error("Error executing SQL query:", err);
      res.status(500).send("Internal Server Error");
    } else {
      if (results && results.length > 0) {
        const userDetailsHTML = `<table>
        <tr>
          <td><b>User Details:</b></td>
          <td></td>
        </tr>
        <tr>
          <td><b>ID:</b></td>
          <td>${results[0].id}</td>
        </tr>
        <tr>
          <td><b>Full Name:</b></td>
          <td>${results[0].fullname}</td>
        </tr>
        <tr>
          <td><b>Mobile Number:</b></td>
          <td>${results[0].mobile_number}</td>
        </tr>
        <tr>
          <td><b>Username:</b></td>
          <td>${results[0].username}</td>
        </tr>
      </table>
      `;
        res.status(200).send(userDetailsHTML);
      } else {
        // No matching user found
        res.status(404).send("User not found");
      }
    }
  });
});

app.post("/user/login", (req, res) => {
  const { username, password } = req.body;

  const sql = `SELECT *
  FROM user_logins ul
  JOIN user_accounts ua ON TRIM(ul.mobile_number) = TRIM(ua.mobile_number)
  WHERE ul.username = ?;`;
  db.query(sql, [username, password], (err, results) => {
    if (err) throw err;

    if (results.length > 0) {
      // Successful login
      const user = results[0];
      const walletImageUrl = "/wallet.jpeg";
      const notificationImageUrl = "/notification.jpeg";
      const profileImageUrl = "/profile.jpeg";
      const imagesPath = path.join(__dirname, "public","images");
      const imageFiles = fs.readdirSync(imagesPath);
      const randomImage =
        imageFiles[Math.floor(Math.random() * imageFiles.length)];
      res.render("userDashboard", {
        user: user,
        walletImageUrl: walletImageUrl,
        notificationImageUrl: notificationImageUrl,
        profileImageUrl: profileImageUrl,
        randomImage,
      }); // Assuming you have a userdashboard.ejs file
    } else {
      // Incorrect username or password
      res.send(
        '<script>alert("Invalid login"); window.location.href = "/user/login";</script>'
      );
    }
  });
});

app.get('/admin/makepayment',(req,res) => {
  res.render('adminMakePayment');
});

// Function to generate a unique transaction ID
function generateUniqueTransactionId() {
  const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, ''); // Get current timestamp in a format like '20220109T123456789'
  const randomDigits = Math.floor(Math.random() * 1000).toString().padStart(3, '0'); // Add 3 random digits

  return `TRANS${timestamp}${randomDigits}`;
}

// Helper function to validate input
function isValidInput(paymentType, amount, ifsc_code, account_number, customer_id, mobile_number, upi_id) {
  switch (paymentType) {
      case 'toBank':
          return !isNaN(amount) && amount > 0 && ifsc_code && account_number && customer_id;

      case 'toMobile':
          return !isNaN(amount) && amount > 0 && mobile_number;

      case 'toUpi':
          return !isNaN(amount) && amount > 0 && upi_id;

      default:
          return false;
  }
}

// Helper function to get receiver parameters based on payment type
function getReceiverParams(paymentType, ifsc_code, account_number, customer_id, mobile_number, upi_id) {
  switch (paymentType) {
      case 'toBank':
          return [ifsc_code, account_number, customer_id];

      case 'toMobile':
          return [mobile_number];

      case 'toUpi':
          return [upi_id];

      default:
          return [];
  }
}

app.post('/admin/makepayment', (req, res) => {
  const { paymentType, ifsc_code, account_number, customer_id, amount, mobile_number, upi_id } = req.body;

  if (!isValidInput(paymentType, amount, ifsc_code, account_number, customer_id, mobile_number, upi_id)) {
      return res.status(400).json({ error: 'Invalid input' });
  }

  let tableName, receiverField, receiverCondition;
  switch (paymentType) {
      case 'toBank':
          tableName = 'user_accounts';
          receiverField = 'balance';
          receiverCondition = 'ifsc_code = ? AND account_number = ? AND customer_id = ?';
          break;

      case 'toMobile':
          tableName = 'user_accounts';
          receiverField = 'balance';
          receiverCondition = 'mobile_number = ?';
          break;

      case 'toUpi':
          tableName = 'user_accounts';
          receiverField = 'balance';
          receiverCondition = 'upi_id = ?';
          break;

      default:
          return res.status(400).json({ error: 'Invalid payment type' });
  }

  const sql = `
      UPDATE ${tableName}
      SET ${receiverField} = ${receiverField} + ?
      WHERE ${receiverCondition}
  `;

  // SQL query to deduct from the admin account
  const adminSql = `
      UPDATE admin_account
      SET balance = balance - ?
  `;

  // SQL query to insert into admin_transaction_history
  const transactionId = generateUniqueTransactionId();
  const adminTransactionSql = `
      INSERT INTO admin_transaction_history (transaction_id, admin_id, customer_id, account_number, ifsc_code, mobile_number, upi_id, amount, status, payment_method, currency)
      VALUES (?, 'Manikanta', ?, ?, ?, ?, ?, ?, 'Successful', ?, 'rupee')
  `;

  db.beginTransaction(function (err) {
      if (err) {
          console.error('Error beginning transaction:', err);
          return res.status(500).json({ error: 'Internal Server Error' });
      }

      // Execute the user account or mobile payment update
      const receiverParams = getReceiverParams(paymentType, ifsc_code, account_number, customer_id, mobile_number, upi_id);
      db.query(sql, [amount, ...receiverParams], (userErr, userResult) => {
          if (userErr) {
              console.error('Error updating user/mobile balance:', userErr);
              return db.rollback(function () {
                  res.status(500).json({ error: 'Internal Server Error' });
              });
          }

          // Execute the admin account update
          db.query(adminSql, [amount], (adminErr, adminResult) => {
              if (adminErr) {
                  console.error('Error updating admin balance:', adminErr);
                  return db.rollback(function () {
                      res.status(500).json({ error: 'Internal Server Error' });
                  });
              }

              // Insert into admin_transaction_history
              db.query(adminTransactionSql, [transactionId, customer_id, account_number, ifsc_code, mobile_number, upi_id, amount, paymentType], (transactionErr, transactionResult) => {
                  if (transactionErr) {
                      console.error('Error inserting into admin_transaction_history:', transactionErr);
                      return db.rollback(function () {
                          res.status(500).json({ error: 'Internal Server Error' });
                      });
                  }

                  db.commit(function (commitErr) {
                      if (commitErr) {
                          console.error('Error committing transaction:', commitErr);
                          return db.rollback(function () {
                              res.status(500).json({ error: 'Internal Server Error' });
                          });
                      }

                      res.status(200).json({ success: true });
                  });
              });
          });
      });
  });
});

app.get('/user/makepayment',(req,res) => {
  res.render('userMakePayment');
});

app.listen(port, (err) => {
  if (err) throw err;
  console.log(`server is running on ${port}`);
});
