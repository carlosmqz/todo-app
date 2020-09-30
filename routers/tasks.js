require('dotenv').config();
const express = require('express');
const router = express.Router();
const dbpool = require('../models/dbpool');
const utils = require('../utils/utils');
const Utils = require('../utils/utils');

router.get('/task/list', utils.validateAuth, function(req, res){
    user = res.user;
    console.log(user);
    dbpool.getConnection((err, connection) =>{
        try{
            if(err)
                throw err;
            connection.query('SELECT * FROM tasks WHERE userid = ?', user.id, (err, results) =>{
                if (err){
                    throw err;
                }

                res.json({
                    error:null,
                    message:`Task list retrieved`,
                    tasks: results
                })
            })
        }catch(err){
            res.status(400).json({error:`Error listing tasks - ${err.message}`})
        }
    })
})

router.post('/task/addTask', function (req, res){
    let task = {
        description: req.body.description,
        dueDate: req.body.dueDate,
        userId: req.body.userId
    }
   dbpool.getConnection(function(err, connection){
       if(err){
           console.log('Error getting the connection')
           return;
       }
       connection.on('error',function(error){
        console.log('Error getting the database connection ')
        res.status(500).json({
            error: 'Error getting the database connection',
            message: null
            })
        })
       connection.query('INSERT INTO tasks SET ?', task, function(err){
           if(err){
            console.log('Error saving the Task'+ err);
            res.status(400).json({
                error: 'Error saving the Task',
                message: null
            })
           }else{
                connection.release();
                res.json({
                    error:null,
                    message: `Task ${task.description} saved.`
                })
           }
       })
   })
        
})


module.exports = router