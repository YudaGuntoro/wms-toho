type YkkBrandProps = {
  compact?: boolean;
  inverted?: boolean;
  size?: "default" | "large";
  showTitle?: boolean;
};

export default function YkkBrand({
  compact = false,
  inverted = false,
  size = "default",
  showTitle = true,
}: YkkBrandProps) {
  const isLarge = size === "large" && !compact;
  const markSize = compact ? "size-12" : isLarge ? "size-24" : "size-16";
  const gapSize = isLarge ? "gap-5" : "gap-3";
  const titleSize = compact ? "text-sm" : isLarge ? "text-xl" : "text-base";
  const subtitleSize = isLarge ? "text-sm" : "text-xs";

  return (
    <div className={`flex items-center ${gapSize}`}>
      <div
        className={`flex shrink-0 items-center justify-center overflow-hidden rounded-lg ${
          inverted ? "bg-white/15 ring-1 ring-white/25" : "bg-[#184F8F]"
        } ${markSize}`}
        aria-label="Toho logo"
      >
        <svg className="h-full w-full" viewBox="0 0 200 200" role="img">
          <rect width="200" height="200" fill="#1F5A94" />
          <ellipse cx="101" cy="50" rx="52" ry="14" fill="white" />
          <path
            d="M88 79C60 88 43 111 44 135C45 158 64 171 91 167C125 162 154 133 159 99C163 77 147 67 119 68V122L88 145V79Z"
            fill="white"
          />
          <path d="M88 79V145L119 122V68C106 70 96 74 88 79Z" fill="#1F5A94" />
        </svg>
      </div>
      {showTitle ? (
        <div className="min-w-0">
          <p className={`font-extrabold leading-tight ${inverted ? "text-white" : "text-[#184F8F]"} ${titleSize}`}>
            Toho Technology Indonesia
          </p>
          <p className={`font-medium ${inverted ? "text-white/75" : "text-slate-500"} ${subtitleSize}`}>Warehouse Management System</p>
        </div>
      ) : null}
    </div>
  );
}
