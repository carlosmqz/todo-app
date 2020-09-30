require('dotenv').config();
const express = require('express')
const router = express.Router();
const bcrypt = require('bcrypt')
const Utils = require('../utils/utils');
const dbpool = require('../models/dbpool');

router.get('/user/me',Utils.validateAuth, async function(req, res){
    res.send((res.user));
})

router.post('/user/signup', async function(req, res){
    try{
        let user = {
            id: 0,
            username: req.body.username,
            password: await bcrypt.hash(req.body.password,8),
            email: req.body.email
        }
        dbpool.getConnection((err, connection) =>{
            if(err){
                throw err;
            }
            connection.query('INSERT INTO users SET ?',user, async (error, results) =>{
                if(error){
                    //return res.status(400).json({error: `Duplicate username \n ${error}`, message:null});
                    throw error;
                }
                try{
                    let payload = {
                        userid: results.insertId
                    }
                    user.id = results.insertId;
                    let token = Utils.genAuthToken(payload)
                    connection.release();   
                    res.json({error: null, message:"User correctly registered", user, token})   
                }catch(err){
                    throw err;
                }            
            });    
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
        connection.query("SELECT * from users where username=?",[username],async(err, results) =>{
            connection.release();
            if(err){
                throw err;
            }
            try{
                let user = results[0];
                let encryptedPassword = user.password;
                const isValid = await bcrypt.compare(password,encryptedPassword)
                if(isValid){
                    let payload = {
                        userid: user.id,
                    }
                    let token = await Utils.genAuthToken(payload)
                    res.json({error: null, message:"Login successful", user: user,token})
                }
            }catch(error){
                res.status(400).json({error:'User not found or invalid information', message:null})
            }
            
        });
    });
})

module.exports = router