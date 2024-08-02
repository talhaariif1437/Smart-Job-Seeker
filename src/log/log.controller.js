const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Log = require('./log.model')

//Middleware

const jwt= require("../middleware/jwt");

const LogService= require("./log.service")

router.post("/",jwt,async(req,res)=>{
    let {text} = req.body;
    let createdBy= req.user.userId
    try{
        let log = await LogService.create(text,createdBy);
        return res.status(200).json({message:"Log created successfully",log})
    }
    catch(err){
        console.log(err);
        res.status(500).json({message:"Internal server error"});
    }
})


router.delete("/:id",jwt,async(req,res)=>{
    let request = req.params;
    try{
        if(!request.id)return res.status(404).json({message:"Log Id not provided"});
        
        await LogService.delete(request.id);
        return res.status(200).json({message:"Log deleted successfully"});
     
    }
    catch(error){
        console.log(error);
        res.status(500).json({message:"Internal server error"});
    }
})

//Specific User List
router.get("/:id",async(req,res)=>{
    console.log("User id is",req.params.id);
    try{
        const request = req.query;
        let result = await LogService.list(request.pageNo,request.searchValue, request.startDate, request.endDate,req.params.id);
        return res.status(200).json({message:"Log list is here:",result});
    }
    catch(error){
        console.log(error)
        res.status(500).json({message:"Internal server error"});
    };
})

// List
router.get("/",async(req,res)=>{
    console.log("User id is",req.params.id);
    try{
        const request = req.query;
        let result = await LogService.list(request.pageNo,request.searchValue, request.startDate, request.endDate);
        return res.status(200).json({message:"Log list is here:",result});
    }
    catch(error){
        console.log(error)
        res.status(500).json({message:"Internal server error"});
    };
})


module.exports = router;