import logoOnDark from "@/assets/honorifico-light-text.png";
import logoOnLight from "@/assets/honorifico-dark-text.png";

type LogoVariant = "onDark" | "onLight" | "auto";

interface LogoProps {
  /**
   * onDark  -> wordmark in white (use over navy/dark surfaces)
   * onLight -> wordmark in black (use over white/cream surfaces)
   * auto    -> follows the theme (light theme = onLight, dark theme = onDark)
   */
  variant?: LogoVariant;
  className?: string;
  alt?: string;
}

/**
 * Honorífico brand mark. Picks the variant with sufficient contrast (WCAG AA)
 * for the surface it sits on.
 */
export const Logo = ({ variant = "onDark", className = "h-8", alt = "Honorífico" }: LogoProps) => {
  if (variant === "auto") {
    return (
      <>
        <img src={logoOnLight} alt={alt} className={`${className} block dark:hidden`} />
        <img src={logoOnDark} alt="" aria-hidden="true" className={`${className} hidden dark:block`} />
      </>
    );
  }

  const src = variant === "onLight" ? logoOnLight : logoOnDark;
  return <img src={src} alt={alt} className={className} />;
};

export default Logo;
