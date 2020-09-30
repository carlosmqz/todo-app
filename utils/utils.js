require('dotenv').config();
const jwt = require('jsonwebtoken');
const dbpool = require('../models/dbpool');

module.exports = {
    genAuthToken: function (payload){
        try{
            let token = jwt.sign(payload,process.env.TOKEN_SECRET)
            dbpool.getConnection((err, conn) =>{
                if(err)
                    throw err;
                try{
                    conn.query('INSERT INTO tokens SET ?',{token, userId:payload.userid}, (err) => {
                        if(err){
                            throw err;
                        }
                        conn.release();
                    });
                }catch(err){
                    console.log(err)
                }
            })
            return token;
        }catch(err){
            res.json({error: `Error generating Token - ${err.message}`})
        }

    },
    validateAuth: (req, res, next) =>{
        const token = req.header('Authorization').replace('Bearer ', '');
        try{
            const validAuth = jwt.verify(token, process.env.TOKEN_SECRET);
            dbpool.getConnection((err, conn) => {
                if(err){
                    throw err;
                }
                conn.query('SELECT users.id, users.username, users.email FROM users inner join tokens where tokens.userid = ? and token = ?',[validAuth.userid, token],
                (err, results) =>{
                    if(err){
                        throw err;
                    }
                    res.user = results[0];
                    next();
                });

            })
        }catch(err){
            res.status(401).json({error: `Please authenticate,  ${err.message}`});
        }
        
    }
}
