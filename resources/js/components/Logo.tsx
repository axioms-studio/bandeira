interface LogoProps {
  size?: number;
  className?: string;
}

export default function Logo({ size = 24, className = "" }: LogoProps) {
  return (
    <img
      src="/files/logo.svg"
      alt="Bandeira"
      width={size}
      height={size}
      className={className}
    />
  );
}
