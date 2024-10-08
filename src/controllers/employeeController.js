import { asyncHandler } from "../utilities/asyncHandler.js"
import { ApiResponse } from "../utilities/ApiResponse.js"
import { ApiError } from "../utilities/ApiError.js"
import { generateCode, objectId } from "../utilities/helper.js"
import { uploadOnCloudinary, destroyOnCloudinary } from "../utilities/cloudinary.js"


import { Employee } from "../models/employeeModel.js"
import { Team } from "../models/teamModel.js"

export const createData = asyncHandler(async (req, res) => {

    const companyId = req.user?.companyId || "66bdec36e1877685a60200ac"

    const data = req.body

    data.companyId = companyId
    data.employeeId = generateCode(5)

    if(!data.supervisor){
        delete data.supervisor
    }

    if (req.file?.path) {
        const uploadAvatar = await uploadOnCloudinary(req.file?.path)
        data.avatar = uploadAvatar?.url || ''
    }

    const newEmployee = await Employee.create(data);

    if (!newEmployee) {
        throw new ApiError(400, "Invalid credentials.")
    }

    // update team employees
    const updateTeam = await Team.findByIdAndUpdate(
        newEmployee.team,
        { $push: { employees: newEmployee._id } },
        { new: true }
    ).populate('employees'); 


    if (!updateTeam) {
        throw new ApiError(400, "Invalid team credentials.")
    }

    return res.status(201).json(new ApiResponse(201, newEmployee, "Employee created successfully."));
})

export const getActiveData = asyncHandler(async (req, res) => {

    const companyId = req.user?.companyId || "66bdec36e1877685a60200ac"

    const filters = { companyId: companyId, status: 1 }

    const clients = await Employee.find(filters)
    .populate({path: "supervisor", select: "_id name avatar"})

    return res.status(201).json(new ApiResponse(200, clients, "Employee retrieved successfully."))
})


export const getInactiveData = asyncHandler(async (req, res) => {


    const companyId = req.user?.companyId || "66bdec36e1877685a60200ac"

    const filters = { companyId: companyId, status: 0 }

    const clients = await Employee.find(filters).select("-__v")

    return res.status(201).json(new ApiResponse(200, clients, "Employee retrieved successfully."))
})

export const getCountData = asyncHandler(async (req, res) => {

    const companyId = req.user?.companyId || "66bdec36e1877685a60200ac";

    const employees = await Employee.aggregate([
        {
            $match: {
                companyId: { $eq: objectId(companyId) }
            }
        },
        {
            $group: {
                _id: "$status",
                count: { $sum: 1 }
            }
        }
    ]);

    let active = 0;
    let inactive = 0;

    if (employees) {
        employees.forEach(row => {

            if (row._id === 1) {
                active = row.count
            }

            if (row._id === 0) {
                inactive = row.count
            }
        })
    }

    return res.status(201).json(new ApiResponse(200, { active, inactive }, "Employee retrieved successfully."))
})

export const getData = asyncHandler(async (req, res) => {

    const companyId = req.user?.companyId || "66bdec36e1877685a60200ac"

    const filters = { companyId: companyId, _id: req.params.id }

    const employee = await Employee.findOne(filters).populate({path: "supervisor", select: "_id name email mobile avatar"})

    if (!employee) {
        throw new ApiError(400, "Employee not found")
    }

    return res.status(200).json(new ApiResponse(200, employee, "Employee retrieved successfully"));
})

export const updateData = asyncHandler(async (req, res) => {

    const companyId = req.user?.companyId || "66bdec36e1877685a60200ac"

    const filters = { companyId: companyId, _id: req.params.id }

    const employeeInfo = await Employee.findOne(filters)

    if (!employeeInfo) {
        throw new ApiError(404, "Employee not found");
    }

    const data = req.body;

    if (req.file && req.file?.path) {
        const uploadAvatar = await uploadOnCloudinary(req.file?.path)
        data.avatar = uploadAvatar?.url || ""

        if (employeeInfo && employeeInfo.avatar) {
            await destroyOnCloudinary(employeeInfo.avatar);
        }
    }

    const employee = await Employee.findOneAndUpdate(
        filters,
        data,
        { new: true }
    );

    return res.status(200).json(new ApiResponse(200, employee, "Employee updated successfully."));
})


export const updateOffboarding = asyncHandler(async (req, res) => {

    const companyId = req.user?.companyId || "66bdec36e1877685a60200ac"

    const filters = { companyId: companyId, _id: req.params.id }

    const employeeInfo = await Employee.findOne(filters)
    
    if (!employeeInfo) {
        throw new ApiError(404, "Employee not found");
    }

    const data = req.body;

    if(!data?.offboardingDate){
        throw new ApiError(404, "Offboardin date is required");
    }

    if(!data?.offboardingType){
        throw new ApiError(404, "Offboardin type is required");
    }

    if(!data?.reason){
        throw new ApiError(404, "Reason is required");
    }
    
    data.status = 0

    const employee = await Employee.findOneAndUpdate(
        filters,
        data,
        { new: true }
    );


    return res.status(200).json(new ApiResponse(200, employee, "Employee updated successfully."));
})

export const deleteData = asyncHandler(async (req, res) => {

    const companyId = req.user?.companyId || "66bdec36e1877685a60200ac"

    const filters = { companyId: companyId, _id: req.params.id }

    const info = await Employee.findOne(filters)

    if (!info) {
        throw new ApiError(404, "Employee not found!")
    }

    let employee
    if (info.status === 0) {
        employee = await Employee.findByIdAndUpdate(info._id, { status: 1 }, { new: true });
    } else {
        employee = await Employee.findByIdAndUpdate(info._id, { status: 0 }, { new: true });
    }

    return res.status(200).json(new ApiResponse(200, employee, "Employee status update successfully."));
})

