import mongoose from "mongoose";
import Document from "../models/DocumentModel.js";
import Land from "../models/LandModel.js";
import cloudinary from "../config/cloudinary.js";


// CLOUDINARY STREAM UPLOAD HELPER

const uploadToCloudinary = (fileBuffer, resourceType) => {
    return new Promise((resolve, reject) => {
        if (!fileBuffer) {
            return reject(new Error("File buffer is empty."));
        }

        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: "land_documents",
                resource_type: resourceType,
            },
            (error, result) => {
                if (error) {
                    return reject(error);
                }

                resolve(result);
            }
        );

        uploadStream.end(fileBuffer);
    });
};


// CREATE DOCUMENT

export const createDocument = async (req, res) => {
    try {
        const { land, documentType, fileName } = req.body;

        
        //Validate land ID
        
        if (!land) {
            return res.status(400).json({
                success: false,
                message: "Land ID is required.",
            });
        }

        if (!mongoose.Types.ObjectId.isValid(land)) {
            return res.status(400).json({
                success: false,
                message: "Invalid land ID structure.",
            });
        }

        
        //Validate document type
        
        if (!documentType) {
            return res.status(400).json({
                success: false,
                message: "Document type is required.",
            });
        }

    
        //Validate uploaded file
        
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message:
                    "No document file detected. Please upload a PDF or Word document.",
            });
        }

        
        //Validate file type
        
        const allowedMimeTypes = [
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ];

        if (!allowedMimeTypes.includes(req.file.mimetype)) {
            return res.status(400).json({
                success: false,
                message: "Only PDF, DOC, and DOCX files are allowed.",
            });
        }

        
        //Check whether land exists
        
        const existingLand = await Land.findById(land);

        if (!existingLand) {
            return res.status(404).json({
                success: false,
                message: "Target land asset record not found.",
            });
        }

        
        //Check authenticated user
        
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
        }

        const uploadedBy = req.user.id || req.user._id;

        if (!uploadedBy) {
            return res.status(401).json({
                success: false,
                message: "Authenticated user ID not found.",
            });
        }

        
        //Determine Cloudinary resource type
        
        const isPdf = req.file.mimetype === "application/pdf";

        const resourceType = isPdf ? "image" : "raw";

        
        //Upload document to Cloudinary
        
        const cloudinaryResult = await uploadToCloudinary(
            req.file.buffer,
            resourceType
        );

        if (!cloudinaryResult || !cloudinaryResult.secure_url) {
            return res.status(500).json({
                success: false,
                message: "File upload to Cloudinary failed.",
            });
        }

        
        //Create document record
        
        const document = await Document.create({
            land: land,
            uploadedBy: uploadedBy,
            documentType: documentType,
            fileName: fileName || req.file.originalname,
            fileUrl: cloudinaryResult.secure_url,
            publicId: cloudinaryResult.public_id,
        });

        
        // IMPORTANT:
        // Add created document ID to Land.documents
        
        await Land.findByIdAndUpdate(
            land,
            {
                $addToSet: {
                    documents: document._id,
                },
            },
            {
                new: true,
                runValidators: true,
            }
        );

        
        //Get updated/populated document
        
        const populatedDocument = await Document.findById(document._id)
            .populate("land")
            .populate("uploadedBy", "fullName email phone role");

        
        //Return response
        
        return res.status(201).json({
            success: true,
            message: "Document uploaded and registered successfully.",
            document: populatedDocument,
        });
    } catch (error) {
        console.error("Create Document Error:", error);

        return res.status(500).json({
            success: false,
            message: error.message || "Failed to create document.",
        });
    }
};


// GET ALL DOCUMENTS
export const getAllDocuments = async (req, res) => {
    try {
        const documents = await Document.find()
            .populate("land")
            .populate("uploadedBy", "fullName email phone role")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: documents.length,
            documents,
        });
    } catch (error) {
        console.error("Get Documents Error:", error);

        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch documents.",
        });
    }
};


// GET DOCUMENT BY ID
export const getDocumentById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid document ID.",
            });
        }

        const document = await Document.findById(id)
            .populate("land")
            .populate("uploadedBy", "fullName email phone role");

        if (!document) {
            return res.status(404).json({
                success: false,
                message: "Document not found.",
            });
        }

        return res.status(200).json({
            success: true,
            document,
        });
    } catch (error) {
        console.error("Get Document Error:", error);

        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch document.",
        });
    }
};


