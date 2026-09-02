import mongoose from "mongoose";
import Document from "../models/DocumentModel.js";
import Land from "../models/LandModel.js";
import User from "../models/UserModels.js";
import cloudinary from "../config/cloudinary.js";

const populateDocument = (query) => {
    return query
        .populate("land")
        .populate(
            "uploadedBy",
            "fullName email phone role"
        );
};

const uploadToCloudinary = (fileBuffer, resourceType) => {
    return new Promise((resolve, reject) => {
        if (!fileBuffer) {
            return reject(
                new Error("File buffer is empty.")
            );
        }

        const uploadStream =
            cloudinary.uploader.upload_stream(
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

const createDocument = async (req, res) => {
    try {
        const {
            land,
            documentType,
            fileName,
        } = req.body;

        const userId =
            req.user?.id || req.user?._id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
        }

        if (!land) {
            return res.status(400).json({
                success: false,
                message: "Land ID is required.",
            });
        }

        if (
            !mongoose.Types.ObjectId.isValid(land)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid land ID.",
            });
        }

        if (!documentType) {
            return res.status(400).json({
                success: false,
                message:
                    "Document type is required.",
            });
        }

        const allowedDocumentTypes = [
            "Ownership Proof",
            "Sale Deed",
            "Land Certificate",
            "Identity Proof",
            "Tax Receipt",
            "Other",
        ];

        if (
            !allowedDocumentTypes.includes(
                documentType
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid document type.",
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message:
                    "Document file is required.",
            });
        }

        const allowedMimeTypes = [
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ];

        if (
            !allowedMimeTypes.includes(
                req.file.mimetype
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Only PDF, DOC, and DOCX files are allowed.",
            });
        }

        const existingLand =
            await Land.findById(land);

        if (!existingLand) {
            return res.status(404).json({
                success: false,
                message: "Land not found.",
            });
        }

        const user =
            await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found.",
            });
        }

        if (
            user.role !== "admin" &&
            (
                !existingLand.owner ||
                existingLand.owner.toString() !==
                userId.toString()
            )
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "You can upload documents only for your own land.",
            });
        }

        const isPdf =
            req.file.mimetype ===
            "application/pdf";

        const resourceType = isPdf
            ? "image"
            : "raw";

        const cloudinaryResult =
            await uploadToCloudinary(
                req.file.buffer,
                resourceType
            );

        if (
            !cloudinaryResult ||
            !cloudinaryResult.secure_url
        ) {
            return res.status(500).json({
                success: false,
                message:
                    "File upload to Cloudinary failed.",
            });
        }

        const document =
            await Document.create({
                land: existingLand._id,
                uploadedBy: userId,
                documentType,
                fileName:
                    fileName?.trim() ||
                    req.file.originalname,
                fileUrl:
                    cloudinaryResult.secure_url,
                publicId:
                    cloudinaryResult.public_id,
                status: "Pending",
                rejectionReason: "",
            });

        await Land.findByIdAndUpdate(
            existingLand._id,
            {
                $addToSet: {
                    documents: document._id,
                },
            }
        );

        const populatedDocument =
            await populateDocument(
                Document.findById(
                    document._id
                )
            );

        return res.status(201).json({
            success: true,
            message:
                "Document uploaded successfully.",
            document: populatedDocument,
        });
    } catch (error) {
        console.error(
            "Create Document Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Failed to upload document.",
        });
    }
};

const getAllDocuments = async (req, res) => {
    try {
        const documents =
            await populateDocument(
                Document.find().sort({
                    createdAt: -1,
                })
            );

        return res.status(200).json({
            success: true,
            count: documents.length,
            documents,
        });
    } catch (error) {
        console.error(
            "Get All Documents Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Failed to fetch documents.",
        });
    }
};

const getDocumentById = async (req, res) => {
    try {
        const { id } = req.params;

        if (
            !mongoose.Types.ObjectId.isValid(id)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid document ID.",
            });
        }

        const document =
            await populateDocument(
                Document.findById(id)
            );

        if (!document) {
            return res.status(404).json({
                success: false,
                message:
                    "Document not found.",
            });
        }

        return res.status(200).json({
            success: true,
            document,
        });
    } catch (error) {
        console.error(
            "Get Document Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Failed to fetch document.",
        });
    }
};

const getDocumentsByLand = async (
    req,
    res
) => {
    try {
        const { landId } = req.params;

        if (
            !mongoose.Types.ObjectId.isValid(
                landId
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid land ID.",
            });
        }

        const existingLand =
            await Land.findById(landId);

        if (!existingLand) {
            return res.status(404).json({
                success: false,
                message: "Land not found.",
            });
        }

        const documents =
            await populateDocument(
                Document.find({
                    land: landId,
                }).sort({
                    createdAt: -1,
                })
            );

        return res.status(200).json({
            success: true,
            count: documents.length,
            documents,
        });
    } catch (error) {
        console.error(
            "Get Land Documents Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Failed to fetch land documents.",
        });
    }
};

const getMyDocuments = async (
    req,
    res
) => {
    try {
        const userId =
            req.user?.id || req.user?._id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message:
                    "Authentication required.",
            });
        }

        const documents =
            await populateDocument(
                Document.find({
                    uploadedBy: userId,
                }).sort({
                    createdAt: -1,
                })
            );

        return res.status(200).json({
            success: true,
            count: documents.length,
            documents,
        });
    } catch (error) {
        console.error(
            "Get My Documents Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Failed to fetch your documents.",
        });
    }
};

