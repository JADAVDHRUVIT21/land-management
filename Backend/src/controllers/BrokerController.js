import User from "../models/UserModels.js";
import Land from "../models/LandModel.js";
import BrokerContact from "../models/BrokerContactModel.js";

const getBrokerLands = async (req, res) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message:
                    "Authentication required.",
            });
        }

        const savedContacts =
            await BrokerContact.find({
                broker: userId,
            }).select(
                "contact contactType notes"
            );

        const savedContactIds =
            savedContacts.map(
                (item) => item.contact
            );

        const allLands =
            await Land.find({
                isForSale: true,
                listingType: {
                    $in: [
                        "For Sale",
                        "Wanted to Buy",
                    ],
                },
            })
                .populate(
                    "owner",
                    "fullName email phone role"
                )
                .sort({
                    createdAt: -1,
                });

        const forSale =
            allLands.filter(
                (land) =>
                    land.listingType ===
                    "For Sale"
            );

        const wantedToBuy =
            allLands.filter(
                (land) =>
                    land.listingType ===
                    "Wanted to Buy"
            );

        const savedContactListings =
            allLands
                .filter((land) => {
                    if (!land.owner) {
                        return false;
                    }

                    return savedContactIds.some(
                        (contactId) =>
                            contactId.toString() ===
                            land.owner._id.toString()
                    );
                })
                .map((land) => {
                    const savedContact =
                        savedContacts.find(
                            (contact) =>
                                contact.contact
                                    .toString() ===
                                land.owner._id.toString()
                        );

                    return {
                        ...land.toObject(),

                        savedContactType:
                            savedContact
                                ?.contactType ||
                            null,

                        savedContactNotes:
                            savedContact
                                ?.notes ||
                            "",
                    };
                });

        return res.status(200).json({
            success: true,

            count: allLands.length,

            lands: allLands,

            forSale: {
                count: forSale.length,
                lands: forSale,
            },

            wantedToBuy: {
                count:
                    wantedToBuy.length,
                lands: wantedToBuy,
            },

            savedContactListings: {
                count:
                    savedContactListings.length,
                lands:
                    savedContactListings,
            },
        });
    } catch (error) {
        console.error(
            "Get Broker Lands Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Internal server error.",
        });
    }
};

const getBrokerContacts = async ( req, res ) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message:
                    "Authentication required.",
            });
        }

        const contacts =
            await BrokerContact.find({
                broker: userId,
            })
                .populate(
                    "contact",
                    "fullName email phone role"
                )
                .sort({
                    createdAt: -1,
                });

        return res.status(200).json({
            success: true,
            count: contacts.length,
            contacts,
        });
    } catch (error) {
        console.error(
            "Get Broker Contacts Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Internal server error.",
        });
    }
};

const saveBrokerContact = async ( req, res ) => {
    try {
        const userId = req.user?.id;

        const {
            contactId,
            contactType,
            notes,
        } = req.body;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message:
                    "Authentication required.",
            });
        }

        if (
            !contactId ||
            !contactType
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Contact ID and contact type are required.",
            });
        }

        if (
            ![
                "seller",
                "buyer",
            ].includes(contactType)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Contact type must be seller or buyer.",
            });
        }

        if (
            userId.toString() ===
            contactId.toString()
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "You cannot save your own profile.",
            });
        }

        const contact =
            await User.findById(
                contactId
            );

        if (!contact) {
            return res.status(404).json({
                success: false,
                message:
                    "Contact user not found.",
            });
        }

        if (
            contact.role !== "user"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Only normal user profiles can be saved.",
            });
        }

        const existingContact =
            await BrokerContact.findOne({
                broker: userId,
                contact: contactId,
            });

        if (existingContact) {
            return res.status(400).json({
                success: false,
                message:
                    "This profile is already saved.",
            });
        }

        const savedContact =
            await BrokerContact.create({
                broker: userId,
                contact: contactId,
                contactType,
                notes:
                    typeof notes ===
                        "string"
                        ? notes.trim()
                        : "",
            });

        const populatedContact =
            await BrokerContact.findById(
                savedContact._id
            ).populate(
                "contact",
                "fullName email phone role"
            );

        return res.status(201).json({
            success: true,
            message:
                "Profile saved successfully.",
            contact:
                populatedContact,
        });
    } catch (error) {
        console.error(
            "Save Broker Contact Error:",
            error
        );

        if (
            error.code === 11000
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "This profile is already saved.",
            });
        }

        return res.status(500).json({
            success: false,
            message:
                "Internal server error.",
        });
    }
};

const deleteBrokerContact = async ( req, res ) => {
    try {
        const userId = req.user?.id;
        const { contactId } =
            req.params;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message:
                    "Authentication required.",
            });
        }

        if (!contactId) {
            return res.status(400).json({
                success: false,
                message:
                    "Contact ID is required.",
            });
        }

        const contact =
            await BrokerContact.findOne({
                broker: userId,
                contact: contactId,
            });

        if (!contact) {
            return res.status(404).json({
                success: false,
                message:
                    "Saved contact not found.",
            });
        }

        await BrokerContact.findByIdAndDelete(
            contact._id
        );

        return res.status(200).json({
            success: true,
            message:
                "Contact removed successfully.",
        });
    } catch (error) {
        console.error(
            "Delete Broker Contact Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Internal server error.",
        });
    }
};

export { getBrokerLands, getBrokerContacts, saveBrokerContact, deleteBrokerContact, };