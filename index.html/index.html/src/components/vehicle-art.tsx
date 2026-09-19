import { pickVehicleImage } from "@/lib/vehicles";

export function VehicleArt({
  make,
  model,
  vehiclePhoto,
  color,
  className = "",
  imgClassName = "",
  alt = "",
  photoSlot,
}: {
  make?: string;
  model?: string;
  vehiclePhoto?: string;
  color?: string;
  className?: string;
  imgClassName?: string;
  alt?: string;
  photoSlot?: string;
}) {
  const picked = pickVehicleImage({ make, model, vehiclePhoto, color });
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      data-vehicle-art={picked.kind}
      data-vehicle-photo-source={picked.fromCustomer ? "customer" : "generic"}
    >
      <img
        src={picked.src}
        alt={alt}
        decoding="async"
        className={`h-full w-full object-cover [image-rendering:auto] ${imgClassName}`}
        data-ticket-photo={photoSlot}
      />
      {picked.tint ? (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0"
          data-vehicle-tint={picked.tint.hex}
          style={{
            backgroundColor: picked.tint.hex,
            mixBlendMode: picked.tint.blend,
            opacity: picked.tint.opacity,
          }}
        />
      ) : null}
    </div>
  );
}
