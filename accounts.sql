create database paytmapp;
use paytmapp;
drop database paytmapp;
CREATE TABLE IF NOT EXISTS admin_account (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  mobile_number VARCHAR(20) NOT NULL UNIQUE,
  ifsc_code VARCHAR(255) NOT NULL,
  account_number VARCHAR(255) NOT NULL UNIQUE,
  customer_id INT NOT NULL UNIQUE,
  username VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  upi_id VARCHAR(255) NOT NULL UNIQUE,
  balance DECIMAL(10, 2) DEFAULT 0
);
INSERT INTO admin_account (name, mobile_number, ifsc_code, account_number, customer_id, username, password, upi_id, balance) VALUES ('Manikanta', '8522845343', 'PA001234', '918522845343', 5343, 'Manikanta', '0000', '8522845343@admin', 10000.00);
select * from admin_account;
truncate admin_account;
drop table admin_account;

CREATE TABLE IF NOT EXISTS user_logins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fullname VARCHAR(255) NOT NULL,
    mobile_number VARCHAR(15) NOT NULL UNIQUE,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL
);
select * from user_logins;
describe user_logins;
truncate user_logins;	
drop table user_logins;

CREATE TABLE IF NOT EXISTS user_accounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mobile_number VARCHAR(15) NOT NULL UNIQUE,
    ifsc_code VARCHAR(255) NOT NULL,
    account_number VARCHAR(255) NOT NULL UNIQUE,
    customer_id VARCHAR(255) NOT NULL UNIQUE,
    upi_id VARCHAR(255) NOT NULL UNIQUE,
    balance DECIMAL(10, 2) DEFAULT 3000
);
select * from user_accounts;
truncate user_accounts;
drop table user_accounts;

INSERT INTO user_accounts (mobile_number, ifsc_code, account_number, customer_id, upi_id)
VALUES ('8977801788', 'ABC12345', '918977801788', 'CUST1201', 'hars@upi');

INSERT INTO user_accounts (mobile_number, ifsc_code, account_number, customer_id, upi_id)
VALUES ('6281184748', 'ABC12345', '916281184748', 'CUST1202', 'rama@upi');

INSERT INTO user_accounts (mobile_number, ifsc_code, account_number, customer_id, upi_id)
VALUES ('9705013490', 'ABC12345', '919705013490', 'CUST1203', 'thar@upi');

INSERT INTO user_accounts (mobile_number, ifsc_code, account_number, customer_id, upi_id)
VALUES ('9100579163', 'ABC12345', '919100579163', 'CUST1204', 'shiv@upi');

INSERT INTO user_accounts (mobile_number, ifsc_code, account_number, customer_id, upi_id)
VALUES ('7286856130', 'ABC12345', '917286856130', 'CUST1205', 'abhi@upi');

INSERT INTO user_accounts (mobile_number, ifsc_code, account_number, customer_id, upi_id)
VALUES ('6300966705', 'ABC12345', '916300966705', 'CUST1206', 'dile@upi');

INSERT INTO user_accounts (mobile_number, ifsc_code, account_number, customer_id, upi_id)
VALUES ('7569395513', 'ABC12345', '917569395513', 'CUST1207', 'aaka@upi');

INSERT INTO user_accounts (mobile_number, ifsc_code, account_number, customer_id, upi_id)
VALUES ('9618021890', 'ABC12345', '919618021890', 'CUST1208', 'vive@upi');

INSERT INTO user_accounts (mobile_number, ifsc_code, account_number, customer_id, upi_id)
VALUES ('9347117923', 'ABC12345', '919347117923', 'CUST1209', 'arav@upi');

INSERT INTO user_accounts (mobile_number, ifsc_code, account_number, customer_id, upi_id)
VALUES ('9666055597', 'ABC12345', '919666055597', 'CUST1210', 'manu@upi');

CREATE TABLE admin_transaction_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_id VARCHAR(255),
    admin_id VARCHAR(255),
    customer_id VARCHAR(255),
    account_number VARCHAR(255),
    ifsc_code VARCHAR(255),
    mobile_number VARCHAR(255),
    upi_id VARCHAR(255),
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    amount DECIMAL(10, 2),
    status VARCHAR(50),
    payment_method VARCHAR(50),
    currency VARCHAR(10) DEFAULT 'rupee'
);
select * from admin_transaction_history;
truncate table admin_transaction_history;
drop table admin_transaction_history;