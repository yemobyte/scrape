const express = require('express');
const cors = require('cors');
const router = require('./routes/main');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

/* Route utama */
app.use('/', router);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
