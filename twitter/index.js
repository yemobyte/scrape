const express = require('express');
const cors = require('cors');
const router = require('./routes/main');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.set('json spaces', 2);

app.use('/', router);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
