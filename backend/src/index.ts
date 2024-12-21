import * as dotenv from "dotenv"
dotenv.config()

import app from "./server";

const PORT = 3002;

app.listen(PORT, () => {
    console.log('hello on http://localhost:3002');
})