import React, { useRef } from "react";
import { Input } from "./input";
import { Label } from "./label";
import { formatState, formatZipCode } from "@/hooks/useFormValidation";

export interface AddressData {
  street: string;
  city: string;
  state: string;
  zip: string;
}

interface AddressInputProps {
  label: string;
  idBase?: string; // optional stable id prefix for inputs
  value: AddressData;
  onChange: (address: AddressData) => void;
  required?: boolean;
  className?: string;
}

export const AddressInput: React.FC<AddressInputProps> = ({
  label,
  idBase,
  value,
  onChange,
  required = false,
  className = "",
}) => {
  const streetInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const idPrefix = React.useMemo(() => {
    if (idBase && idBase.trim().length > 0) return idBase.trim().toLowerCase();
    const slug = (label || "address")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    return slug || "address";
  }, [idBase, label]);
  const handleFieldChange = (field: keyof AddressData, fieldValue: string) => {
    const newAddress = {
      ...value,
      [field]: fieldValue,
    };
    console.log(`Address field '${field}' changed to '${fieldValue}'. Full address:`, newAddress);
    onChange(newAddress);
  };

  const handleFieldChangeWithFormat = (
    field: keyof AddressData,
    fieldValue: string,
  ) => {
    let processedValue = fieldValue;

    if (field === "state") {
      processedValue = formatState(fieldValue);
    } else if (field === "zip") {
      processedValue = formatZipCode(fieldValue);
    }

    handleFieldChange(field, processedValue);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <Label
        htmlFor={`${idPrefix}-street`}
        className="text-white text-lg font-semibold"
      >
        {label} {required && "*"}
      </Label>

      {/* Street Address - Full Width */}
      <Input
        ref={streetInputRef}
        id={`${idPrefix}-street`}
        name={`${idPrefix}_street`}
        value={value.street}
        onChange={(e) => handleFieldChange("street", e.target.value)}
        placeholder="123 Main Street"
        required={required}
        className="bg-neutral-800/60 border-2 border-white/25 text-white placeholder:text-white/40 text-lg h-14 rounded-xl"
      />

      {/* City, State, ZIP - Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-1">
          <Input
            id={`${idPrefix}-city`}
            name={`${idPrefix}_city`}
            value={value.city}
            onChange={(e) => handleFieldChange("city", e.target.value)}
            placeholder="City"
            aria-label="City"
            required={required}
            className="bg-neutral-800/60 border-2 border-white/25 text-white placeholder:text-white/40 text-lg h-14 rounded-xl"
          />
        </div>

        <div>
          <Input
            id={`${idPrefix}-state`}
            name={`${idPrefix}_state`}
            value={value.state}
            onChange={(e) =>
              handleFieldChangeWithFormat("state", e.target.value)
            }
            placeholder="State"
            maxLength={2}
            aria-label="State"
            required={required}
            className="uppercase bg-neutral-800/60 border-2 border-white/25 text-white placeholder:text-white/40 text-lg h-14 rounded-xl"
          />
        </div>

        <div>
          <Input
            id={`${idPrefix}-zip`}
            name={`${idPrefix}_zip`}
            value={value.zip}
            onChange={(e) => handleFieldChangeWithFormat("zip", e.target.value)}
            placeholder="ZIP Code"
            maxLength={10}
            aria-label="ZIP Code"
            required={required}
            className="bg-neutral-800/60 border-2 border-white/25 text-white placeholder:text-white/40 text-lg h-14 rounded-xl"
          />
        </div>
      </div>
    </div>
  );
};

// Utility function to convert AddressData to string
export const addressToString = (address: AddressData): string => {
  const parts = [
    address.street,
    address.city,
    address.state,
    address.zip,
  ].filter(Boolean);
  return parts.join(", ");
};

// Utility function to parse address string to AddressData (basic implementation)
export const stringToAddress = (addressString: string): AddressData => {
  const parts = addressString.split(",").map((part) => part.trim());

  return {
    street: parts[0] || "",
    city: parts[1] || "",
    state: parts[2]?.split(" ")[0] || "",
    zip: parts[2]?.split(" ")[1] || "",
  };
};
