/* Required Modules */
const express = require('express');
const cors = require('cors');
const router = require('./routes/main');

/* App Configuration */
const app = express();
const PORT = 3000;

/* Middleware */
app.use(cors());
app.use(express.json());
app.set('json spaces', 2);

/* Routes */
app.use('/', router);

/* Start Server */
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