const updateDocument = async (
    req,
    res
) => {
    try {
        const { id } = req.params;

        const userId =
            req.user?.id || req.user?._id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message:
                    "Authentication required.",
            });
        }

        if (
            !mongoose.Types.ObjectId.isValid(id)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid document ID.",
            });
        }

        const document =
            await Document.findById(id);

        if (!document) {
            return res.status(404).json({
                success: false,
                message:
                    "Document not found.",
            });
        }

        const isAdmin =
            req.user.role === "admin";

        const isOwner =
            document.uploadedBy.toString() ===
            userId.toString();

        if (!isAdmin && !isOwner) {
            return res.status(403).json({
                success: false,
                message:
                    "You are not allowed to update this document.",
            });
        }

        const {
            documentType,
            fileName,
        } = req.body;

        if (documentType !== undefined) {
            const allowedDocumentTypes = [
                "Ownership Proof",
                "Sale Deed",
                "Land Certificate",
                "Identity Proof",
                "Tax Receipt",
                "Other",
            ];

            if (
                !allowedDocumentTypes.includes(
                    documentType
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid document type.",
                });
            }

            document.documentType =
                documentType;
        }

        if (fileName !== undefined) {
            if (!fileName.trim()) {
                return res.status(400).json({
                    success: false,
                    message:
                        "File name cannot be empty.",
                });
            }

            document.fileName =
                fileName.trim();
        }

        if (
            !documentType &&
            fileName === undefined
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "No valid fields provided for update.",
            });
        }

        if (
            !isAdmin &&
            document.status !== "Pending"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Only pending documents can be updated.",
            });
        }

        await document.save();

        const updatedDocument =
            await populateDocument(
                Document.findById(id)
            );

        return res.status(200).json({
            success: true,
            message:
                "Document updated successfully.",
            document: updatedDocument,
        });
    } catch (error) {
        console.error(
            "Update Document Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Failed to update document.",
        });
    }
};

const deleteDocument = async (
    req,
    res
) => {
    try {
        const { id } = req.params;

        const userId =
            req.user?.id || req.user?._id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message:
                    "Authentication required.",
            });
        }

        if (
            !mongoose.Types.ObjectId.isValid(id)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid document ID.",
            });
        }

        const document =
            await Document.findById(id);

        if (!document) {
            return res.status(404).json({
                success: false,
                message:
                    "Document not found.",
            });
        }

        const isAdmin =
            req.user.role === "admin";

        const isOwner =
            document.uploadedBy.toString() ===
            userId.toString();

        if (!isAdmin && !isOwner) {
            return res.status(403).json({
                success: false,
                message:
                    "You are not allowed to delete this document.",
            });
        }

        if (
            !isAdmin &&
            document.status === "Approved"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Approved documents cannot be deleted by users.",
            });
        }

        if (document.publicId) {
            try {
                const isPdf =
                    document.fileName
                        ?.toLowerCase()
                        .endsWith(".pdf");

                await cloudinary.uploader.destroy(
                    document.publicId,
                    {
                        resource_type:
                            isPdf
                                ? "image"
                                : "raw",
                    }
                );
            } catch (cloudinaryError) {
                console.error(
                    "Cloudinary Delete Error:",
                    cloudinaryError.message
                );
            }
        }

        if (document.land) {
            await Land.findByIdAndUpdate(
                document.land,
                {
                    $pull: {
                        documents:
                            document._id,
                    },
                }
            );
        }

        await Document.findByIdAndDelete(
            id
        );

        return res.status(200).json({
            success: true,
            message:
                "Document deleted successfully.",
        });
    } catch (error) {
        console.error(
            "Delete Document Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Failed to delete document.",
        });
    }
};

const approveDocument = async (
    req,
    res
) => {
    try {
        const { id } = req.params;

        if (
            !mongoose.Types.ObjectId.isValid(id)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid document ID.",
            });
        }

        const document =
            await Document.findById(id);

        if (!document) {
            return res.status(404).json({
                success: false,
                message:
                    "Document not found.",
            });
        }

        if (document.status !== "Pending") {
            return res.status(400).json({
                success: false,
                message:
                    `Document is already ${document.status}.`,
            });
        }

        document.status = "Approved";
        document.rejectionReason = "";

        await document.save();

        const populatedDocument =
            await populateDocument(
                Document.findById(id)
            );

        return res.status(200).json({
            success: true,
            message:
                "Document approved successfully.",
            document:
                populatedDocument,
        });
    } catch (error) {
        console.error(
            "Approve Document Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Failed to approve document.",
        });
    }
};

const rejectDocument = async (
    req,
    res
) => {
    try {
        const { id } = req.params;
        const { rejectionReason } =
            req.body;

        if (
            !mongoose.Types.ObjectId.isValid(id)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid document ID.",
            });
        }

        if (
            !rejectionReason ||
            !rejectionReason.trim()
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Rejection reason is required.",
            });
        }

        const document =
            await Document.findById(id);

        if (!document) {
            return res.status(404).json({
                success: false,
                message:
                    "Document not found.",
            });
        }

        if (document.status !== "Pending") {
            return res.status(400).json({
                success: false,
                message:
                    `Document is already ${document.status}.`,
            });
        }

        document.status = "Rejected";
        document.rejectionReason =
            rejectionReason.trim();

        await document.save();

        const populatedDocument =
            await populateDocument(
                Document.findById(id)
            );

        return res.status(200).json({
            success: true,
            message:
                "Document rejected successfully.",
            document:
                populatedDocument,
        });
    } catch (error) {
        console.error(
            "Reject Document Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Failed to reject document.",
        });
    }
};

export { createDocument, getAllDocuments, getMyDocuments, getDocumentById, getDocumentsByLand, updateDocument, deleteDocument, approveDocument,rejectDocument, };