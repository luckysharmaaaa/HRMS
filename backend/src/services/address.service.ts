import { ResultSetHeader } from "mysql2";
import { PoolConnection } from "mysql2/promise";

/**
 * ==========================================================
 * Address Service
 * ==========================================================
 * This service is responsible ONLY for inserting address_info
 * records. It is designed to be reusable across modules such as:
 *
 *   - User
 *   - Employee
 *   - Company
 *   - Branch
 *   - Vendor
 *   - Client
 *   - Department
 *
 * IMPORTANT
 * - This service does NOT begin, commit, or rollback transactions.
 * - The caller (controller) owns the transaction and must pass in
 *   the active connection.
 * - This service only throws errors; it never swallows them.
 */

interface AddressInput {
  addressType?: string | null;
  houseNumber?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  landmark?: string | null;
  locality?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  countryID?: number | null;
  countryCode?: string | null;
  phoneCode?: string | null;
  phone?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  isDefault?: boolean | number | null;
}

interface CreateAddressInput {
  ownerType: string;
  ownerID: number;
  createdBy?: number | null;
  address?: AddressInput;
  fullName?: string | null;
}

/**
 * ==========================================================
 * createAddress
 * ==========================================================
 * Inserts a single row into address_info for the given owner.
 *
 * NOTE: If isDefault is true, this will first unset any existing
 * default address for the same ownerType + ownerID, matching the
 * behaviour of the standalone Address API (address.controller.ts),
 * so both callers stay consistent with "only one default address"
 * per owner.
 *
 * @param connection - Active MySQL transaction connection (from pool)
 * @param data - Address payload
 */
export const createAddress = async (
  connection: PoolConnection,
  data: CreateAddressInput,
): Promise<number> => {
  const { ownerType, ownerID, createdBy, address = {}, fullName } = data;

  if (!ownerType || !ownerID) {
    throw new Error("ownerType and ownerID are required to create address");
  }

  const {
    addressType,
    houseNumber,
    addressLine1,
    addressLine2,
    landmark,
    locality,
    city,
    state,
    zipCode,
    countryID,
    countryCode,
    phoneCode,
    phone,
    latitude,
    longitude,
    isDefault,
  } = address;

  // addressType is NOT NULL in the database (default 'home'),
  // so fall back to 'home' when the caller doesn't provide one
  // (e.g. User creation, which may not collect a full address form).
  const resolvedAddressType = addressType ?? "home";

  const isDefaultFlag = isDefault ? 1 : 0;

  // =========================
  // Only One Default Address
  // =========================
  if (isDefaultFlag === 1) {
    await connection.query(
      `
        UPDATE address_info
        SET isDefault = 0
        WHERE ownerType = ?
        AND ownerID = ?
        `,
      [ownerType, ownerID],
    );
  }

  const createdOn = Math.floor(Date.now() / 1000);

  const [result] = await connection.query<ResultSetHeader>(
    `
      INSERT INTO address_info
      (
        ownerType,
        ownerID,
        fullName,
        addressType,
        houseNumber,
        addressLine1,
        addressLine2,
        landmark,
        locality,
        city,
        state,
        zipCode,
        countryID,
        countryCode,
        phoneCode,
        phone,
        latitude,
        longitude,
        isDefault,
        createdOn,
        createdBy
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
    [
      ownerType,
      ownerID,
      fullName ?? null,
      resolvedAddressType,
      houseNumber ?? null,
      addressLine1 ?? null,
      addressLine2 ?? null,
      landmark ?? null,
      locality ?? null,
      city ?? null,
      state ?? null,
      zipCode ?? null,
      countryID ?? null,
      countryCode ?? null,
      phoneCode ?? null,
      phone ?? null,
      latitude ?? null,
      longitude ?? null,
      isDefaultFlag,
      createdOn,
      createdBy ?? null,
    ],
  );

  if (result.affectedRows === 0) {
    throw new Error("Failed to create address");
  }

  return result.insertId;
};