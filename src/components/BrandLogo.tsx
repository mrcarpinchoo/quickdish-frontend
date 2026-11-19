type BrandLogoProps = {
  /** Sets the size and color. The mark uses currentColor. */
  className?: string;
};

const FORK =
  "M30 26H34V38H36V26H40V38H42V26H46V42Q46 49 42 52V72Q42 76 38 76Q34 76 34 72V52Q30 49 30 42Z";
const SPOON =
  "M64 24Q72 24 72 36Q72 48 68 52V72Q68 76 64 76Q60 76 60 72V52Q56 48 56 36Q56 24 64 24Z";

/** QuickDish mark: a round plate with a fork and a spoon cut out of it. */
export function BrandLogo({ className }: BrandLogoProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 100 100"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <mask id="qd-logo-cut">
          <rect
            width="100"
            height="100"
            fill="white"
          />
          <path
            d={FORK}
            fill="black"
          />
          <path
            d={SPOON}
            fill="black"
          />
        </mask>
      </defs>
      <circle
        cx="50"
        cy="50"
        r="46"
        fill="currentColor"
        mask="url(#qd-logo-cut)"
      />
    </svg>
  );
}
