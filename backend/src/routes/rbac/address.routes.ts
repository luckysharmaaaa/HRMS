import { Router } from "express";
import {
  createAddress,
  getAddressByOwner,
  getAddressById,
  updateAddress,
  deleteAddress,
} from "../../controllers/rbac/address.controller";

const router = Router();

router.post("/", createAddress);
router.get("/:id", getAddressById);
router.get("/:ownerType/:ownerId", getAddressByOwner);
router.put("/:id", updateAddress);
router.delete("/:id", deleteAddress);

export default router;