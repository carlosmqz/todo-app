require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const helmet = require('helmet')
const cors = require('cors')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const PORT = process.env.APP_PORT
const app = express();
const userConn = require('./models/users');
app.use(morgan('combined', {
    skip: function (req, res) { return res.statusCode < 400 }
  }))
app.use(helmet())
app.use(cors())
app.use(express.json())

//user routes
app.post('/user/signup', async function(req, res){
    try{
        let user = {
            username: req.body.username,
            password: await bcrypt.hash(req.body.password,8)
        }
        userConn.getConnection((err, connection) =>{
            if(err){
                throw err;
            }
            connection.beginTransaction((err) => {
                if(err){
                    throw err;
                }
                connection.query('INSERT INTO users SET ?',user,(error) =>{
                    if(error){
                        return connection.rollback(function(err){
                            res.status(400).json({error: "Duplicate username", message:null});
                        });
                    }
                    connection.commit(function(err){
                        if(err)
                            return connection.rollback(function(){
                                throw err;
                            })
                    });
                    connection.release();  
                    res.json({error: null, message:"User correctly registered"})                    
                });    
            })
        })
    }catch(error){
        res.status(400).json({error, message:null})
    }

})

app.post('/user/login', function(req, res){
    const username = req.body.username;
    const password = req.body.password;
    userConn.getConnection((error, connection) =>{
        if(error)
            throw error            
        connection.query("SELECT password from users where username=?",[username],async(err, results) =>{
            connection.release();
            if(err){
                throw err;
            }
            try{
                let encryptedPassword = results[0].password;
                const isValid = await bcrypt.compare(password,encryptedPassword)
                if(isValid){
                    let payload = {
                        username: username,
                        isValid: isValid,
                    }
                    let token = jwt.sign(payload,process.env.TOKEN_SECRET)
                    res.json({error: null, message:"Login successful", token})
                }
            }catch(error){
                res.status(400).json({error:'User not found or invalid information', message:null})
            }
            
        });
    });
})


app.listen(PORT,()=>{
    console.log(`Server started at port ${PORT}`)
})