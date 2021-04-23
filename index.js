const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const config = require('./config/db')
const bodyParser = require('body-parser')
const logger = require('morgan')

const PORT = process.env.PORT || 5000

const app = express();

app.use(bodyParser.json())
app.use(cors());

//set db
mongoose.set("useCreateIndex", true);
mongoose.connect(config.database, {useNewUrlParser: true, useUnifiedTopology: true})
.then(() => {console.log("db connectedd")})
.catch(err => console.log({err}))


app.use(logger("dev"))
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

//route
app.use('/user', require('./user/routes/user'))

app.listen(PORT, () => {
    console.log(`App is running on ${PORT}`)
})
