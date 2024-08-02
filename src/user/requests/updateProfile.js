const { sendErrorResponse } = require("../../shared/response.service");

module.exports = (req,res,next)=>{
    console.log("req.body", req.body);
    const missingParams =[];
    const requiredParams = ["dob","phoneNo","address","hobby","experience","education","skills","expectedSalary","currentJob"];


    requiredParams.forEach((param)=>{
        if(!req.body[param]){
           missingParams.push(param);
        }
    });

    if(missingParams.length >0){
        return sendErrorResponse(
            res, `${missingParams.join(" and ")}: is required`
        );
    }

    next();
}