// GET DOCUMENTS BY LAND
export const getDocumentsByLand = async (req, res) => {
    try {
        const { landId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(landId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid land ID.",
            });
        }

        const documents = await Document.find({
            land: landId,
        })
            .populate("land")
            .populate("uploadedBy", "fullName email phone role")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: documents.length,
            documents,
        });
    } catch (error) {
        console.error("Get Land Documents Error:", error);

        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch land documents.",
        });
    }
};


// UPDATE DOCUMENT
export const updateDocument = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid document ID.",
            });
        }

        const document = await Document.findById(id);

        if (!document) {
            return res.status(404).json({
                success: false,
                message: "Document not found.",
            });
        }

        const allowedFields = [
            "documentType",
            "fileName",
        ];

        const updateData = {};

        allowedFields.forEach((field) => {
            if (req.body[field] !== undefined) {
                updateData[field] = req.body[field];
            }
        });

        const updatedDocument = await Document.findByIdAndUpdate(
            id,
            updateData,
            {
                new: true,
                runValidators: true,
            }
        )
            .populate("land")
            .populate("uploadedBy", "fullName email phone role");

        return res.status(200).json({
            success: true,
            message: "Document updated successfully.",
            document: updatedDocument,
        });
    } catch (error) {
        console.error("Update Document Error:", error);

        return res.status(500).json({
            success: false,
            message: error.message || "Failed to update document.",
        });
    }
};


// DELETE DOCUMENT
export const deleteDocument = async (req, res) => {
    try {
        const { id } = req.params;

        
        //Validate document ID
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid document ID.",
            });
        }

        
        //Find document
        
        const document = await Document.findById(id);

        if (!document) {
            return res.status(404).json({
                success: false,
                message: "Document not found.",
            });
        }

        
        //Delete file from Cloudinary
        
        if (document.publicId) {
            try {
                const isPdf =
                    document.fileName?.toLowerCase().endsWith(".pdf") ||
                    document.fileUrl?.toLowerCase().includes(".pdf");

                const resourceType = isPdf ? "image" : "raw";

                await cloudinary.uploader.destroy(document.publicId, {
                    resource_type: resourceType,
                });
            } catch (cloudinaryError) {
                console.error(
                    "Cloudinary Delete Error:",
                    cloudinaryError
                );

                // Continue deleting MongoDB record
                // even if Cloudinary deletion fails.
            }
        }

        
        //Remove document ID from Land.documents
        
        if (document.land) {
            await Land.findByIdAndUpdate(
                document.land,
                {
                    $pull: {
                        documents: document._id,
                    },
                },
                {
                    new: true,
                }
            );
        }

        
        //Delete document from Document collection
        
        await Document.findByIdAndDelete(id);

        //Return response

        return res.status(200).json({
            success: true,
            message:
                "Document and associated Cloudinary asset deleted successfully.",
        });
    } catch (error) {
        console.error("Delete Document Error:", error);

        return res.status(500).json({
            success: false,
            message: error.message || "Failed to delete document.",
        });
    }
};

// APPROVE DOCUMENT
export const approveDocument = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid document ID.",
            });
        }

        const document = await Document.findById(id);

        if (!document) {
            return res.status(404).json({
                success: false,
                message: "Document not found.",
            });
        }

        document.status = "Approved";
        document.rejectionReason = "";

        await document.save();

        const populatedDocument = await Document.findById(document._id)
            .populate("land")
            .populate("uploadedBy", "fullName email phone role");

        return res.status(200).json({
            success: true,
            message: "Document approved successfully.",
            document: populatedDocument,
        });
    } catch (error) {
        console.error("Approve Document Error:", error);

        return res.status(500).json({
            success: false,
            message: error.message || "Failed to approve document.",
        });
    }
};

// REJECT DOCUMENT
export const rejectDocument = async (req, res) => {
    try {
        const { id } = req.params;
        const { rejectionReason } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid document ID.",
            });
        }

        if (!rejectionReason || !rejectionReason.trim()) {
            return res.status(400).json({
                success: false,
                message: "Rejection reason is required.",
            });
        }

        const document = await Document.findById(id);

        if (!document) {
            return res.status(404).json({
                success: false,
                message: "Document not found.",
            });
        }

        document.status = "Rejected";
        document.rejectionReason = rejectionReason.trim();

        await document.save();

        const populatedDocument = await Document.findById(document._id)
            .populate("land")
            .populate("uploadedBy", "fullName email phone role");

        return res.status(200).json({
            success: true,
            message: "Document rejected successfully.",
            document: populatedDocument,
        });
    } catch (error) {
        console.error("Reject Document Error:", error);

        return res.status(500).json({
            success: false,
            message: error.message || "Failed to reject document.",
        });
    }
};