require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const helmet = require('helmet')
const cors = require('cors')
const PORT = process.env.APP_PORT
const app = express();
const userRoutes = require('./routers/user')
const taskRoutes = require('./routers/tasks')
app.use(morgan('combined', {
    skip: function (req, res) { return res.statusCode < 400 }
  }))
app.use(helmet())
app.use(cors())
app.use(express.json())

//user routes
app.use(userRoutes);
app.use(taskRoutes);


app.listen(PORT,()=>{
    console.log(`Server started at port ${PORT}`)
})