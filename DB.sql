-- 1. Create and select the database
CREATE DATABASE IF NOT EXISTS Nexcore;
USE Nexcore;

-- 2. Create the table with corrected data types
CREATE TABLE IF NOT EXISTS Contact_data (
    -- Added AUTO_INCREMENT so IDs generate themselves
    UserID INT NOT NULL AUTO_INCREMENT, 
    -- Changed TEXT to VARCHAR(255) to allow it to be a Primary Key/Index
    UserName VARCHAR(255) NOT NULL, 
    Email VARCHAR(255),
    -- Initialized as TEXT to avoid needing an immediate ALTER
    Message TEXT NOT NULL,
    PRIMARY KEY (UserID)
);

-- 3. Modify and Expand the table
-- Change Message to LONGTEXT (if you expect massive amounts of data)
ALTER TABLE Contact_data MODIFY Message LONGTEXT NOT NULL;

-- Add tracking columns
ALTER TABLE Contact_data ADD COLUMN CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE Contact_data ADD COLUMN IsReplied TINYINT(1) DEFAULT 0;

-- 4. Verify the structure
DESCRIBE Contact_data;

-- 5. View data
SELECT * FROM Contact_data;