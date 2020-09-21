require('dotenv').config();
const express = require('express')
const router = express.Router();
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const dbpool = require('../models/dbpool');


router.post('/user/signup', async function(req, res){
    try{
        let user = {
            username: req.body.username,
            password: await bcrypt.hash(req.body.password,8)
        }
        dbpool.getConnection((err, connection) =>{
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

router.post('/user/login', function(req, res){
    const username = req.body.username;
    const password = req.body.password;
    dbpool.getConnection((error, connection) =>{
        if(error)
            throw error            
        connection.query("SELECT id, password from users where username=?",[username],async(err, results) =>{
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
                    res.json({error: null, message:"Login successful", id: results[0].id,token})
                }
            }catch(error){
                res.status(400).json({error:'User not found or invalid information', message:null})
            }
            
        });
    });
})

module.exports = router