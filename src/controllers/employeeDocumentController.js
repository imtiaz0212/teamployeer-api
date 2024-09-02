import { asyncHandler } from "../utilities/asyncHandler.js"
import { ApiResponse } from "../utilities/ApiResponse.js"
import { ApiError } from "../utilities/ApiError.js"
import { dateFormat } from "../utilities/helper.js"
import { uploadOnCloudinary, destroyOnCloudinary } from "../utilities/cloudinary.js"

import { EmployeeDocument } from "../models/employeeDecumentModel.js"
import { Employee } from "../models/employeeModel.js"


export const documentCreate = asyncHandler(async (req, res) => {

    const companyId = req.user?.companyId || "66bdec36e1877685a60200ac"

    const data = req.body
    data.companyId = companyId
    data.employeeId = req.params?.employeeId

    data.submitted = dateFormat(Date.now())

    console.log(data)

    if(!req.file?.path){
        throw new ApiError(400, "Attachment is required")
    }

    const attachmentPath = await uploadOnCloudinary(req.file?.path)

    data.attachment = attachmentPath?.url || ''

    const newDocument = await EmployeeDocument.create(data);

    if (!newDocument) {
        throw new ApiError(400, "Invalid credentials.")
    }

    return res.status(201).json(new ApiResponse(201, newDocument, "Employee document add successfully."));
})


export const getAllDocument = asyncHandler(async (req, res) => {

    const companyId = req.user?.companyId || "66bdec36e1877685a60200ac"

    const filters = { companyId: companyId, employeeId: req.params.employeeId }

    const documents = await EmployeeDocument.find(filters)

    return res.status(201).json(new ApiResponse(200, documents, "Employee documents retrieved successfully."))
})


export const updateDocument = asyncHandler(async (req, res) => {

    const companyId = req.user?.companyId || "66bdec36e1877685a60200ac"

    const filters = { companyId: companyId, employeeId: req.params?.employeeId, _id: id}

    const documentInfo = await EmployeeDocument.findOne(filters)

    if (!documentInfo) {
        throw new ApiError(404, "Employee document not found");
    }

    const data = req.body;

    data.approved = dateFormat(Date.new())

    /* if (req.file && req.file?.path) {
        const uploadAttachemnt = await uploadOnCloudinary(req.file?.path)
        data.attachment = uploadAttachemnt?.url || ""

        if (documentInfo && documentInfo.avatar) {
            await destroyOnCloudinary(documentInfo.attachment);
        }
    } */

    const employee = await Employee.findById(
        documentInfo._id,
        data,
        { new: true }
    );

    return res.status(200).json(new ApiResponse(200, employee, "Employee updated successfully."));
})


export const deleteDocument = asyncHandler(async (req, res) => {

    const companyId = req.user?.companyId || "66bdec36e1877685a60200ac"

    const filters = { companyId: companyId, employeeId: req.params?.employeeId, _id: req.params?.id }

    const documentInfo = await EmployeeDocument.findOne(filters)

    if (!documentInfo) {
        throw new ApiError(404, "Employee document not found!")
    }

    if(documentInfo.attachment){
        await destroyOnCloudinary(documentInfo.attachment);
    }

    await EmployeeDocument.findByIdAndDelete(documentInfo._id)
  
    return res.status(200).json(new ApiResponse(200, {}, "Employee docemnt delete successfully."));
})

