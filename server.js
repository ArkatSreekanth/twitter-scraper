const express = require('express');
const runSeleniumScript = require('./scripts/selenium-script');

const app = express();
const port = process.env.PORT || 3000;

// Serve the index.html file
app.use(express.static('public'));

// Route to trigger the Selenium script
app.get('/run-script', async (req, res) => {
    try {
        const data = await runSeleniumScript();
        

        // Format the date and time
        const now = new Date();
        const formattedDate = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
        
        const dataToSend = {...data, formattedDate}

        
        res.send(dataToSend);
    } catch (error) {
        console.log(error)
        console.error('Error running Selenium script:', error);
        res.status(500).send('Error running Selenium script');
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
