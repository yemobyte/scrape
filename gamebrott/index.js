/* Required dependencies */
const express = require('express');
const cors = require('cors');
const mainRoutes = require('./routes/main');

/* Initialize Express app */
const app = express();
const PORT = process.env.PORT || 3000;

/* Middleware */
app.use(cors());
app.use(express.json());
app.set('json spaces', 2);

/* Routes */
app.use('/', mainRoutes);

/* Start server */
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
