interface ProfilePhotoProps {
  photoUrl?: string | null;
  driverName?: string;
}

export function ProfilePhoto({ photoUrl, driverName }: ProfilePhotoProps) {
  const initials =
    driverName
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "D";

  return (
    <div className="flex flex-col items-start space-y-4">
      <div className="relative mx-0">
        <div className="w-40 h-40 rounded-full overflow-hidden border-2 border-white/20 flex items-center justify-center mx-0 my-0 py-0 bg-[#393939]/10">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-4xl font-bold text-white">{initials}</span>
          )}
        </div>
      </div>

      {driverName && (
        <div className="text-center">
          <h3 className="text-lg font-semibold text-white">{driverName}</h3>
        </div>
      )}
    </div>
  );
}
