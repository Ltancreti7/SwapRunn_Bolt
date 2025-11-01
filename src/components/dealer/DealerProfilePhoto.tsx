interface DealerProfilePhotoProps {
  photoUrl?: string | null;
  dealerName?: string;
}

export function DealerProfilePhoto({
  photoUrl,
  dealerName,
}: DealerProfilePhotoProps) {
  const initials =
    dealerName
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "D";

  return (
    <div className="relative">
      <div className="w-52 h-52 rounded-full overflow-hidden bg-white/10 border-3 border-white/30 flex items-center justify-center shadow-xl">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt="Dealer profile"
            className="w-full h-full object-cover transition-all duration-200"
          />
        ) : (
          <span className="text-4xl font-bold text-white">{initials}</span>
        )}
      </div>
    </div>
  );
}
