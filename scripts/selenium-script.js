const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const { MongoClient } = require('mongodb');
const { v4: uuidv4 } = require('uuid');
require('chromedriver');
require('dotenv').config(); // Load environment variables from .env file

const mongoUrl = process.env.MONGO_URL; // MongoDB connection string from environment variables
const dbName = 'twitter_trends';
const collectionName = 'trending_topics';

async function logPublicIP(driver) {
    try {
        await driver.get('https://api.ipify.org/?format=json');
        let body = await driver.findElement(By.tagName('body')).getText();
        let ipInfo = JSON.parse(body);
        return ipInfo.ip;
    } catch (error) {
        console.error('Error fetching IP address:', error);
        return null;
    }
}



async function runSeleniumScript() {

    // Configure Chrome options to use headless mode
    let chromeOptions = new chrome.Options();
    chromeOptions.addArguments('--headless'); // Enable headless mode
    chromeOptions.addArguments('--no-sandbox'); // Required for some environments
    chromeOptions.addArguments('--disable-dev-shm-usage'); // Overcomes limited resource problems in some environments
    chromeOptions.addArguments('--disable-gpu'); // Disabling GPU for better compatibility with headless mode
    chromeOptions.addArguments('--disable-software-rasterizer'); // Disable the software rasterizer
    chromeOptions.addArguments('--disable-features=IsolateOrigins,site-per-process'); // Disable certain Chrome security features
    chromeOptions.addArguments('--window-size=1920,1080'); // Set window size
    chromeOptions.addArguments('--disable-infobars'); // Disable infobars
    chromeOptions.addArguments('--disable-extensions'); // Disable extensions
    chromeOptions.addArguments('--disable-popup-blocking'); // Disable popup blocking
    chromeOptions.addArguments('--disable-translate'); // Disable translate

    // Initialize the Chrome driver with the specified options
    let driver = await new Builder().forBrowser('chrome').setChromeOptions(chromeOptions).build();

    let client;
    try {
        const ipAddress = await logPublicIP(driver);
        console.log(ipAddress);

        // Connect to MongoDB
        client = await MongoClient.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
        const db = client.db(dbName);
        const collection = db.collection(collectionName);

        // Open the login page
        await driver.get('https://x.com/i/flow/login');

        // Step 2: Input the username
        let usernameInput = await driver.wait(until.elementLocated(By.name('text')), 40000); // Increased wait time
        await usernameInput.sendKeys('sreekantharkat5@gmail.com');

        // Step 3: Click the Next button
        let nextButton = await driver.wait(until.elementLocated(By.xpath('//button//span[text()="Next"]')), 40000); // Increased wait time
        await nextButton.click();

        // Check if the verifyUsernameInput exists and interact with it
        try {
            let verifyUsernameInput = await driver.wait(until.elementLocated(By.name('text')), 40000); // Increased wait time
            await verifyUsernameInput.sendKeys('ArkatSreekanth');

            // Wait for the "Next" button to be clickable and click it
            nextButton = await driver.wait(until.elementLocated(By.css('button[data-testid="ocfEnterTextNextButton"]')), 40000); // Increased wait time
            await nextButton.click();
        } catch (err) {
            console.log("Verify username input not found, proceeding to the next step.");
        }

        // Step 4: Input the password
        let passwordInput = await driver.wait(until.elementLocated(By.name('password')), 40000); // Increased wait time
        await passwordInput.sendKeys('Asreddy@123');

        // Step 5: Click the login button
        let loginButtonFinal = await driver.wait(until.elementLocated(By.xpath('//button[@data-testid="LoginForm_Login_Button"]')), 40000); // Increased wait time
        await loginButtonFinal.click();

       // Wait until the "Show more" link is present
       let showMoreLink = await driver.wait(until.elementLocated(By.css('a[href="/explore/tabs/for-you"]')), 10000);

       // Click the "Show more" link
       await showMoreLink.click();

        // Define the XPath expressions for the elements
        const xpaths = [
            '/html/body/div[1]/div/div/div[2]/main/div/div/div/div[1]/div/div[3]/div/section/div/div/div[3]/div/div/div/div/div[2]/span',
            '/html/body/div[1]/div/div/div[2]/main/div/div/div/div[1]/div/div[3]/div/section/div/div/div[4]/div/div/div/div/div[2]/span',
            '/html/body/div[1]/div/div/div[2]/main/div/div/div/div[1]/div/div[3]/div/section/div/div/div[5]/div/div/div/div/div[2]/span',
            '/html/body/div[1]/div/div/div[2]/main/div/div/div/div[1]/div/div[3]/div/section/div/div/div[6]/div/div/div/div/div[2]/span',
            '/html/body/div[1]/div/div/div[2]/main/div/div/div/div[1]/div/div[3]/div/section/div/div/div[7]/div/div/div/div/div[2]/span',
            '/html/body/div[1]/div/div/div[2]/main/div/div/div/div[1]/div/div[3]/div/section/div/div/div[8]/div/div/div/div/div[2]/span',
        ];

        let trends = []

        
        for (let i = 0 ; i <= 5 ; i++){
            let element = await driver.wait(until.elementLocated(By.xpath(xpaths[i])), 10000);

            // Get the text of the element
            let text = await element.getText(); 

            console.log(trends.push(text));
        }


        console.log(trends)

        // Generate a unique ID
        const uniqueID = uuidv4();

        // Get the current date and time
        const endTime = new Date();

        // Prepare the document to insert
        const trendingTopicsDocument = {
            uniqueID: uniqueID,
            trend1: trends[0],
            trend2: trends[1],
            trend3: trends[2],
            trend4: trends[3],
            trend5: trends[4],
            ipAddress: ipAddress,
            endTime: endTime,
        };

        // Insert the document into the MongoDB collection
        await collection.insertOne(trendingTopicsDocument);
        console.log('Document inserted successfully:', trendingTopicsDocument);
        const records = await collection.find().toArray();

        return { trendingTopicsDocument, records };
    } catch (error) {
        console.error('Error running Selenium script:', error);
    } finally {
        try {
            // Close the browser
            if (driver) {
                await driver.quit();
            }
        } catch (quitError) {
            console.error('Error quitting WebDriver:', quitError);
        }

        
        // Close the MongoDB connection
        if (client) {
            await client.close();
        }
    }
}

module.exports = runSeleniumScript;
